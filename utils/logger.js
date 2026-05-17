const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../app.log');

function writeLog(level, message, meta = '') {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  if (meta) {
    if (meta instanceof Error) {
      metaStr = `\n${meta.stack}`;
    } else if (typeof meta === 'object') {
      try {
        metaStr = `\n${JSON.stringify(meta, null, 2)}`;
      } catch (e) {
        metaStr = ` [Circular or Unserializable Object]`;
      }
    } else {
      metaStr = ` ${meta}`;
    }
  }
  const logLine = `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}\n`;
  
  // 1. Write to file
  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });

  // 2. Write to console
  if (level === 'error') {
    console.error(logLine.trim());
  } else {
    console.log(logLine.trim());
  }
}

module.exports = {
  info: (message, meta) => writeLog('info', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
};
