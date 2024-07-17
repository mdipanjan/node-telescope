import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Telescope, MongoStorage, EntryType, TelescopeDatabaseType } from 'node-telescope';
import { Server as HttpServer, createServer } from 'http';

dotenv.config();

async function createTestServer() {
	const app: Express = express();
	const server: HttpServer = createServer(app);

	// Middleware
	app.use(express.json());
	app.use(cors());

	// Connect to MongoDB
	await mongoose.connect(process.env.DB_URI || '');
	console.log('Connected to MongoDB');

	// Configure Telescope
	const mongoConnection = mongoose.connection;
	const storage = new MongoStorage({
		connection: mongoConnection,
		dbName: process.env.DB_NAME || 'telescope',
	});

	const telescope = new Telescope({
		storage: storage,
		watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS, EntryType.QUERIES],
		enableQueryLogging: true,
		routePrefix: '/telescope',
		app: app,
		server: server,
		databaseType: TelescopeDatabaseType.MONGO,
		includeCurlCommand: true,
	});

	app.use(telescope.middleware());

	// Routes
	app.get('/', (_req: Request, res: Response) => {
		res.send('Hello World! This is the TestServer.');
	});

	app.get('/error', (_req: Request, _res: Response) => {
		throw new Error('This is a test error');
	});

	// Error handling
	app.use((err: Error, _req: Request, res: Response) => {
		console.error(err.stack);
		res.status(500).send('Something broke!');
	});

	function start() {
		const PORT = process.env.PORT || 4000;
		server.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(`Telescope is available at http://localhost:${PORT}/telescope`);
		});
	}

	return { start };
}

// Create and start the server
(async () => {
	try {
		const server = await createTestServer();
		server.start();
	} catch (error) {
		console.error('Failed to start the server:', error);
		process.exit(1);
	}
})();
