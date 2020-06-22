import Logger from 'bunyan'
import bunyanFormat from 'bunyan-format'
import supportsColor from 'supports-color'
function toBunyanLogLevel(level: string) {
  switch (level) {
    case 'info':
    case 'trace':
    case 'debug':
    case 'warn':
    case 'error':
    case 'fatal':
    case undefined:
      return level
    default:
      throw new Error('Invalid log level')
  }
}

function toBunyanFormat(format: string) {
  switch (format) {
    case 'short':
    case 'long':
    case 'simple':
    case 'json':
    case 'bunyan':
    case undefined:
      return format
    default:
      throw new Error('Invalid log format')
  }
}

const log = new Logger({
  level: toBunyanLogLevel(process.env.LOG_LEVEL || 'info'),
  name: 'my-app',
  stream: new bunyanFormat({
    color: supportsColor.stdout,
    levelInString: !!process.env.LOG_LEVEL_IN_STRING,
    outputMode: toBunyanFormat(process.env.LOG_FORMAT || 'short')
  })
});

export {
  log,
  Logger
}