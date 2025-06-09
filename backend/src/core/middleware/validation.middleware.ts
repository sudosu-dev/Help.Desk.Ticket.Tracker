// backend/src/core/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Creates an Express middleware function that validates request data (body, query, params)
 * against a provided Zod schema.
 *
 * If validation is successful, the validated data is attached to the request object
 * (e.g., req.body will be replaced with the validated and transformed body),
 * and the request proceeds to the next handler.
 *
 * If validation fails, a 400 Bad Request response is sent with detailed error messages.
 *
 * @param schema - The Zod schema to validate against. It should be an object schema
 * that can contain 'body', 'query', and/or 'params' Zod object schemas.
 * Example: z.object({ body: z.object({ name: z.string() }) })
 * @returns An Express middleware function.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If validation is successful replace req properties with validated data
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.query) req.query = validatedData.query;
      if (validatedData.params) req.params = validatedData.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(issues => ({
          path: issues.path.join('.'),
          message: issues.message,
        }));
        res.status(400).json({
          error: 'Validation failed.',
          details: errorMessages,
        });
        return;
      }
      // Pass non Zod errors to the next error handler
      console.error('Error is validation middleware (non-Zod):', error);
      res.status(500).json({
        error: 'Internal server error.',
        message: 'An unexpected error occurred during validation.',
      });
      return;
    }
  };
