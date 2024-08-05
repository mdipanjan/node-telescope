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

		// Create users table if it doesn't exist
		await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE
      )
    `);
		console.log('Users table created or already exists');
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

	// Database-related routes
	app.post('/users', async (req: Request, res: Response) => {
		const { name, email } = req.body;
		try {
			const [result] = await pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [
				name,
				email,
			]);
			res.status(201).json({ message: 'User created', id: (result as any).insertId });
		} catch (error) {
			console.error('Error creating user:', error);
			res.status(500).json({ error: 'Failed to create user' });
		}
	});

	app.get('/users', async (_req: Request, res: Response) => {
		try {
			const [rows] = await pool.query('SELECT * FROM users');
			res.json(rows);
		} catch (error) {
			console.error('Error fetching users:', error);
			res.status(500).json({ error: 'Failed to fetch users' });
		}
	});

	app.get('/users/:id', async (req: Request, res: Response) => {
		const { id } = req.params;
		try {
			const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
			if ((rows as any[]).length === 0) {
				res.status(404).json({ error: 'User not found' });
			} else {
				res.json((rows as any[])[0]);
			}
		} catch (error) {
			console.error('Error fetching user:', error);
			res.status(500).json({ error: 'Failed to fetch user' });
		}
	});

	app.put('/users/:id', async (req: Request, res: Response) => {
		const { id } = req.params;
		const { name, email } = req.body;
		try {
			await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
			res.json({ message: 'User updated' });
		} catch (error) {
			console.error('Error updating user:', error);
			res.status(500).json({ error: 'Failed to update user' });
		}
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
