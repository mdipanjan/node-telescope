export const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY REFERENCES entries(id),
    method VARCHAR(10),
    url TEXT,
    headers JSONB,
    body JSONB,
    ip VARCHAR(45),
    request_id UUID,
    response_status_code INTEGER,
    response_headers JSONB,
    response_body TEXT,
    curl_command TEXT,
    memory_usage_before INTEGER,
    memory_usage_after INTEGER,
    memory_usage_difference INTEGER,
    duration INTEGER
  );
  
  CREATE TABLE IF NOT EXISTS exceptions (
    id UUID PRIMARY KEY REFERENCES entries(id),
    class VARCHAR(255),
    file TEXT,
    line INTEGER,
    message TEXT,
    stack TEXT
  );

  CREATE TABLE IF NOT EXISTS queries (
    id UUID PRIMARY KEY REFERENCES entries(id),
    collection VARCHAR(255),
    method VARCHAR(50),
    query TEXT,
    request_id UUID,
    result TEXT
  );
`;
