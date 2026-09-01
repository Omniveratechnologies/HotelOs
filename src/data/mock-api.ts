/**
 * Simulated backend boundary. Every call in the state layer goes through here,
 * so swapping in real API calls means replacing only this file.
 * Rejects ~8% of calls so error/fallback paths stay exercised.
 */
export function mockServer<T>(payload: T, latency = 650): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.08) reject(new Error("Service temporarily unreachable"));
      else resolve(payload);
    }, latency);
  });
}
