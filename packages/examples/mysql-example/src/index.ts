import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Telescope, MySQLStorage, EntryType, TelescopeDatabaseType } from 'node-telescope';
import { Server as HttpServer, createServer } from 'http';
import { createPool } from 'mysql2/promise';

dotenv.config();

async function createTestServer() {
	const app: Express = express();
	const server: HttpServer = createServer(app);

	// Middleware
	app.use(express.json());
	app.use(cors());

	// Create MySQL connection pool
	const pool = createPool({
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT || '3306'),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		connectionLimit: 10,
	});

	// Configure Telescope
	const storage = new MySQLStorage({ connection: pool });
	try {
		console.log('Connecting to MySQL and creating tables...');
		await storage.connect();
		console.log('MySQL connection and table creation successful');
	} catch (error) {
		console.error('Failed to connect to MySQL or create tables:', error);
		process.exit(1);
	}
	const telescope = new Telescope({
		storage: storage,
		watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS, EntryType.QUERIES],
		enableQueryLogging: true,
		app: app,
		server: server,
		includeCurlCommand: true,
		databaseType: TelescopeDatabaseType.MYSQL,
	});

	app.use(telescope.middleware());

	// Routes
	app.get('/', (_req: Request, res: Response) => {
		res.send('Hello World! This is the MySQL TestServer.');
	});

	app.get('/test-get', (_req: Request, res: Response) => {
		res.json({ message: 'This is a test GET route' });
	});

	app.get('/error', (_req: Request, _res: Response) => {
		throw new Error('This is a test error');
	});

	// Error handling
	app.use(
		(err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
			console.error(err.stack);
			res.status(500).send('Something broke!');
		},
	);
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
