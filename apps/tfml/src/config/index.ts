import env from "env-var";

const port = env.get("PORT").default(5001).asPortNumber();

type Config = {
  app: {
    port: number;
    url: string;
    prefix: string;
    version: string;
    logoUrl: string;
  };
  jwt: {
    name: string;
    secret: string;
    refreshTokenSecret: string;
    expiresIn: number;
    refreshTokenExpiresIn: number;
  };
};

export const config: Config = {
  app: {
    port: env.get("PORT").default(5001).asPortNumber(),
    url: env.get("API_URL").default(`http://localhost:${port}`).asString(),
    prefix: env.get("API_PREFIX").default("/api/v1").asString(),
    version: env.get("API_VERSION").default("1.0.0").asString(),
    logoUrl: env.get("LOGO_URL").default("/images/logo.png").asString(),
  },
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
};
