import { handleUpdate } from "../../telegram/bot.js";

// POST /api/telegram/webhook — receives Telegram updates (Telegram signs its own requests)
export default defineEventHandler(async (event) => {
  const update = await readBody(event);

  // Respond fast; process the update in the background (kept alive on serverless).
  background(event, () => handleUpdate(update));

  return "OK";
});
