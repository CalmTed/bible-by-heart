import { Buffer } from "buffer";
import {
  decodeJwtPayload,
  isTokenExpired
} from "../../src/utils/isTokenExpired";

const b64url = (obj: object): string =>
  Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (payload: object): string =>
  `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.signature`;

describe("isTokenExpired / decodeJwtPayload", () => {
  const now = 1_700_000_000_000; // fixed reference time in ms

  it("decodes a JWT payload", () => {
    const token = makeToken({ exp: 123, uuid: "abc" });
    expect(decodeJwtPayload(token)).toMatchObject({ exp: 123, uuid: "abc" });
  });

  it("returns false while the token is still valid", () => {
    const token = makeToken({ exp: Math.floor(now / 1000) + 60 });
    expect(isTokenExpired(token, now)).toBe(false);
  });

  it("returns true once the token is past exp", () => {
    const token = makeToken({ exp: Math.floor(now / 1000) - 60 });
    expect(isTokenExpired(token, now)).toBe(true);
  });

  it("treats a malformed or empty token as expired", () => {
    expect(isTokenExpired("not-a-jwt", now)).toBe(true);
    expect(isTokenExpired("", now)).toBe(true);
    expect(decodeJwtPayload("garbage")).toBeNull();
  });

  it("treats a token without an exp claim as expired", () => {
    const token = makeToken({ uuid: "no-exp" });
    expect(isTokenExpired(token, now)).toBe(true);
  });
});
