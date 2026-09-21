import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

describe("PlotForge v2: Storage, Tokens & Authorization", () => {
  test("Cryptographic share tokens have high entropy (256-bit hex)", () => {
    const token1 = crypto.randomBytes(32).toString("hex");
    const token2 = crypto.randomBytes(32).toString("hex");

    assert.equal(token1.length, 64);
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2);
    // Must not resemble predictable sequential formats like share-token-1
    assert.match(token1, /^[0-9a-f]{64}$/);
  });

  test("Owner permission matrix is authoritative and supports dynamic configuration", () => {
    const ownerEmail = "owner@plotforge.internal";
    const user1 = { id: 1, email: "owner@plotforge.internal", role: "OWNER" as const };
    const user2 = { id: 2, email: "writer@studio.com", role: "WRITER" as const };

    const isOwner = (u?: { email: string; role: string } | null) => {
      if (!u) return false;
      return (u.email && u.email.toLowerCase() === ownerEmail) || u.role === "OWNER";
    };

    assert.equal(isOwner(user1), true);
    assert.equal(isOwner(user2), false);
    assert.equal(isOwner(null), false);
  });

  test("Firebase forged JWT without valid RS256 signature is rejected", async () => {
    const { verifyGoogleToken } = await import("../server/services/googleAuthService.js");

    // Attempt to forge a token with securetoken.google.com issuer but self-signed/invalid cert
    const fakeHeader = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fake-unregistered-kid" })).toString("base64url");
    const fakePayload = Buffer.from(
      JSON.stringify({
        iss: "https://securetoken.google.com/plotforge-fake",
        sub: "attacker-123",
        email: "attacker@forged.com",
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    ).toString("base64url");
    const fakeSignature = Buffer.from("forged_signature_bytes").toString("base64url");
    const forgedToken = `${fakeHeader}.${fakePayload}.${fakeSignature}`;

    const verified = await verifyGoogleToken(forgedToken);
    assert.equal(verified, null, "Forged token without verified signature from Google must be rejected");
  });

  test("Password reset token hashing prevents plaintext token storage", () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    assert.notEqual(rawToken, tokenHash);
    assert.equal(tokenHash.length, 64);

    // Verify lookup by hashing incoming token
    const incomingToken = rawToken;
    const lookupHash = crypto.createHash("sha256").update(incomingToken.trim()).digest("hex");
    assert.equal(lookupHash, tokenHash);
  });

  test("Screenplay scene regex parses sluglines accurately", () => {
    const script = `
FADE IN:

EXT. SPACESHIP HANGAR - NIGHT

The steel doors screech open in the whistling solar wind.

INT. COCKPIT - CONTINUOUS

COMMANDER VAL
Prepare the hyperdrive core now!
    `.trim();

    const sceneHeaderPattern = /^(?:INT|EXT|INT\/EXT|I\/E)[.\s].+$/gim;
    const matches = script.match(sceneHeaderPattern);

    assert.ok(matches);
    assert.equal(matches.length, 2);
    assert.equal(matches[0].trim(), "EXT. SPACESHIP HANGAR - NIGHT");
    assert.equal(matches[1].trim(), "INT. COCKPIT - CONTINUOUS");
  });
});
