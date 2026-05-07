export enum SagaStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
}

export interface SagaStep {
  stepId: string;
  service: string;
  action: string;
  payload: any;
  status: SagaStatus;
  result?: any;
  error?: string;
  compensation?: {
    action: string;
    payload: any;
  };
}

export interface SagaState {
  sagaId: string;
  transactionType: string;
  steps: SagaStep[];
  currentStep: number;
  status: SagaStatus;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}
