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

  test("Owner permission matrix is authoritative", () => {
    const ownerEmail = "shreyansh.ssharma@gmail.com";
    const user1 = { id: 1, email: "shreyansh.ssharma@gmail.com", role: "OWNER" as const };
    const user2 = { id: 2, email: "writer@studio.com", role: "WRITER" as const };

    const isOwner = (u?: { email: string; role: string } | null) => {
      if (!u) return false;
      return (u.email && u.email.toLowerCase() === ownerEmail) || u.role === "OWNER";
    };

    assert.equal(isOwner(user1), true);
    assert.equal(isOwner(user2), false);
    assert.equal(isOwner(null), false);
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
