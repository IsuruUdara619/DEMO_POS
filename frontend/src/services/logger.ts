const logger = {
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  debug: (...args: any[]) => console.debug(...args),
  logApiError: (error: any, url: string, method: string) => {
    console.error(`API Error [${method}] ${url}:`, error);
  },
  logPerformance: (label: string, duration: number) => {
    if (duration > 1000) {
      console.warn(`Performance [${label}]: ${duration.toFixed(2)}ms`);
    } else {
      console.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);
    }
  }
};

export default logger;
