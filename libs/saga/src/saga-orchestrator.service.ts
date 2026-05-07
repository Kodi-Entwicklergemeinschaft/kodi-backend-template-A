import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@kodi/redis';
import { SagaState, SagaStep, SagaStatus } from '@kodi/contracts';

@Injectable()
export class SagaOrchestratorService {
  private readonly logger = new Logger(SagaOrchestratorService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Create a new saga transaction
   */
  async createSaga(
    transactionType: string,
    steps: Omit<SagaStep, 'status' | 'result' | 'error'>[],
  ): Promise<string> {
    const sagaId = `saga:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    const saga: SagaState = {
      sagaId,
      transactionType,
      steps: steps.map((step) => ({ ...step, status: SagaStatus.PENDING })),
      currentStep: 0,
      status: SagaStatus.PENDING,
      createdAt: new Date(),
    };

    // Store saga state in Redis with 1 hour TTL
    await this.redis.set(`saga:${sagaId}`, JSON.stringify(saga), 3600);

    this.logger.log(`Created saga: ${sagaId} for transaction: ${transactionType}`);
    return sagaId;
  }

  /**
   * Execute next step in saga
   */
  async executeStep(
    sagaId: string,
    stepResult: any,
  ): Promise<{ nextStep?: SagaStep; completed: boolean }> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    // Mark current step as completed
    if (saga.steps[saga.currentStep]) {
      saga.steps[saga.currentStep].status = SagaStatus.COMPLETED;
      saga.steps[saga.currentStep].result = stepResult;
    }

    // Move to next step
    saga.currentStep++;

    // Check if all steps are completed
    if (saga.currentStep >= saga.steps.length) {
      saga.status = SagaStatus.COMPLETED;
      saga.completedAt = new Date();
      await this.saveSaga(saga);
      this.logger.log(`Saga completed: ${sagaId}`);
      return { completed: true };
    }

    // Update saga state
    await this.saveSaga(saga);

    const nextStep = saga.steps[saga.currentStep];
    this.logger.log(`Saga ${sagaId} moving to step ${saga.currentStep + 1}: ${nextStep.stepId}`);

    return { nextStep, completed: false };
  }

  /**
   * Mark step as failed and start compensation
   */
  async failStep(sagaId: string, error: string): Promise<void> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    // Mark current step as failed
    if (saga.steps[saga.currentStep]) {
      saga.steps[saga.currentStep].status = SagaStatus.FAILED;
      saga.steps[saga.currentStep].error = error;
    }

    saga.status = SagaStatus.COMPENSATING;
    await this.saveSaga(saga);

    this.logger.warn(
      `Saga ${sagaId} failed at step ${saga.currentStep + 1}, starting compensation`,
    );
  }

  /**
   * Compensate completed steps (rollback in reverse order)
   */
  async compensate(sagaId: string): Promise<SagaStep[]> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    const compensationSteps: SagaStep[] = [];

    // Compensate in reverse order (only completed steps)
    for (let i = saga.currentStep - 1; i >= 0; i--) {
      const step = saga.steps[i];
      if (step.status === SagaStatus.COMPLETED && step.compensation) {
        step.status = SagaStatus.COMPENSATING;
        compensationSteps.push(step);
      }
    }

    await this.saveSaga(saga);

    this.logger.log(`Saga ${sagaId} compensating ${compensationSteps.length} steps`);
    return compensationSteps;
  }

  /**
   * Mark compensation as complete
   */
  async markCompensated(sagaId: string): Promise<void> {
    const saga = await this.getSaga(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    // Mark all compensating steps as compensated
    saga.steps.forEach((step) => {
      if (step.status === SagaStatus.COMPENSATING) {
        step.status = SagaStatus.COMPENSATED;
      }
    });

    saga.status = SagaStatus.COMPENSATED;
    await this.saveSaga(saga);

    this.logger.log(`Saga ${sagaId} compensation completed`);
  }

  /**
   * Get saga state
   */
  async getSaga(sagaId: string): Promise<SagaState | null> {
    const sagaJson = await this.redis.get<string>(`saga:${sagaId}`);
    if (!sagaJson) {
      return null;
    }

    const saga = JSON.parse(sagaJson) as SagaState;
    // Parse dates
    saga.createdAt = new Date(saga.createdAt);
    if (saga.completedAt) {
      saga.completedAt = new Date(saga.completedAt);
    }

    return saga;
  }

  /**
   * Save saga state
   */
  private async saveSaga(saga: SagaState): Promise<void> {
    await this.redis.set(`saga:${saga.sagaId}`, JSON.stringify(saga), 3600);
  }
}
