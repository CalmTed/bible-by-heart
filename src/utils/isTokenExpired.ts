import { Buffer } from "buffer";

// Decodes a JWT payload (base64url). Returns null if the token is malformed.
export const decodeJwtPayload = (
  token: string
): Record<string, unknown> | null => {
  try {
    const payloadPart = token?.split(".")?.[1];
    if (!payloadPart) {
      return null;
    }
    return JSON.parse(
      Buffer.from(
        payloadPart.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString()
    );
  } catch {
    return null;
  }
};

// True when the token is missing, malformed, or past its `exp` (seconds since epoch).
// A missing/undecodable token counts as expired so callers fall back to logout.
export const isTokenExpired = (
  token: string,
  now: number = Date.now()
): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }
  return payload.exp * 1000 < now;
};
