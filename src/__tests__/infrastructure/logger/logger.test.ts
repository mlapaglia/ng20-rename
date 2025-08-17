import { LogLevel, ConsoleLogger, SilentLogger, LoggerFactory } from '../../../infrastructure/logger/logger';

describe('Logger', () => {
  describe('LogLevel', () => {
    it('should have correct enum values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });

  describe('ConsoleLogger', () => {
    let consoleSpy: {
      debug: jest.SpyInstance;
      log: jest.SpyInstance;
      warn: jest.SpyInstance;
      error: jest.SpyInstance;
    };

    beforeEach(() => {
      consoleSpy = {
        debug: jest.spyOn(console, 'debug').mockImplementation(),
        log: jest.spyOn(console, 'log').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation()
      };
    });

    afterEach(() => {
      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    describe('with default log level (INFO)', () => {
      let logger: ConsoleLogger;

      beforeEach(() => {
        logger = new ConsoleLogger();
      });

      it('should not log debug messages', () => {
        logger.debug('Debug message');
        expect(consoleSpy.debug).not.toHaveBeenCalled();
      });

      it('should log info messages', () => {
        logger.info('Info message');
        expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] Info message', '');
      });

      it('should log warn messages', () => {
        logger.warn('Warn message');
        expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] Warn message', '');
      });

      it('should log error messages', () => {
        logger.error('Error message');
        expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] Error message', '');
      });
    });

    describe('with DEBUG log level', () => {
      let logger: ConsoleLogger;

      beforeEach(() => {
        logger = new ConsoleLogger(LogLevel.DEBUG);
      });

      it('should log debug messages', () => {
        logger.debug('Debug message');
        expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Debug message', '');
      });

      it('should log all message types', () => {
        logger.debug('Debug');
        logger.info('Info');
        logger.warn('Warn');
        logger.error('Error');

        expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Debug', '');
        expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] Info', '');
        expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] Warn', '');
        expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] Error', '');
      });
    });

    describe('with ERROR log level', () => {
      let logger: ConsoleLogger;

      beforeEach(() => {
        logger = new ConsoleLogger(LogLevel.ERROR);
      });

      it('should only log error messages', () => {
        logger.debug('Debug');
        logger.info('Info');
        logger.warn('Warn');
        logger.error('Error');

        expect(consoleSpy.debug).not.toHaveBeenCalled();
        expect(consoleSpy.log).not.toHaveBeenCalled();
        expect(consoleSpy.warn).not.toHaveBeenCalled();
        expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] Error', '');
      });
    });

    describe('with context', () => {
      let logger: ConsoleLogger;

      beforeEach(() => {
        logger = new ConsoleLogger(LogLevel.DEBUG);
      });

      it('should log context as JSON', () => {
        const context = { file: 'test.ts', line: 10 };
        logger.info('Message with context', context);

        expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] Message with context', JSON.stringify(context, null, 2));
      });

      it('should handle empty context', () => {
        logger.info('Message without context');
        expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] Message without context', '');
      });
    });
  });

  describe('SilentLogger', () => {
    let logger: SilentLogger;

    beforeEach(() => {
      logger = new SilentLogger();
    });

    it('should not call console methods', () => {
      const consoleSpy = {
        debug: jest.spyOn(console, 'debug').mockImplementation(),
        log: jest.spyOn(console, 'log').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation()
      };

      logger.debug();
      logger.info();
      logger.warn();
      logger.error();

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();

      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    it('should implement ILogger interface', () => {
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe('LoggerFactory', () => {
    afterEach(() => {
      // Reset to default logger
      LoggerFactory.setLogger(new ConsoleLogger());
    });

    it('should have default console logger', () => {
      const logger = LoggerFactory.getLogger();
      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should allow setting custom logger', () => {
      const customLogger = new SilentLogger();
      LoggerFactory.setLogger(customLogger);

      const retrievedLogger = LoggerFactory.getLogger();
      expect(retrievedLogger).toBe(customLogger);
    });

    it('should create console logger with default level', () => {
      const logger = LoggerFactory.createConsoleLogger();
      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should create console logger with custom level', () => {
      const logger = LoggerFactory.createConsoleLogger(LogLevel.ERROR);
      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should create silent logger', () => {
      const logger = LoggerFactory.createSilentLogger();
      expect(logger).toBeInstanceOf(SilentLogger);
    });
  });
});
