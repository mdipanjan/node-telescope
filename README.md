# Node Telescope

[![npm version](https://badge.fury.io/js/node-telescope.svg)](https://badge.fury.io/js/node-telescope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Node Telescope is a comprehensive logging and monitoring solution for Node.js applications. It provides real-time insights into your application's performance, errors, and database queries, with support for both MongoDB and PostgreSQL.

## 🚀 Features

- Real-time request logging
- Exception tracking with stack traces
- Database query monitoring (MongoDB and PostgreSQL)
- Memory usage tracking
- WebSocket support for live updates
- Customizable storage options
- Easy integration with Express applications
- Configurable response body and query result size limits
- Frontend dashboard for data visualization

## 📦 Packages

This monorepo contains the following packages:

- [`node-telescope`](./packages/node-telescope): The core library for logging and monitoring
- [`node-telescope-frontend`](./packages/node-telescope-frontend): A React-based frontend for visualizing Telescope data
- [`examples`](./packages/examples): Example projects demonstrating Telescope integration

## 🛠️ Installation

To use Node Telescope in your project, install it via npm:

```bash
npm install node-telescope
```

For the frontend dashboard:

```bash
npm install node-telescope-frontend
```

## 🚦 Quick Start

Here's a basic example of how to integrate Node Telescope into your Express application:

```typescript
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Telescope, MongoStorage, EntryType, TelescopeDatabaseType } from 'node-telescope';
import { createServer } from 'http';

dotenv.config();

async function createServer() {
	const app = express();
	const server = createServer(app);

	// Middleware
	app.use(express.json());
	app.use(cors());

	// Connect to MongoDB
	await mongoose.connect(process.env.DB_URI || '');
	console.log('Connected to MongoDB');

	// Configure Telescope
	const storage = new MongoStorage({
		connection: mongoose.connection,
		dbName: process.env.DB_NAME || 'telescope',
	});

	const telescope = new Telescope({
		storage: storage,
		watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS, EntryType.QUERIES],
		enableQueryLogging: true,
		app: app,
		server: server,
		databaseType: TelescopeDatabaseType.MONGO,
		includeCurlCommand: true,
	});

	app.use(telescope.middleware());

	// Routes
	app.get('/', (req, res) => {
		res.send('Hello World! This is the TestServer.');
	});

	app.get('/error', (req, res) => {
		throw new Error('This is a test error');
	});

	// Error handling
	app.use((err, req, res, next) => {
		console.error(err.stack);
		res.status(500).send('Something broke!');
	});

	return server;
}

// Create and start the server
(async () => {
	try {
		const server = await createServer();
		const PORT = process.env.PORT || 4000;
		server.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(`Telescope is available at http://localhost:${PORT}/telescope`);
		});
	} catch (error) {
		console.error('Failed to start the server:', error);
		process.exit(1);
	}
})();
```

## 📚 Documentation

For detailed usage instructions and API documentation, please refer to the following resources:

- [Core Library Documentation](./packages/node-telescope/README.md)
- [Frontend Documentation](./packages/node-telescope-frontend/README.md)
- [API Reference](./docs/API.md)

## 🧪 Examples

Check out our example projects for different setup scenarios:

- [MongoDB Example](./packages/examples/class-based)
- [PostgreSQL Example](./packages/examples/class-based-pg)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for more details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgements

This project was inspired by [Laravel Telescope](https://laravel.com/docs/telescope), a powerful debug assistant for the Laravel framework.

---

Built with ❤️ by [mdipanjan](https://github.com/mdipanjan)
