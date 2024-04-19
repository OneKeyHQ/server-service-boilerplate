import { MidwayConfig } from '@midwayjs/core';

export default {
  midwayLogger: {
    default: {
      fileLevel: 'info',
      enableFile: false,
      consoleLevel: 'debug',
      enableConsole: true,
    },
  },
} as MidwayConfig;
