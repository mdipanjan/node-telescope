# Node Telescope API Documentation

## Telescope Class

The main class for initializing and configuring Node Telescope.

### Constructor

```typescript
constructor(options: TelescopeOptions)
```

#### TelescopeOptions

- `storage: StorageInterface` - The storage implementation to use (e.g., MongoStorage)
- `watchedEntries: EntryType[]` - Array of entry types to watch (default: [REQUESTS, EXCEPTIONS, QUERIES])
- `enableQueryLogging: boolean` - Whether to enable query logging (default: false)
- `corsOptions: object` - CORS options for Telescope routes
- `app: Express` - Express application instance
- `server: HttpServer` - HTTP server instance
- `enableFileReading: boolean` - Whether to enable file reading for exceptions (default: false)
- `fileReadingEnvironments: string[]` - Environments where file reading is enabled (default: ['development'])
- `includeCurlCommand: boolean` - Whether to include CURL commands in request logs (default: false)
- `recordMemoryUsage: boolean` - Whether to record memory usage (default: false)
- `databaseType: TelescopeDatabaseType` - Type of database being used (MONGO or POSTGRES)
- `responseBodySizeLimit: number` - Maximum size of response body to log (default: 2000)
- `queryResultSizeLimit: number` - Maximum size of query result to log (default: 2000)

### Methods

#### middleware()

Returns the Express middleware for Telescope.

```typescript
middleware(): express.RequestHandler
```

#### logException(error: Error | unknown)

Logs an exception to Telescope.

```typescript
logException(error: Error | unknown): void
```

#### connect()

Connects to the storage backend.

```typescript
connect(): Promise<void>
```

## StorageInterface

Interface for implementing custom storage backends.

### Methods

- `connect(): Promise<void>`
- `storeEntry(entry: Omit<Entry, 'id'>): Promise<string>`
- `getEntry(id: string): Promise<Entry | null>`
- `getEntries(queryOptions: AdvancedQueryOptions): Promise<{ entries: Entry[]; pagination: unknown }>`
- `getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]>`
- `prune(maxAge: number): Promise<void>`

## EntryType Enum

Enum for different types of entries that can be logged.

```typescript
enum EntryType {
	REQUESTS = 'requests',
	EXCEPTIONS = 'exceptions',
	QUERIES = 'queries',
}
```

## TelescopeDatabaseType Enum

Enum for supported database types.

```typescript
enum TelescopeDatabaseType {
	MONGO = 'mongo',
	POSTGRES = 'postgres',
	MYSQL = 'mysql',
}
```

For more detailed information on each component and advanced usage, please refer to the source code and inline documentation.
