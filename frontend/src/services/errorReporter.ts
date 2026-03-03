const errorReporter = {
  reportInfo: (message: string, meta: any) => {
    console.log('[INFO]', message, meta);
  },
  reportError: (error: Error, meta?: any) => {
    console.error('[ERROR]', error, meta);
  }
};

export { errorReporter };
