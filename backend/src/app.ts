import express, {
  Application,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import cors from 'cors';
import apiRouterV1 from './api';

const app: Application = express();

app.use(cors());

app.use(express.json());

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

// --- Global Error-Handling Middleware ---

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.error('[GlobalErrorHandler]:', error);

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: 'Invalid Request Body',
      message: 'Malformed JSON in request body.',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.',
  });
};

app.use(globalErrorHandler);

export default app;
