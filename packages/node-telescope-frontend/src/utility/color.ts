import { green, blue, gold, red } from '@ant-design/colors';

// Usage example:
// const statusColor = getStatusColor(200); // Returns green[5]

export const getStatusColor = (status: number): string => {
  if (status < 200) return blue[5]; // 1xx - Informational
  if (status < 300) return green[7]; // 2xx - Success
  if (status < 400) return gold[5]; // 3xx - Redirection
  if (status < 500) return gold[6]; // 4xx - Client Error
  return red[5]; // 5xx - Server Error
};

// To fetch query by requestId

// async function getRelatedQueries(requestId: string) {
//   const response = await fetch(`/telescope/api/entries?type=queries&requestId=${requestId}`);
//   const queries = await response.json();
//   return queries;
// }
