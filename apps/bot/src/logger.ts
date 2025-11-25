export type LogLevel = "debug" | "info" | "warn" | "error";

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const envLogLevel = process.env.LOG_LEVEL as LogLevel | undefined;
const activeLevel = envLogLevel && levelWeights[envLogLevel]
  ? envLogLevel
  : "info";

const shouldLog = (level: LogLevel): boolean => {
  return levelWeights[level] >= levelWeights[activeLevel];
};

const format = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (meta && Object.keys(meta).length > 0) {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}`;
  }
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
};

const write = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  if (!shouldLog(level)) return;
  const payload = format(level, message, meta);
  switch (level) {
    case "debug":
    case "info":
      console.log(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    case "error":
      console.error(payload);
      break;
  }
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta)
};
