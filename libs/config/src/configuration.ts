export default () => ({
  // Shared PostgreSQL server configuration
  // All microservices use the same PostgreSQL server but different databases
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'kodi',
    password: process.env.POSTGRES_PASSWORD || 'changeme',
  },

  // Auth microservice configuration
  auth: {
    port: parseInt(process.env.AUTH_PORT || '3001', 10),
    database: {
      name: process.env.AUTH_DB_NAME || 'kodi_auth',
      url:
        process.env.AUTH_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.AUTH_DB_NAME || 'kodi_auth'}`,
    },
  },

  // Users microservice configuration
  users: {
    port: parseInt(process.env.USERS_PORT || '3002', 10),
    database: {
      name: process.env.USERS_DB_NAME || 'kodi_users',
      url:
        process.env.USERS_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.USERS_DB_NAME || 'kodi_users'}`,
    },
  },

  // City microservice configuration
  city: {
    port: parseInt(process.env.CITY_PORT || '3003', 10),
    database: {
      name: process.env.CITY_DB_NAME || 'kodi_city',
      url:
        process.env.CITY_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.CITY_DB_NAME || 'kodi_city'}`,
    },
  },

  // Core microservice configuration
  core: {
    port: parseInt(process.env.CORE_PORT || '3004', 10),
    database: {
      name: process.env.CORE_DB_NAME || 'kodi_core',
      url:
        process.env.CORE_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.CORE_DB_NAME || 'kodi_core'}`,
    },
  },

  // Notification microservice configuration
  notification: {
    port: parseInt(process.env.NOTIFICATION_PORT || '3005', 10),
    database: {
      name: process.env.NOTIFICATION_DB_NAME || 'kodi_notification',
      url:
        process.env.NOTIFICATION_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.NOTIFICATION_DB_NAME || 'kodi_notification'}`,
    },
  },

  // Scheduler microservice configuration
  scheduler: {
    port: parseInt(process.env.SCHEDULER_PORT || '3006', 10),
    database: {
      name: process.env.SCHEDULER_DB_NAME || 'kodi_scheduler',
      url:
        process.env.SCHEDULER_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.SCHEDULER_DB_NAME || 'kodi_scheduler'}`,
    },
  },

  // Admin microservice configuration
  admin: {
    port: parseInt(process.env.ADMIN_PORT || '3008', 10),
    database: {
      name: process.env.ADMIN_DB_NAME || 'kodi_admin',
      url:
        process.env.ADMIN_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.ADMIN_DB_NAME || 'kodi_admin'}`,
    },
  },

  // Terminal microservice configuration
  terminal: {
    port: parseInt(process.env.TERMINAL_PORT || '3009', 10),
    database: {
      name: process.env.TERMINAL_DB_NAME || 'kodi_terminal',
      url:
        process.env.TERMINAL_DATABASE_URL ||
        `postgresql://${process.env.POSTGRES_USER || 'kodi'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.TERMINAL_DB_NAME || 'kodi_terminal'}`,
    },
  },

  // Environment configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'kodi-service',
  serviceVersion: process.env.SERVICE_VERSION || '1.0.0',

  // Application configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
  logDir: process.env.LOG_DIR || './logs',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Throttling configuration
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // API configuration
  apiPrefix: process.env.API_PREFIX || 'api',
  enableApiGatewayPrefix: process.env.ENABLE_API_GATEWAY_PREFIX === 'true',
  apiGatewayBaseUrl: process.env.API_GATEWAY_BASE_URL,

  // Swagger configuration
  swagger: {
    title: process.env.SWAGGER_TITLE || 'KODI Microservices API',
    description: process.env.SWAGGER_DESCRIPTION || 'API documentation for KODI microservices',
    version: process.env.SWAGGER_VERSION || '1.0',
  },

  // I18n configuration
  i18n: {
    defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',
    pushNotificationDefaultLanguage: process.env.PUSH_NOTIFICATION_DEFAULT_LANGUAGE || 'de',
    supportedLanguages: process.env.I18N_SUPPORTED_LANGUAGES?.split(',') || [
      'de',
      'en',
      'dk',
      'no',
      'se',
      'ar',
      'fa',
      'tr',
      'ru',
      'uk',
    ],
    /** FCM tile broadcast topic suffixes (mobile: da/sv not dk/se). Comma-separated; unset = built-in list. */
    fcmTileTopicLocales: process.env.I18N_FCM_TILE_TOPIC_LOCALES
      ? process.env.I18N_FCM_TILE_TOPIC_LOCALES.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Terms of use configuration
  terms: {
    defaultLocale: process.env.TERMS_DEFAULT_LOCALE || 'en',
    gracePeriodDays: parseInt(process.env.TERMS_GRACE_PERIOD_DAYS || '7', 10),
  },

  // Password reset configuration
  passwordReset: {
    expiryHours: parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS || '1', 10),
    maxAttempts: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS || '3', 10),
  },

  // RabbitMQ configuration
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    user: process.env.RABBITMQ_USER || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'kodi_queue',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Hetzner Object Storage configuration
  storage: {
    endpoint: process.env.HETZNER_STORAGE_ENDPOINT, // e.g., https://fsn1.your-objectstorage.com
    region: process.env.HETZNER_STORAGE_REGION || 'fsn1', // e.g., fsn1, nbg1
    accessKeyId: process.env.HETZNER_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.HETZNER_STORAGE_SECRET_ACCESS_KEY,
    defaultBucket: process.env.HETZNER_STORAGE_DEFAULT_BUCKET,
  },

  // Email configuration
  systemEmailId: process.env.SYSTEM_EMAIL_ID,

  // Email/SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    // Optional: only set if provided in env
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    // Optional: only set if provided in env
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : undefined,
    // Optional path for SMTP server (e.g., "/webmail-rc")
    path: process.env.SMTP_PATH,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: process.env.SYSTEM_EMAIL_ID || process.env.SMTP_USER || 'noreply@kodi.example.com',
    // Optional: only set if provided in env
    tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED
      ? {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        }
      : undefined,
  },

  // Client URL
  clientURL: process.env.CLIENT_URL,

  // Frontend Base URL (for verification links)
  frontendBaseUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // Translation configuration
  translations: {
    defaultSourceLocale: process.env.TRANSLATIONS_DEFAULT_SOURCE_LOCALE || 'en',
    autoTranslateOnRead: process.env.TRANSLATIONS_AUTO_TRANSLATE_ON_READ !== 'false',
    autoTranslateOnSync: process.env.TRANSLATIONS_AUTO_TRANSLATE_ON_SYNC !== 'false',
    maxConcurrent: parseInt(process.env.TRANSLATION_MAX_CONCURRENT || '3', 10),
    maxRequeueAttempts: parseInt(process.env.TRANSLATION_MAX_REQUEUE_ATTEMPTS || '3', 10),
    deepl: {
      apiKey: process.env.DEEPL_API_KEY || '',
      apiUrl: process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate',
      maxRetries: parseInt(process.env.DEEPL_MAX_RETRIES || '3', 10),
      retryDelayMs: parseInt(process.env.DEEPL_RETRY_DELAY_MS || '1000', 10),
    },
  },
});
