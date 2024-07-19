// This is a test server to test the Telescope library with - PostgreSQL DB
import express, { Express, Request, Response, NextFunction } from 'express';
import { Telescope, EntryType, TelescopeDatabaseType, PostgreSQLStorage } from 'node-telescope';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { Server as HttpServer } from 'http';
import cors from 'cors';
import { Pool, PoolConfig } from 'pg';

dotenv.config();

class TestServer {
	private app: Express;
	private server: HttpServer;
	private telescope!: Telescope;
	private storage!: PostgreSQLStorage;
	private pool!: Pool;

	constructor() {
		this.app = express();
		this.server = new HttpServer(this.app);
		this.configureMiddleware();
	}

	private configureMiddleware(): void {
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		// Apply CORS to all routes
		this.app.use(
			cors({
				origin: 'http://localhost:3000', //  React app URL for local development
				credentials: true,
			}),
		);
	}

	private async configurePostgreSQL(): Promise<void> {
		const pgConfig: PoolConfig = {
			host: process.env.PG_HOST || 'localhost',
			port: parseInt(process.env.PG_PORT || '5432'),
			user: process.env.PG_USER || '',
			password: process.env.PG_PASSWORD || '',
			database: process.env.PG_DATABASE || '',
		};

		this.pool = new Pool(pgConfig);

		try {
			await this.pool.query('SELECT NOW()');
			console.log('PostgreSQL connection established successfully');
		} catch (error) {
			console.error('PostgreSQL connection error:', error);
			throw error;
		}
	}

	private configureTelescope(): void {
		const databaseType = TelescopeDatabaseType.POSTGRES;

		this.storage = new PostgreSQLStorage({ connection: this.pool });

		this.telescope = new Telescope({
			storage: this.storage,
			watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS, EntryType.QUERIES],
			enableQueryLogging: true,
			corsOptions: {
				origin: 'http://localhost:3000', // React local url
				methods: ['GET', 'POST'],
				allowedHeaders: ['Content-Type', 'Authorization'],
			},
			app: this.app, // Provide the Express app
			server: this.server, // Provide the HTTP server
			enableFileReading: true,
			fileReadingEnvironments: ['development'],
			includeCurlCommand: true,
			recordMemoryUsage: true,
			databaseType,
		});
		this.app.use(this.telescope.middleware());
	}

	private configureRoutes(): void {
		this.app.get('/users', this.getUsers.bind(this));
		this.app.get('/', this.getHome.bind(this));
		this.app.post('/users', this.createUser.bind(this));
		this.app.get('/error', this.triggerError.bind(this));
	}

	public async initialize(): Promise<void> {
		try {
			await this.configurePostgreSQL();
			await this.configureTelescope();
			this.configureRoutes();
			this.configureErrorHandling();
		} catch (error) {
			console.error('Failed to initialize the server:', error);
			throw error;
		}
	}

	private async triggerError(req: Request, res: Response): Promise<void> {
		throw new Error('This is a test error');
	}

	private async getHome(req: Request, res: Response): Promise<void> {
		try {
			res.send('HELLO WORLD! This is the home page!!!!');
		} catch (error) {
			console.error('Error fetching users:', error);
			res.status(500).json({ error: 'Failed to fetch users' });
		}
	}

	private async createUser(req: Request, res: Response): Promise<void> {
		try {
			const { name, email } = req.body;
			const result = await this.pool.query(
				'INSERT INTO users(name, email) VALUES($1, $2) RETURNING *',
				[name, email],
			);
			res.status(201).json(result.rows[0]);
		} catch (error) {
			console.error('Error creating user:', error);
			res.status(500).json({ error: 'Failed to create user' });
		}
	}

	private async getUsers(_req: Request, res: Response): Promise<void> {
		try {
			const result = await this.pool.query('SELECT * FROM users WHERE name = $1', ['John Doe']);
			res.json({
				message: 'Query executed successfully',
				usersFound: result.rows.length,
			});
		} catch (error) {
			console.error('Error in test query:', error);
			res.status(500).json({ error: 'An error occurred while executing the query' });
		}
	}

	public async start(): Promise<void> {
		try {
			await this.initialize();
			const PORT = process.env.TEST_SERVER_PORT || 4000;
			this.server.listen(PORT, () => {
				console.log(`Server is running on http://localhost:${PORT}`);
				console.log(`Telescope is available at http://localhost:${PORT}/telescope`);
			});

			this.setupGracefulShutdown();
		} catch (error) {
			console.error('Failed to start the server:', error);
			process.exit(1);
		}
	}

	private setupGracefulShutdown(): void {
		process.on('SIGINT', async () => {
			try {
				await this.pool.end();
				console.log('PostgreSQL connection closed');
				process.exit(0);
			} catch (error) {
				console.error('Error during graceful shutdown:', error);
				process.exit(1);
			}
		});
	}

	private configureErrorHandling(): void {
		this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
			console.error(err.stack);
			res.status(500).send('Something broke!');
		});
	}
}

// Create and start the server
const server = new TestServer();
server.start();
