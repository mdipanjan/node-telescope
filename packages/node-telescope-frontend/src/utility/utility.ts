export const formatBody = (body: any): string => {
  if (typeof body === 'string') {
    try {
      // If it's a JSON string, parse and re-stringify it for formatting
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      // If it's not JSON, return the original string
      return body;
    }
  } else if (typeof body === 'object') {
    // If it's already an object, stringify it
    return JSON.stringify(body, null, 2);
  }
  // If it's neither a string nor an object, convert to string
  return String(body);
};
