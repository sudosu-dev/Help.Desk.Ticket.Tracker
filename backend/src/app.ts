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

// --- Global Error-Handling Middleware ---

// We define our handler as a constant with the explicit ErrorRequestHandler type.
const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.error('[GlobalErrorHandler]:', error);

  // Check for specific JSON parsing errors from express.json()
  if (error instanceof SyntaxError && 'body' in error) {
    // Send the response, then use a bare 'return' to exit the function.
    res.status(400).json({
      error: 'Invalid Request Body',
      message: 'Malformed JSON in request body.',
    });
    return;
  }

  // Generic fallback for other unexpected errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.',
  });
};

// This MUST be the last middleware added to the app.
app.use(globalErrorHandler);

// ------------------------------------
export default app;
