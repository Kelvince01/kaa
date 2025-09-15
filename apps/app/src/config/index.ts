import { config as configKaa } from "@kaa/config";

type AppConfig = {
  apiUrl: string;
};

export const config: AppConfig = {
  apiUrl: `${configKaa.backendUrl}/api/v1`,
};
