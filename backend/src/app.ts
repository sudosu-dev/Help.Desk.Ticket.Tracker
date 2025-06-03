import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouterV1 from './api';

const app: Application = express();

// Core middleware
// Enable CORS - Cross-Origin Resource Sharing
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Simple Root Route for testing
// app.get('/', (req: Request, res: Response) => {
//   res.status(200).json({
//     message: 'Welcome to the Help Desk API!',
//     timeStamp: new Date().toISOString(),
//   });
// });

// Mount API routes
app.use('/api/v1', apiRouterV1);

// TODO: Add Global Error Handling Middleware
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {});

export default app;
