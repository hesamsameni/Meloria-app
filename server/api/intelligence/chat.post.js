// POST /api/intelligence/chat — not implemented yet
export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  console.info("[intelligence] chat endpoint requested", { userId });
  setResponseStatus(event, 501);
  return { error: "Not implemented yet" };
});
