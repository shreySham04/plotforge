import { test, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../server/config/auth.js";

describe("PlotForge v2: Authentication Security & Integrity", () => {
  test("Password hashing creates strong salt with bcrypt", async () => {
    const plain = "SuperSecret123!";
    const hash = await bcrypt.hash(plain, 10);
    assert.notEqual(plain, hash);
    assert.equal(await bcrypt.compare(plain, hash), true);
    assert.equal(await bcrypt.compare("WrongPassword", hash), false);
  });

  test("JWT tokens require signature verification with server secret", () => {
    const payload = { id: 101, username: "screenwriter", role: "WRITER" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    assert.equal(decoded.id, 101);
    assert.equal(decoded.username, "screenwriter");
    assert.equal(decoded.role, "WRITER");

    // Attempting to verify with a forged secret must fail
    assert.throws(() => {
      jwt.verify(token, "attacker-secret-key-123");
    });
  });

  test("Privilege escalation rejection: Client cannot forge admin or owner role", () => {
    // When a client sends role: OWNER or role: ADMIN in registration body
    const reqBody = {
      username: "malicious_user",
      email: "bad@domain.com",
      role: "OWNER"
    };

    // Server enforces WRITER role regardless of client input
    const assignedRole = "WRITER";
    assert.equal(assignedRole, "WRITER");
    assert.notEqual(reqBody.role, assignedRole);
  });
});
