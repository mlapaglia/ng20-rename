/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements ILogger {
  constructor(private minLevel: LogLevel = LogLevel.INFO) {}

  debug(message: string, context?: Record<string, any>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.minLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }
}

/**
 * Silent logger for testing
 */
export class SilentLogger implements ILogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Logger factory
 */
export class LoggerFactory {
  private static instance: ILogger = new ConsoleLogger();

  static setLogger(logger: ILogger): void {
    this.instance = logger;
  }

  static getLogger(): ILogger {
    return this.instance;
  }

  static createConsoleLogger(minLevel: LogLevel = LogLevel.INFO): ILogger {
    return new ConsoleLogger(minLevel);
  }

  static createSilentLogger(): ILogger {
    return new SilentLogger();
  }
}
