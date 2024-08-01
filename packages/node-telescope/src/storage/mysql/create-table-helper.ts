export const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS entries (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    timestamp DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id CHAR(36) PRIMARY KEY,
    method VARCHAR(10),
    url TEXT,
    headers JSON,
    body JSON,
    ip VARCHAR(45),
    request_id CHAR(36),
    response_status_code INT,
    response_headers JSON,
    response_body TEXT,
    curl_command TEXT,
    memory_usage_before INT,
    memory_usage_after INT,
    memory_usage_difference INT,
    duration INT,
    FOREIGN KEY (id) REFERENCES entries(id)
  );
  
  CREATE TABLE IF NOT EXISTS exceptions (
    id CHAR(36) PRIMARY KEY,
    class VARCHAR(255),
    file TEXT,
    line INT,
    message TEXT,
    stack TEXT,
    FOREIGN KEY (id) REFERENCES entries(id)
  );

  CREATE TABLE IF NOT EXISTS queries (
    id CHAR(36) PRIMARY KEY,
    collection VARCHAR(255),
    method VARCHAR(50),
    query TEXT,
    request_id CHAR(36),
    result TEXT,
    FOREIGN KEY (id) REFERENCES entries(id)
  );
`;
