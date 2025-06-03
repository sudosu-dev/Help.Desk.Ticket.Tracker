import ms from 'ms';

/**
 * Parses the JWT_EXPIRES_IN environment variable to determine the token expiration time in seconds.
 * * This function handles several cases:
 * 1. If JWT_EXPIRES_IN is not set or is an empty string, it defaults to a standard duration (e.g., 1 hour).
 * 2. If JWT_EXPIRES_IN is a string representing a whole number, it's treated as seconds.
 * 3. If JWT_EXPIRES_IN is a time string (e.g., "1h", "7d"), it's converted to seconds using the 'ms' library.
 * * This more explicit parsing is used to ensure a clear `number` type for the 'expiresIn' option
 * of `jwt.sign()`, which helps satisfy strict TypeScript type checking that was encountered
 * with more direct string manipulation from environment variables. It also includes warnings
 * for invalid formats and falls back to a default.
 * * @returns {number} The token expiration time in seconds.
 */
export const getJwtExpiresInSeconds = (): number => {
  const envVal = process.env.JWT_EXPIRES_IN?.trim();
  const defaultSeconds = 3600;

  if (!envVal) {
    return defaultSeconds;
  }

  // Try parsing as a direct number of seconds
  const parsedAsInt = parseInt(envVal, 10);
  if (!isNaN(parsedAsInt) && parsedAsInt.toString() === envVal) {
    return parsedAsInt;
  }

  // Try parsing as a time string
  try {
    // Using 'as any' as a pragmatic workaround for potential strict StringValue type issues with ms()
    const milliseconds = ms(envVal as any);
    if (typeof milliseconds === 'number' && !isNaN(milliseconds)) {
      return milliseconds / 1000; // Convert ms to seconds
    }
  } catch (e) {
    // Log error if ms parsing fails catastrophically, but still fall back
    console.error(
      `[AuthService] Error while parsing JWT_EXPIRES_IN string with ms library: "${envVal}"`,
      e
    );
  }

  // Fallback if format is not recognized by ms() or if ms() returned an unexpected type
  console.error(
    `[AuthService] Invalid or unparseable JWT_EXPIRES_IN format: "${envVal}". Defaulting to ${defaultSeconds / 3600}h.`
  );
  return defaultSeconds;
};
