# Node Telescope Core

This package contains the core functionality of Node Telescope, a powerful logging and monitoring library for Node.js applications.

## Installation

```bash
npm install node-telescope
```

## Usage

Here's a basic example of how to use Node Telescope with Express and MongoDB:

```typescript
import express from 'express';
import http from 'http';
import { Telescope, MongoStorage, EntryType, TelescopeDatabaseType } from 'node-telescope';
import mongoose from 'mongoose';

const app = express();
const server = http.createServer(app);

mongoose.connect('mongodb://localhost/your-database');

const telescope = new Telescope({
  storage: new MongoStorage({
    connection: mongoose.connection,
    dbName: 'telescope',
  }),
  watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS, EntryType.QUERIES],
  app,
  server,
  databaseType: TelescopeDatabaseType.MONGO,
  enableQueryLogging: true,
});

app.use(telescope.middleware());

// Your routes here

server.listen(3000);
```

## API Documentation

For detailed API documentation, please refer to the [API Reference](../../docs/API.md).

## Contributing

We welcome contributions! Please see the [Contributing Guide](../../CONTRIBUTING.md) in the root of the monorepo for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file in the root of the monorepo for details.
