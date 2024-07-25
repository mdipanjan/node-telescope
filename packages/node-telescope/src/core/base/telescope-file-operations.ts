import * as fs from 'fs';
import { TelescopeOptions } from '../telescope-options';
import { sanitizeCodeSnippet } from '../../utils/utility';
import { logger } from '../../utils/logger';

export function shouldReadFile(options: TelescopeOptions): boolean | undefined {
  return (
    options.enableFileReading &&
    options.fileReadingEnvironments &&
    options.fileReadingEnvironments.includes(process.env.NODE_ENV || 'development')
  );
}

export function sanitizeFilePath(filePath: string): string {
  const projectRoot = process.cwd();
  return filePath.includes(projectRoot)
    ? filePath.replace(projectRoot, '[PROJECT_ROOT]')
    : filePath;
}

export function getFileContext(
  options: TelescopeOptions,
  filePath?: string,
  lineNumber?: number,
): { [key: string]: string } | undefined {
  if (!shouldReadFile(options) || !filePath || typeof lineNumber !== 'number') return undefined;

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileLines = fileContent.split('\n');
    const startLine = Math.max(0, lineNumber - 3);
    const endLine = Math.min(fileLines.length, lineNumber + 2);
    const contextLines: { [key: string]: string } = {};

    for (let i = startLine; i < endLine; i++) {
      contextLines[`${i + 1}`] = sanitizeCodeSnippet(fileLines[i]);
    }

    return contextLines;
  } catch (error) {
    logger.error('Failed to read file for context:', { error, filePath, lineNumber });
    return undefined;
  }
}
