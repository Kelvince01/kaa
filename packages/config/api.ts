import env from "env-var";

export type RunEnv = "development" | "staging" | "production" | "test";

type Config = {
  app: {
    name: string;
    description: string;
    url: string;
    prefix: string;
    version: string;
  };
  env: RunEnv;
  port: number;
  mongoUri: string;
  timeout: number;
  jwt: {
    name: string;
    secret: string;
    refreshTokenSecret: string;
    expiresIn: number;
    refreshTokenExpiresIn: number;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    microsoft: {
      clientId: string;
      clientSecret: string;
    };
  };
  resendApiKey: string;
  clientUrl: string;
  redisUrl: string;
  sentry: {
    dsn: string;
  };
  africasTalking: {
    apiKey: string;
    username: string;
    appName: string;
    shortCode: string;
  };
  mpesa: {
    environment: "sandbox" | "production";
    consumerKey: string;
    consumerSecret: string;
    passKey: string;
    shortCode: number;
    initiatorName: string;
    securityCredential: string;
    queueTimeoutUrl: string;
    resultUrl: string;
    callbackUrl: string;
    validationUrl: string;
    confirmationUrl: string;
    retryAttempts: number;
    retryDelay: number;
  };
  stripe: {
    secretKey: string;
    testSecretKey: string;
    webhookSecret: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    whatsappNumber: string;
  };
  google: { cloud_credentials_path: string };
  verificationRateLimit: {
    points: string;
    duration: string;
  };
  axiom: {
    token: string;
    dataset: string;
  };
  cdnUrl: string;
  cdn: {
    enabled: boolean;
    provider: string;
    maxFileSize: number;
    allowedTypes: string[];
    imageOptimization: {
      quality: number;
      formats: string[];
      sizes: number[];
    };
  };
  openai: {
    apiKey: string;
  };
  integrations: {
    propertyGuru: {
      apiKey: string;
    };
    kenyanMarketData: {
      apiKey: string;
    };
  };
};

const config: Config = {
  app: {
    name: "Kaa SaaS API",
    description: "API documentation for the Kaa SaaS application",
    url: env.get("API_URL").default("http://localhost:5000").asString(),
    prefix: env.get("API_PREFIX").default("/api/v1").asString(),
    version: env.get("API_VERSION").default("1.0.0").asString(),
  },
  env: env
    .get("NODE_ENV")
    .default("development")
    .asEnum<RunEnv>(["development", "staging", "production", "test"]),
  port: env.get("PORT").default("5000").asPortNumber(),
  mongoUri: env
    .get("MONGO_URI")
    .default("mongodb://localhost:27017/kaa-db")
    .asString(),
  timeout: env.get("TIMEOUT").default("30000").asIntPositive(),
  jwt: {
    name: "jwt",
    secret: env.get("JWT_SECRET").default("your-secret-key").asString(),
    refreshTokenSecret: env
      .get("JWT_REFRESH_TOKEN_SECRET")
      .default("your-refresh-token-secret")
      .asString(),
    expiresIn: env
      .get("JWT_EXPIRES_IN")
      .default((30 * 60).toString())
      .asIntPositive(),
    refreshTokenExpiresIn: env
      .get("JWT_REFRESH_TOKEN_EXPIRES_IN")
      .default((7 * 86_400).toString())
      .asIntPositive(),
  },
  oauth: {
    google: {
      clientId: env.get("GOOGLE_CLIENT_ID").default("").asString(),
      clientSecret: env.get("GOOGLE_CLIENT_SECRET").default("").asString(),
    },
    microsoft: {
      clientId: env.get("MICROSOFT_CLIENT_ID").default("").asString(),
      clientSecret: env.get("MICROSOFT_CLIENT_SECRET").default("").asString(),
    },
  },
  resendApiKey: env.get("RESEND_API_KEY").default("").asString(),
  clientUrl: env.get("CLIENT_URL").default("http://localhost:3000").asString(),
  redisUrl: env.get("REDIS_URL").default("redis://localhost:6379").asString(),
  sentry: {
    dsn: env.get("SENTRY_DSN").default("").asString(),
  },
  mpesa: {
    environment: env
      .get("MPESA_ENVIRONMENT")
      .default("sandbox")
      .asEnum(["sandbox", "production"]),
    consumerKey: env.get("MPESA_CONSUMER_KEY").default("").asString(),
    consumerSecret: env.get("MPESA_CONSUMER_SECRET").default("").asString(),
    passKey: env.get("MPESA_PASSKEY").default("").asString(),
    shortCode: env.get("MPESA_SHORTCODE").default("0").asIntPositive(),
    initiatorName: env.get("MPESA_INITIATOR_NAME").default("").asString(),
    securityCredential: env
      .get("MPESA_SECURITY_CREDENTIAL")
      .default("")
      .asString(),
    queueTimeoutUrl: env.get("MPESA_QUEUE_TIMEOUT_URL").default("").asString(),
    resultUrl: env.get("MPESA_RESULT_URL").default("").asString(),
    callbackUrl: env.get("MPESA_CALLBACK_URL").default("").asString(),
    validationUrl: env.get("MPESA_VALIDATION_URL").default("").asString(),
    confirmationUrl: env.get("MPESA_CONFIRMATION_URL").default("").asString(),
    retryAttempts: env.get("MPESA_RETRY_ATTEMPTS").default("3").asIntPositive(),
    retryDelay: env.get("MPESA_RETRY_DELAY").default("1000").asIntPositive(),
  },
  africasTalking: {
    apiKey: env.get("AFRICAS_TALKING_API_KEY").default("").asString(),
    username: env.get("AFRICAS_TALKING_USERNAME").default("").asString(),
    appName: env.get("AFRICAS_TALKING_APP_NAME").default("").asString(),
    shortCode: env.get("AFRICAS_TALKING_SHORT_CODE").default("").asString(),
  },
  stripe: {
    secretKey: env.get("STRIPE_SECRET_KEY").default("").asString(),
    testSecretKey: env.get("STRIPE_TEST_SECRET_KEY").default("").asString(),
    webhookSecret: env.get("STRIPE_WEBHOOK_SECRET").default("").asString(),
  },
  twilio: {
    accountSid: env.get("TWILIO_ACCOUNT_SID").default("").asString(),
    authToken: env.get("TWILIO_AUTH_TOKEN").default("").asString(),
    whatsappNumber: env.get("TWILIO_WHATSAPP_NUMBER").default("").asString(),
  },
  google: {
    cloud_credentials_path: env
      .get("GOOGLE_CLOUD_CREDENTIALS_PATH")
      .default("")
      .asString(),
  },
  verificationRateLimit: {
    points: env.get("VERIFICATION_RATE_LIMIT_POINTS").default("10").asString(),
    duration: env
      .get("VERIFICATION_RATE_LIMIT_DURATION")
      .default("60")
      .asString(),
  },
  axiom: {
    token: env.get("AXIOM_TOKEN").default("").asString(),
    dataset: env.get("AXIOM_DATASET").default("").asString(),
  },
  cdnUrl: env.get("CDN_URL").default("").asString(),
  cdn: {
    enabled: env.get("CDN_ENABLED").default("false").asBoolStrict(),
    provider: env.get("CDN_PROVIDER").default("vercel").asString(),
    maxFileSize: env
      .get("CDN_MAX_FILE_SIZE")
      .default("10485760")
      .asIntPositive(), // 10MB
    allowedTypes: env
      .get("CDN_ALLOWED_TYPES")
      .default(
        "image/jpeg,image/png,image/gif,image/webp,image/avif,application/pdf"
      )
      .asString()
      .split(","),
    imageOptimization: {
      quality: env.get("CDN_IMAGE_QUALITY").default("85").asIntPositive(),
      formats: env
        .get("CDN_IMAGE_FORMATS")
        .default("webp,avif,jpg,png")
        .asString()
        .split(","),
      sizes: env
        .get("CDN_IMAGE_SIZES")
        .default("640,750,828,1080,1200,1920")
        .asString()
        .split(",")
        .map(Number),
    },
  },
  openai: {
    apiKey: env.get("OPENAI_API_KEY").default("").asString(),
  },
  integrations: {
    propertyGuru: {
      apiKey: env.get("PROPERTY_GURU_API_KEY").default("").asString(),
    },
    kenyanMarketData: {
      apiKey: env.get("KENYAN_MARKET_DATA_API_KEY").default("").asString(),
    },
  },
};

export const RedisEvents = {
  USER: "user",
  USER_LOGIN: "user:login",
  USER_LOGOUT: "user:logout",
  USER_REGISTER: "user:register",
  USER_DELETE: "user:delete",
  USER_NEW_PROFILE: "user:new-profile",
  SYSTEM: "system",
  SYSTEM_START: "system:start",
  WALLET: "wallet",
  WALLET_PAID: "wallet:paid",
  WALLET_FUNDED: "wallet:funded",
  COUPON: "coupon",
  COUPON_USED: "coupon:used",
  MESSAGE: "message",
  MESSAGE_SENT: "message:sent",
  PASSWORD_RESET: "user:password_reset",
  EMAIL_VERIFIED: "user:email_verified",
};

export const RedisKeys = {
  USER_SESSION: (userId: string) => `session:user:${userId}`,
  USER_PROFILE: (userId: string) => `profile:user:${userId}`,
  USER: (userId: string) => `user:${userId}`,
  OTP_CODE: (email: string) => `otp:${email}`,
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
  COOLDOWN: (id: string) => `message-cooldown:${id}`,
};

export default config;
