export const sanitizeCodeSnippet = (code: string): string => {
  // Remove or mask sensitive information
  return code
    .replace(/password\s*=\s*['"][^'"]*['"]/, 'password = "[REDACTED]"')
    .replace(/api_key\s*=\s*['"][^'"]*['"]/, 'api_key = "[REDACTED]"')
    .replace(/Bearer\s+[^'"]*/, 'Bearer = "[REDACTED]"');
};
