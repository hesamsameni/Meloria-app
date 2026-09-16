import crypto from "crypto";

// CSRF state helpers — sign {userId}:{timestamp} with the client secret so
// no extra table is needed and the state is unforgeable.

export function signState(userId) {
  const payload = `${userId}:${Date.now()}`;
  const sig = crypto
    .createHmac("sha256", process.env.SPOTIFY_CLIENT_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export function verifyState(state) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    throw new Error("Malformed state parameter");
  }

  const { payload, sig } = parsed;
  const expected = crypto
    .createHmac("sha256", process.env.SPOTIFY_CLIENT_SECRET)
    .update(payload)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    throw new Error("Invalid state signature");
  }

  const [userId, ts] = payload.split(":");
  if (Date.now() - parseInt(ts, 10) > 10 * 60 * 1000) {
    throw new Error("State expired");
  }

  return userId;
}
