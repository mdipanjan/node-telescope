import { Request } from 'express';

export const sanitizeCodeSnippet = (code: string): string => {
  // Remove or mask sensitive information
  return code
    .replace(/password\s*=\s*['"][^'"]*['"]/, 'password = "[REDACTED]"')
    .replace(/api_key\s*=\s*['"][^'"]*['"]/, 'api_key = "[REDACTED]"')
    .replace(/Bearer\s+[^'"]*/, 'Bearer = "[REDACTED]"');
};

export function generateCurlCommand(req: Request): string {
  let curlCommand = `curl -X ${req.method} `;

  // Add headers
  Object.entries(req.headers).forEach(([key, value]) => {
    if (key !== 'host' && key !== 'connection') {
      // Exclude some headers
      curlCommand += `-H '${key}: ${value}' `;
    }
  });

  // Add body for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    curlCommand += `-d '${JSON.stringify(req.body)}' `;
  }

  // Add URL
  curlCommand += `'${req.protocol}://${req.get('host')}${req.originalUrl}'`;

  return curlCommand;
}
