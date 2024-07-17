import { Telescope } from '../telescope';
import { EntryType, ExceptionEntry } from '../../types';
import {
  getFileContext,
  sanitizeFilePath,
  shouldReadFile,
} from '../base/telescope-file-operations';

export function setupExceptionLogging(telescope: Telescope): void {
  if (telescope.options.watchedEntries.includes(EntryType.EXCEPTIONS)) {
    process.on('uncaughtException', (error: Error) => {
      logException(telescope, error);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      if (reason instanceof Error) {
        logException(telescope, reason);
      } else {
        logException(telescope, new Error(String(reason)));
      }
    });
  }
}

export function logException(telescope: Telescope, error: Error | unknown): void {
  if (telescope.options.watchedEntries.includes(EntryType.EXCEPTIONS)) {
    const errorInfo = getErrorInfo(telescope, error);
    const entry: Omit<ExceptionEntry, 'id'> = {
      type: EntryType.EXCEPTIONS,
      timestamp: new Date(),
      exception: errorInfo,
    };

    console.log('Logging exception:', JSON.stringify(entry, null, 2));

    telescope.storage
      .storeEntry(entry)
      .then(() => console.log('Exception entry stored successfully'))
      .catch(storageError => {
        console.error('Failed to store exception entry:', storageError);
      });
  }
}

function getErrorInfo(telescope: Telescope, error: Error | unknown): ExceptionEntry['exception'] {
  if (error instanceof Error) {
    const stackLines = error.stack?.split('\n') || [];
    const errorLine = stackLines[1] || '';
    const match = errorLine.match(/\((.+):(\d+):(\d+)\)$/);

    const errorInfo: ExceptionEntry['exception'] = {
      message: error.message,
      stack: error.stack,
      class: error.constructor.name,
      file: match ? sanitizeFilePath(match[1]) : undefined,
      line: match ? parseInt(match[2], 10) : undefined,
    };

    if (shouldReadFile(telescope.options)) {
      errorInfo.context = getFileContext(
        telescope.options,
        match ? match[1] : undefined,
        match ? parseInt(match[2], 10) : undefined,
      );
    }

    return errorInfo;
  } else {
    return {
      message: String(error),
      class: 'UnknownError',
    };
  }
}
