import logger from "~/server/logger";
import { StoredAnswer, StoredRunData } from "~/server/types";

const config = useRuntimeConfig();
const answerStorage = useStorage("answer");
const runStateStorage = useStorage("runState");

/**
 * Cleans up the given answer.
 * @param id ID to clean up.
 * @returns Promise to await on completion.
 */
export async function cleanupAnswer(id: string): Promise<void> {
  await Promise.all([
    answerStorage.removeItem(id).catch((error) => {
      logger.error(`Failed to clean up stored answer: ${error}`, { id });
    }),
  ]);
  logger.info(`Cleaned up stored answer`, { id });
}

/**
 * Gets an int from query params.
 * @param query Query object from Nitro.
 * @param key Query param name.
 * @returns Integer from the given query param.
 */
function getInt(query: ReturnType<typeof getQuery>, key: string): number {
  const rawValue = query[key] as string;
  return rawValue ? parseInt(rawValue) : -1;
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing id param" });
  }
  const season = getInt(query, "season");
  const episode = getInt(query, "episode");

  const answer = (await answerStorage.getItem(id)) as StoredAnswer | null;
  if (!answer) {
    throw createError({
      statusCode: 404,
      statusMessage: `Answer not found for id "${id}"`,
    });
  }
  // Remove the image file and stored answer but don't await on it; it doesn't affect the result.
  cleanupAnswer(id);

  const correct = answer.season === season && answer.episode === episode;

  // Run state tracking.
  let runId = query.runId;
  if (runId) {
    runId = String(runId);
    const runState = (await runStateStorage.getItem(runId)) as StoredRunData;
    if (runState) {
      const now = Date.now();
      runState.expiryTs = now + config.runExpiryMs;
      if (!runState.pending) {
        runState.errors.push({
          type: "no_pending",
          description:
            "Answer given, but no answer was expected (state incorrect)",
          ts: now,
          attemptedId: id,
        });
      } else if (runState.pending.id !== id) {
        runState.errors.push({
          type: "pending_mismatch",
          description: "Answer given for the wrong frame (ids mismatched)",
          ts: now,
          mismatched: runState.pending,
          attemptedId: id,
        });
      } else if (!runState.pending.startTs) {
        runState.errors.push({
          type: "check_unloaded",
          description: "Checking an answer for a frame that wasn't loaded",
          ts: now,
          attemptedId: id,
        });
      } else {
        const pending = runState.pending;
        runState.pending = null;
        runState.history.push({
          id,
          assignTs: pending.assignTs,
          startTs: pending.startTs || pending.assignTs,
          guessTs: now,
          guess: { season, episode },
          answer: { season: answer.season, episode: answer.episode },
          assignLatencyMs: pending.assignLatencyMs,
          seekTimeSec: answer.seekTime,
        });
      }
      logger.info("Logging answer check to verified run", { runId });

      await runStateStorage.setItem(runId, runState);
    } else {
      logger.error("Run not found when tracking answer check", { runId });
    }
  }

  return { ...answer, correct };
});
