import type { MiddlewareFn } from "telegraf";
import type { AppConfig } from "../config";
import type { NebulaContext } from "../types";

export const createConfigMiddleware = (config: AppConfig): MiddlewareFn<NebulaContext> => {
  return async (ctx, next) => {
    ctx.config = config;
    return next();
  };
};
