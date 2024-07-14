import * as fs from 'fs';
import { TelescopeOptions } from '../telescope-options';
import { sanitizeCodeSnippet } from '../../utils/utility';

export function shouldReadFile(options: TelescopeOptions): boolean | undefined {
  return (
    options.enableFileReading &&
    options.fileReadingEnvironments &&
    options.fileReadingEnvironments.includes(process.env.NODE_ENV || 'development')
  );
}

export function sanitizeFilePath(filePath: string): string {
  const projectRoot = process.cwd();
  return filePath.replace(projectRoot, '[PROJECT_ROOT]');
}

export function getFileContext(
  options: TelescopeOptions,
  filePath?: string,
  lineNumber?: number,
): { [key: string]: string } | undefined {
  if (!shouldReadFile(options) || !filePath || !lineNumber) return undefined;

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    const start = Math.max(0, lineNumber - 3);
    const end = Math.min(lines.length, lineNumber + 2);
    const context: { [key: string]: string } = {};

    for (let i = start; i < end; i++) {
      context[`${i + 1}`] = sanitizeCodeSnippet(lines[i]);
    }

    return context;
  } catch (error) {
    console.error('Failed to read file for context:', error);
    return undefined;
  }
}
