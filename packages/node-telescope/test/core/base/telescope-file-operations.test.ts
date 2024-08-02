import * as fs from 'fs';
import {
  shouldReadFile,
  sanitizeFilePath,
  getFileContext,
} from '../../../src/core/base/telescope-file-operations';
import { TelescopeOptions } from '../../../src/core/telescope-options';
import { sanitizeCodeSnippet } from '../../../src/utils/utility';
import { logger } from '../../../src/utils/logger';

jest.mock('fs');
jest.mock('../../../src/utils/utility');
jest.mock('../../../src/utils/logger');

describe('telescope-file-operations', () => {
  describe('shouldReadFile', () => {
    it('should return true when file reading is enabled and environment matches', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: ['development', 'test'],
      };

      process.env.NODE_ENV = 'development';

      expect(shouldReadFile(options)).toBe(true);
    });

    it('should return false when file reading is disabled', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: false,
        fileReadingEnvironments: ['development', 'test'],
      };

      process.env.NODE_ENV = 'development';

      expect(shouldReadFile(options)).toBe(false);
    });

    it('should return false when environment does not match', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: ['production'],
      };

      process.env.NODE_ENV = 'development';

      expect(shouldReadFile(options)).toBe(false);
    });

    it('should return undefined when fileReadingEnvironments is undefined', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: undefined,
      };

      expect(shouldReadFile(options)).toBe(undefined);
    });
  });

  describe('sanitizeFilePath', () => {
    it('should replace project root with mask [PROJECT_ROOT]', () => {
      const projectRoot = '/user/project';
      const filePath = '/user/project/src/file.ts';
      jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);

      const result = sanitizeFilePath(filePath);

      expect(result).toBe('[PROJECT_ROOT]/src/file.ts');
    });

    it('should return the original file path if project root is not included', () => {
      const projectRoot = '/user/project';
      const filePath = '/other/path/src/file.ts';
      jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);

      const result = sanitizeFilePath(filePath);

      expect(result).toBe('/other/path/src/file.ts');
    });
  });

  describe('getFileContext', () => {
    const mockFileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7';
    const filePath = '/user/project/src/file.ts';

    beforeEach(() => {
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);
      (sanitizeCodeSnippet as jest.Mock).mockImplementation(line => line);
    });

    it('should return undefined if shouldReadFile returns false', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: false,
        fileReadingEnvironments: ['development'],
      };

      expect(getFileContext(options, filePath, 3)).toBe(undefined);
    });

    it('should return undefined if filePath is not provided', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: ['development'],
      };

      expect(getFileContext(options, undefined, 3)).toBe(undefined);
    });

    it('should return undefined if lineNumber is not a number', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: ['development'],
      };

      expect(getFileContext(options, filePath, undefined)).toBe(undefined);
    });

    it('should return the context lines for a given lineNumber', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: ['development'],
      };

      const context = getFileContext(options, filePath, 3);

      expect(context).toEqual({
        '1': 'Line 1',
        '2': 'Line 2',
        '3': 'Line 3',
        '4': 'Line 4',
        '5': 'Line 5',
      });
    });

    it('should handle errors and return undefined', () => {
      const options: Partial<TelescopeOptions> = {
        enableFileReading: true,
        fileReadingEnvironments: ['development'],
      };

      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File read error');
      });

      const context = getFileContext(options, filePath, 3);

      expect(context).toBe(undefined);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to read file for context:',
        expect.any(Object),
      );
    });
  });
});
