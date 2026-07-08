import * as Joi from 'joi';

/**
 * Validates process.env at bootstrap via ConfigModule.
 * Production enforces secrets for auth, payments, and ops dependencies.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required (Prisma)',
  }),

  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(8).default('dev-jwt-secret-change-me-in-production-min-32'),
  }),

  JWT_ACCESS_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).optional(),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),

  JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).optional(),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

  GOOGLE_CLIENT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().optional(),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  PAYMENT_GATEWAY: Joi.string()
    .uppercase()
    .valid('SANDBOX', 'PAYSTACK', 'FLUTTERWAVE', 'STRIPE')
    .default('SANDBOX'),

  PAYMENT_GATEWAY_BY_COUNTRY: Joi.string().allow('', null).optional(),
  PAYMENT_GATEWAY_BY_CURRENCY: Joi.string().allow('', null).optional(),

  STRIPE_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.when('PAYMENT_GATEWAY', {
      is: 'STRIPE',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null).optional(),
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  STRIPE_WEBHOOK_SECRET: Joi.string().allow('', null).optional(),

  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(20),
  THROTTLE_LOGIN_LIMIT: Joi.number().default(5),
  THROTTLE_REDIS_PREFIX: Joi.string().default('mech:throttle'),

  DEFAULT_CURRENCY: Joi.string().length(3).uppercase().default('NGN'),
  DEFAULT_LOCALE: Joi.string().default('en-NG'),

  PAYSTACK_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.when('PAYMENT_GATEWAY', {
      is: 'PAYSTACK',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null).optional(),
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  PAYSTACK_WEBHOOK_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.when('PAYMENT_GATEWAY', {
      is: 'PAYSTACK',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null).optional(),
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  FLW_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.when('PAYMENT_GATEWAY', {
      is: 'FLUTTERWAVE',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null).optional(),
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  FLW_WEBHOOK_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.when('PAYMENT_GATEWAY', {
      is: 'FLUTTERWAVE',
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().allow('', null).optional(),
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('', null).optional(),
  REDIS_URL: Joi.string().uri().allow('', null).optional(),

  ALLOWED_ORIGINS: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  SWAGGER_ENABLED: Joi.boolean().default(false),

  API_KEY_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(16).required(),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  ENCRYPTION_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().allow('', null).optional(),
  }),

  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
  AWS_REGION: Joi.string().allow('', null).optional(),
  AWS_S3_BUCKET: Joi.string().allow('', null).optional(),
  AWS_ACCESS_KEY_ID: Joi.string().allow('', null).optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('', null).optional(),
  STORAGE_PUBLIC_BASE_URL: Joi.string().uri().allow('', null).optional(),

  FRONTEND_URL: Joi.string().uri().allow('', null).optional(),
}).unknown(true);

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
  convert: true,
};
