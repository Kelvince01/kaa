/**
 * Health check to verify if the backend is online.
 *
 * @param url - URL to check.
 * @param maxDelay - Maximum delay in seconds (default 600).
 * @param factor - Delay increase factor (default 1.5).
 * @param maxAttempts - Max attempts before failure (default 10).
 *
 * @returns Promise<boolean> - True if the server responds, otherwise false.
 */
export const healthCheck = async (
  url: string,
  maxDelay = 600, // Maximum 10 minutes
  factor = 1.5,
  maxAttempts = 10
): Promise<boolean> => {
  let delay = 10_000; // Initial delay 10 second
  let attempts = 0;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.debug(`Attempt ${attempts}: Pinging ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        console.debug("Health check successful!");
        return true;
      }

      console.debug(`Health check: ${response.status}`);
    } catch (err) {
      console.debug(`Health check error: ${err}`);
    }

    const BASE_TIME = 1000;
    if (delay < maxDelay * BASE_TIME) {
      delay = Math.min(maxDelay * BASE_TIME, delay * factor);
    }

    console.debug(`Waiting ${delay / BASE_TIME} seconds before next attempt.`);
    await sleep(delay);
  }

  console.debug("Maximum attempts reached. Health check failed.");
  return false;
};
