# Saga Orchestrator Library

A shared library for implementing the Saga Pattern in distributed microservices transactions.

## What is the Saga Pattern?

The Saga Pattern is a distributed transaction management approach that coordinates multiple services to complete a business transaction. Unlike traditional ACID transactions, Saga uses a sequence of local transactions, each with its own compensation action for rollback.

## When to Use Saga Pattern

Use the Saga orchestrator when you need to:

### ✅ Use Saga Pattern For:

1. **Multi-Service Transactions**
   - Operations spanning 2+ microservices
   - When services have independent databases
   - Cross-service business operations

2. **Operations Requiring Rollback**
   - Complex operations that need compensation logic
   - When partial failures should trigger cleanup
   - Operations where "eventual consistency" is acceptable

3. **Long-Running Transactions**
   - Operations that take seconds/minutes
   - Asynchronous workflows
   - Multi-step business processes

4. **Distributed Business Logic**
   - Order processing (create order → reserve inventory → charge payment)
   - User registration (create user → assign city → send welcome email)
   - Data synchronization across services
   - Resource allocation (book hotel → reserve car → confirm flight)

### ❌ Don't Use Saga Pattern For:

1. **Simple Single-Service Operations**
   - CRUD operations within one service
   - Read-only operations
   - Single database transactions

2. **Synchronous, Fast Operations**
   - Simple lookups
   - Basic validations
   - Quick calculations

3. **Operations Without Compensation Needs**
   - Idempotent operations
   - Logging/auditing
   - Fire-and-forget events

## How It Works

### Saga Lifecycle

```
1. CREATE SAGA
   └─> Define transaction steps with compensation actions

2. EXECUTE STEPS (Sequentially)
   └─> Step 1: Execute action
   └─> Step 2: Execute action
   └─> Step 3: Execute action
   └─> ...

3. SUCCESS PATH
   └─> All steps complete → Saga COMPLETED

4. FAILURE PATH
   └─> Any step fails → Start COMPENSATION
       └─> Rollback Step 3 (reverse order)
       └─> Rollback Step 2
       └─> Rollback Step 1
       └─> Saga COMPENSATED
```

### Step Structure

Each step contains:

- `stepId`: Unique identifier
- `service`: Target microservice
- `action`: Operation to perform
- `payload`: Data for the operation
- `compensation`: Rollback action (optional but recommended)

## Usage Examples

### Example 1: User Registration Saga

```typescript
// Creating a saga for user registration
const sagaId = await sagaOrchestrator.createSaga('USER_REGISTRATION', [
  {
    stepId: 'CREATE_USER',
    service: 'users',
    action: 'CREATE',
    payload: { email, password, firstName, lastName },
    compensation: {
      action: 'DELETE',
      payload: { userId: '{{result.userId}}' }, // Uses result from CREATE_USER step
    },
  },
  {
    stepId: 'ASSIGN_CITY',
    service: 'core',
    action: 'ASSIGN_CITY_ADMIN',
    payload: { userId: '{{steps.CREATE_USER.result.userId}}', cityId },
    compensation: {
      action: 'REMOVE_ASSIGNMENT',
      payload: { userId: '{{steps.CREATE_USER.result.userId}}', cityId },
    },
  },
  {
    stepId: 'SEND_WELCOME_EMAIL',
    service: 'notification',
    action: 'SEND_EMAIL',
    payload: { userId: '{{steps.CREATE_USER.result.userId}}', template: 'WELCOME' },
    // No compensation - email already sent, can't unsend
  },
]);

// Execute steps
let currentSaga = await sagaOrchestrator.getSaga(sagaId);
let stepIndex = 0;

while (stepIndex < currentSaga.steps.length) {
  const step = currentSaga.steps[stepIndex];

  try {
    // Execute step via RabbitMQ
    const result = await rabbitmq.send(`${step.service}.${step.action}`, step.payload);

    // Mark step as complete
    const { nextStep, completed } = await sagaOrchestrator.executeStep(sagaId, result);

    if (completed) {
      logger.log('Registration saga completed successfully');
      break;
    }

    stepIndex++;
    currentSaga = await sagaOrchestrator.getSaga(sagaId);
  } catch (error) {
    // Step failed - start compensation
    await sagaOrchestrator.failStep(sagaId, error.message);
    const compensationSteps = await sagaOrchestrator.compensate(sagaId);

    // Execute compensation in reverse order
    for (const compStep of compensationSteps) {
      await rabbitmq.send(
        `${compStep.service}.${compStep.compensation.action}`,
        compStep.compensation.payload,
      );
    }

    await sagaOrchestrator.markCompensated(sagaId);
    throw new Error('Registration failed and rolled back');
  }
}
```

### Example 2: Order Processing Saga

```typescript
const sagaId = await sagaOrchestrator.createSaga('ORDER_PROCESSING', [
  {
    stepId: 'CREATE_ORDER',
    service: 'orders',
    action: 'CREATE',
    payload: { userId, items },
    compensation: { action: 'CANCEL_ORDER', payload: { orderId: '{{result.orderId}}' } },
  },
  {
    stepId: 'RESERVE_INVENTORY',
    service: 'inventory',
    action: 'RESERVE',
    payload: { orderId: '{{steps.CREATE_ORDER.result.orderId}}', items },
    compensation: {
      action: 'RELEASE',
      payload: { orderId: '{{steps.CREATE_ORDER.result.orderId}}' },
    },
  },
  {
    stepId: 'CHARGE_PAYMENT',
    service: 'payment',
    action: 'CHARGE',
    payload: { orderId: '{{steps.CREATE_ORDER.result.orderId}}', amount },
    compensation: { action: 'REFUND', payload: { transactionId: '{{result.transactionId}}' } },
  },
  {
    stepId: 'SEND_CONFIRMATION',
    service: 'notification',
    action: 'SEND_EMAIL',
    payload: { orderId: '{{steps.CREATE_ORDER.result.orderId}}' },
    // No compensation needed
  },
]);
```

### Example 3: City Assignment Saga (Current Auth Service Use Case)

```typescript
// When assigning a city admin, we might need:
const sagaId = await sagaOrchestrator.createSaga('ASSIGN_CITY_ADMIN', [
  {
    stepId: 'VERIFY_USER',
    service: 'users',
    action: 'FIND_BY_ID',
    payload: { userId },
    // No compensation - read operation
  },
  {
    stepId: 'ASSIGN_CITY',
    service: 'core',
    action: 'ASSIGN_CITY_ADMIN',
    payload: { userId, cityId, role },
    compensation: {
      action: 'REMOVE_ASSIGNMENT',
      payload: { userId, cityId },
    },
  },
  {
    stepId: 'UPDATE_PERMISSIONS',
    service: 'auth',
    action: 'REFRESH_TOKEN',
    payload: { userId },
    // No compensation - token refresh is idempotent
  },
]);
```

## Integration

### 1. Import the Module

```typescript
import { SagaModule } from '@kodi/saga';

@Module({
  imports: [
    SagaModule, // Adds SagaOrchestratorService
    // ... other modules
  ],
})
export class YourModule {}
```

### 2. Inject the Service

```typescript
import { SagaOrchestratorService } from '@kodi/saga';

@Injectable()
export class YourService {
  constructor(
    private readonly sagaOrchestrator: SagaOrchestratorService,
    private readonly rabbitmq: RabbitMQService,
  ) {}
}
```

## Best Practices

1. **Always Define Compensation Actions**
   - Each step that modifies state should have a compensation
   - Read operations don't need compensation

2. **Use Descriptive Step IDs**
   - Make step IDs meaningful: `CREATE_USER`, `ASSIGN_CITY`, not `STEP1`, `STEP2`

3. **Handle Timeouts**
   - Set appropriate timeouts for RabbitMQ calls
   - Consider saga TTL (default 1 hour)

4. **Log Everything**
   - Saga state changes
   - Step executions
   - Compensation actions

5. **Idempotent Operations**
   - Make compensation actions idempotent
   - Handle duplicate compensation calls

6. **Error Handling**
   - Always catch errors and trigger compensation
   - Log failure reasons for debugging

7. **State Management**
   - Saga state is stored in Redis (1 hour TTL)
   - Monitor saga states for stuck transactions

## Saga Status Flow

```
PENDING → COMPLETED (success path)
PENDING → COMPENSATING → COMPENSATED (failure path)
```

## Monitoring

Monitor saga execution:

- Track saga completion rates
- Alert on stuck sagas (longer than expected)
- Monitor compensation rates
- Log saga durations

## Limitations

1. **Eventual Consistency**: Not ACID transactions
2. **Compensation Complexity**: Requires careful design
3. **State Management**: Redis must be available
4. **Orchestration Overhead**: Not suitable for simple operations

## Summary

The Saga Pattern is essential for distributed transactions in microservices. Use it when you need to coordinate multiple services with rollback capability, but avoid it for simple single-service operations.
