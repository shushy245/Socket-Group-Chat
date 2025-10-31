import winston from 'winston';

export interface Logger {
    error(message: string): void;
    error(metadata: Record<string, unknown>, message: string): void;
    warn(message: string): void;
    warn(metadata: Record<string, unknown>, message: string): void;
    info(message: string): void;
    info(metadata: Record<string, unknown>, message: string): void;
    debug(message: string): void;
    debug(metadata: Record<string, unknown>, message: string): void;
    child(bindings: Record<string, unknown>): Logger;
}

class WinstonLogger implements Logger {
    private logger: winston.Logger;

    constructor(logger: winston.Logger) {
        this.logger = logger;
    }

    error(message: string): void;
    error(metadata: Record<string, unknown>, message: string): void;
    error(metadata: Record<string, unknown> | string, message?: string): void {
        if (typeof metadata === 'string') {
            this.logger.error(metadata);
        } else {
            this.logger.error(message || '', metadata);
        }
    }

    warn(message: string): void;
    warn(metadata: Record<string, unknown>, message: string): void;
    warn(metadata: Record<string, unknown> | string, message?: string): void {
        if (typeof metadata === 'string') {
            this.logger.warn(metadata);
        } else {
            this.logger.warn(message || '', metadata);
        }
    }

    info(message: string): void;
    info(metadata: Record<string, unknown>, message: string): void;
    info(metadata: Record<string, unknown> | string, message?: string): void {
        if (typeof metadata === 'string') {
            this.logger.info(metadata);
        } else {
            this.logger.info(message || '', metadata);
        }
    }

    debug(message: string): void;
    debug(metadata: Record<string, unknown>, message: string): void;
    debug(metadata: Record<string, unknown> | string, message?: string): void {
        if (typeof metadata === 'string') {
            this.logger.debug(metadata);
        } else {
            this.logger.debug(message || '', metadata);
        }
    }

    child(bindings: Record<string, unknown>): Logger {
        return new WinstonLogger(this.logger.child(bindings));
    }
}

export function createLogger(): Logger {
    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
        ),
        defaultMeta: { service: 'chat-backend' },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            }),
        ],
    });

    return new WinstonLogger(logger);
}

export const logger = createLogger();
