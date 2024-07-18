import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Telescope, MongoStorage, EntryType, TelescopeDatabaseType } from 'node-telescope';
import { createServer } from 'http';

dotenv.config();

const route = '/telescope-test';

async function createTestServer() {
	const app = express();
	const server = createServer(app);
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
		routePrefix: route,
		app: app,
		server: server,
		databaseType: TelescopeDatabaseType.MONGO,
		includeCurlCommand: true,
	});

	app.use(telescope.middleware());

	// Routes
	app.get('/', (req, res) => {
		res.send('Hello World! This is the Production Test Server.');
	});
	app.get('/test', (req, res) => {
		res.send('Test route working');
	});

	app.get('/error', (_req, _res) => {
		throw new Error('This is a test error');
	});

	return server;
}

// Create and start the server
createTestServer()
	.then(server => {
		const PORT = process.env.PORT || 4000;
		server.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(`Telescope is available at http://localhost:${PORT}${route}`);
		});
	})
	.catch(error => {
		console.error('Failed to start the server:', error);
		process.exit(1);
	});
