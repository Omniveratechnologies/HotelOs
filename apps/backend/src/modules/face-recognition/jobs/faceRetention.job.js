import { applyRetention } from "../services/face.service.js";

export const runFaceRetention = async () => {
  try {
    const result = await applyRetention();
    if (result.suspended || result.restored || result.purged)
      console.log(`[face] retention: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error(`[face] retention failed: ${error.message}`);
    return null;
  }
};

export const startFaceRetentionJob = ({
  intervalMs = 6 * 60 * 60 * 1000,
} = {}) => {
  setTimeout(runFaceRetention, 30 * 1000).unref(); // shortly after start-up
  const timer = setInterval(runFaceRetention, intervalMs);
  timer.unref();
  return timer;
};
