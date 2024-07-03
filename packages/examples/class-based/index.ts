// This is a test server to test the Telescope library
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import telescope, { Telescope, MongoStorage, EntryType } from 'node-telescope';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { Server as HttpServer } from 'http';
import cors from 'cors';

dotenv.config();

interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
}

class TestServer {
  private app: Express;
  private server: HttpServer;
  private telescope!: Telescope;
  private storage!: MongoStorage;
  private User!: mongoose.Model<IUser>;

  constructor() {
    this.app = express();
    this.server = new HttpServer(this.app);
    this.configureMiddleware();
    this.configureMongoose();
    this.configureTelescope();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    // Apply CORS to all routes
    this.app.use(
      cors({
        origin: 'http://localhost:3000', // Your React app URL
        credentials: true,
      }),
    );
  }

  private configureMongoose(): void {
    const MONGO_URI = process.env.DB_URI || '';
    mongoose
      .connect(MONGO_URI)
      .then(() => console.log('Connected to MongoDB'))
      .catch(err => console.error('MongoDB connection error:', err));

    const UserSchema = new Schema<IUser>({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      createdAt: { type: Date, default: Date.now },
    });

    this.User = mongoose.model<IUser>('User', UserSchema);
  }

  private configureTelescope(): void {
    const TELESCOPE_DB = process.env.DB_NAME || '';
    const MONGO_URI = process.env.DB_URI || '';

    this.storage = new MongoStorage({
      uri: MONGO_URI,
      dbName: TELESCOPE_DB,
    });

    this.telescope = new Telescope({
      storage: this.storage,
      watchedEntries: [EntryType.REQUESTS, EntryType.EXCEPTIONS, EntryType.QUERIES],
      enableQueryLogging: true,
      routePrefix: '/telescope',
      corsOptions: {
        origin: 'http://localhost:3000', // React local url
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      app: this.app, // Provide the Express app
      server: this.server, // Provide the HTTP server
    });
    console.log('Telescope initialized with options:', this.telescope.options);

    this.app.use(this.telescope.middleware());
  }

  private configureRoutes(): void {
    this.app.get('/users', this.getUsers.bind(this));
    this.app.get('/', this.getHome.bind(this));
    this.app.post('/users', this.createUser.bind(this));
    this.app.get('/error', this.triggerError.bind(this));

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
      const newUser = new this.User({ name, email });
      await newUser.save();
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  private async getUsers(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        id: 1,
        user: 'John Doe',
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  public async start(): Promise<void> {
    try {
      await this.storage.connect();
      await this.telescope.connect();
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
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
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
