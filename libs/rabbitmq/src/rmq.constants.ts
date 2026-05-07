/**
 * RabbitMQ Exchange Name
 */
export const RABBITMQ_EXCHANGE = 'kodi_exchange';

/**
 * RabbitMQ Exchange Type
 */
export const RABBITMQ_EXCHANGE_TYPE = 'topic' as const;

/**
 * Service name constants
 */
export const RABBITMQ_SERVICES = {
  AUTH: 'auth',
  USERS: 'users',
  CORE: 'core',
  CITY: 'city',
  NOTIFICATION: 'notification',
  SCHEDULER: 'scheduler',
  TERMINAL: 'terminal',
  ADMIN: 'admin',
} as const;

/**
 * Generate queue name for a service
 */
export function getQueueName(serviceName: string): string {
  return `kodi_${serviceName}_queue`;
}

/**
 * Generate DLX queue name for a service
 */
export function getDlxQueueName(serviceName: string): string {
  return `kodi_${serviceName}_dlx`;
}

/**
 * Generate routing key pattern for a service
 */
export function getRoutingKeyPattern(serviceName: string): string {
  return `${serviceName}.*`;
}

/**
 * Event patterns for the microservices
 * These are used as routing keys when publishing messages
 */
export const RabbitMQPatterns = {
  // User events (fire and forget)
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // User request-response patterns
  USER_FIND_BY_EMAIL: 'user.findByEmail',
  USER_FIND_BY_USERNAME: 'user.findByUsername',
  USER_FIND_BY_ID: 'user.findById',
  USER_GET_PROFILE: 'user.getProfile',
  USER_CREATE_GUEST: 'user.createGuest',
  USER_FIND_BY_DEVICE: 'user.findByDevice',
  USER_CONVERT_GUEST: 'user.convertGuest',
  USER_FIND_BY_CITY: 'user.findByCity',
  USER_FIND_ALL_ACTIVE: 'user.findAllActive',
  USER_UPDATE_ROLE: 'user.updateRole',
  USER_GET_DEVICES: 'user.getDevices',
  USER_REGISTER_DEVICE: 'user.registerDevice',
  USER_DELETE_DEVICE: 'user.deleteDevice',
  USER_GET_TOPIC_SUBSCRIPTIONS: 'user.getTopicSubscriptions',
  USER_SUBSCRIBE_TOPIC: 'user.subscribeTopic',
  USER_UNSUBSCRIBE_TOPIC: 'user.unsubscribeTopic',

  // Core request-response patterns
  CORE_GET_USER_CITIES: 'core.getUserCities',
  CORE_GET_USER_ASSIGNMENTS: 'core.getUserAssignments',
  CORE_ASSIGN_CITY_ADMIN: 'core.assignCityAdmin',
  CORE_CREATE_USER_CITY_ASSIGNMENT: 'core.createUserCityAssignment',
  // Core events (fire and forget)
  CORE_OPERATION: 'core.operation',
  // Notification events
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
  NOTIFICATION_SEND_TOPIC: 'notification.sendTopic',

  // Verification events
  VERIFICATION_REQUIRED: 'verification.required',
  VERIFICATION_SENT: 'verification.sent',
  VERIFICATION_VERIFIED: 'verification.verified',
  VERIFICATION_FAILED: 'verification.failed',
  VERIFICATION_CANCELLED: 'verification.cancelled',
  // Verification request-response patterns
  VERIFICATION_RESEND: 'verification.resend',

  // City events
  CITY_CREATED: 'city.created',
  CITY_UPDATED: 'city.updated',
  CITY_DELETED: 'city.deleted',

  // City request-response patterns
  CITY_FIND_BY_ID: 'city.findById',
  CITY_FIND_BY_KEY: 'city.findByKey',

  // Scheduler events
  SCHEDULE_EXECUTE: 'schedule.execute',
  SCHEDULE_COMPLETED: 'schedule.completed',
  // Translation events (processed by the scheduler service)
  // Note: we use the "schedule" prefix so messages route to the scheduler queue (schedule.*)
  TRANSLATION_AUTO_TRANSLATE: 'schedule.autoTranslate',
  // Listing favorite reminders (processed by the core service)
  LISTING_FAVORITE_REMINDERS_RUN: 'core.favoriteRemindersRun',
  // Listing expired events cleanup (processed by the core service)
  LISTING_EXPIRE_CLEANUP: 'core.expireEventsCleanup',

  // Terms request-response patterns
  TERMS_GET_LATEST: 'terms.getLatest',
  TERMS_CHECK_ACCEPTANCE: 'terms.checkAcceptance',
  TERMS_GET_USER_VERSION: 'terms.getUserVersion',

  // Password reset events
  PASSWORD_RESET_REQUESTED: 'passwordReset.requested',
  PASSWORD_RESET_SENT: 'passwordReset.sent',
  PASSWORD_RESET_COMPLETED: 'passwordReset.completed',
  PASSWORD_RESET_FAILED: 'passwordReset.failed',
  PASSWORD_RESET_VERIFY: 'passwordReset.verify',
  PASSWORD_RESET_MARK_USED: 'passwordReset.markUsed',
} as const;

/**
 * Current message contract version
 */
export const MESSAGE_VERSION = '1.0';

/**
 * RabbitMQ Client Injection Token
 * Use with @Inject(RABBITMQ_CLIENT) to inject the ClientProxy
 */
export const RABBITMQ_CLIENT = 'RABBITMQ_CLIENT';
