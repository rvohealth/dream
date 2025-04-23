import * as path from 'node:path'
import * as winston from 'winston'

export default function logger(rootPath: string) {
  const logDirectory = path.join(rootPath, 'logs')

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'test' },
    transports: [
      new winston.transports.Console({ format: winston.format.simple() }),
      new winston.transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logDirectory, 'combined.log') }),
    ],
  })

  return logger
}
