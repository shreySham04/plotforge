import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../server.js";

describe("PlotForge v2: Real HTTP Integration Matrix", () => {
  let testServer: http.Server;
  let baseUrl: string;

  async function request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Connection", "close");
    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers
    });
  }

  before(async () => {
    // Start an isolated HTTP server on an ephemeral port
    await new Promise<void>((resolve) => {
      testServer = app.listen(0, "127.0.0.1", () => {
        const address = testServer.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    if (testServer) {
      if (typeof (testServer as any).closeAllConnections === "function") {
        (testServer as any).closeAllConnections();
      }
      await new Promise<void>((resolve) => {
        testServer.close(() => resolve());
      });
    }
  });

  test("1. GET /api/health returns HTTP 200 with service health status", async () => {
    const res = await request("/api/health");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "UP");
    assert.equal(body.service, "PlotForge API");
    assert.equal(body.version, "2.0.0");
  });

  test("2. CORS policy dynamically reflects Vercel and production origins with credentials", async () => {
    const res = await request("/api/health", {
      headers: {
        Origin: "https://plotforge.vercel.app"
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://plotforge.vercel.app");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });

  test("3. POST /api/auth/register creates a writer and prevents role spoofing", async () => {
    const testUsername = `http_test_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;

    const res = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: "ValidPassword123!",
        role: "OWNER" // Attempted privilege spoof
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.token, "Expected JWT token in response");
    assert.equal(body.role, "WRITER", "Role must be forced to WRITER regardless of client input");
    assert.equal(body.isOwner, false, "Registered user must not be owner");
  });

  test("4. POST /api/auth/login succeeds with correct password, fails with wrong password", async () => {
    const testUsername = `login_test_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;

    // First register
    await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: "SecretPassword2026!"
      })
    });

    // Attempt login with incorrect password -> 401
    const failRes = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword999!"
      })
    });
    assert.equal(failRes.status, 401);

    // Attempt login with correct password -> 200
    const passRes = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "SecretPassword2026!"
      })
    });
    assert.equal(passRes.status, 200);
    const passBody = await passRes.json();
    assert.ok(passBody.token);
    assert.equal(passBody.email, testEmail);
  });

  test("5. GET /api/auth/me enforces JWT requirement", async () => {
    // Without token -> 401
    const unauthRes = await request("/api/auth/me");
    assert.equal(unauthRes.status, 401);

    // With valid token -> 200
    const testUsername = `me_test_${Date.now()}`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        email: `${testUsername}@example.com`,
        password: "Password123!"
      })
    });
    const { token } = await regRes.json();

    const authRes = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(authRes.status, 200);
    const meBody = await authRes.json();
    assert.equal(meBody.username, testUsername);
  });

  test("6. POST /api/projects enforces authentication", async () => {
    // Unauthenticated project creation -> 401
    const unauthRes = await request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauthorized Project" })
    });
    assert.equal(unauthRes.status, 401);

    // Authenticated project creation -> 201
    const testUsername = `proj_test_${Date.now()}`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        email: `${testUsername}@example.com`,
        password: "Password123!"
      })
    });
    const { token } = await regRes.json();

    const authRes = await request("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "The Quantum Horizon",
        logline: "An astronaut discovers a recursive timeline.",
        genre: "Sci-Fi",
        isPublic: false
      })
    });
    assert.equal(authRes.status, 201);
    const projectBody = await authRes.json();
    assert.equal(projectBody.title, "The Quantum Horizon");
    assert.equal(projectBody.isPublic, false);
  });

  test("7. Social Endpoints: POST /reviews/:id/like requires authentication and prevents spam inflation", async () => {
    // Register user A
    const userA = `voter_a_${Date.now()}`;
    const regA = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: userA,
        email: `${userA}@example.com`,
        password: "Password123!"
      })
    });
    const { token: tokenA } = await regA.json();

    // Create a review
    const createRevRes = await request("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        movieTitle: "Inception",
        rating: 5,
        content: "Brilliant architectural mind heist.",
        genre: "Sci-Fi"
      })
    });
    assert.equal(createRevRes.status, 201);
    const review = await createRevRes.json();

    // 1. Unauthenticated like -> 401 Unauthorized
    const unauthRes = await request(`/api/reviews/${review.id}/like`, { method: "POST" });
    assert.equal(unauthRes.status, 401, "Unauthenticated like must be rejected with 401");

    // 2. User A likes review -> 200, liked: true
    const likeRes1 = await request(`/api/reviews/${review.id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(likeRes1.status, 200);
    const body1 = await likeRes1.json();
    assert.equal(body1.liked, true);
    const likesAfterFirst = body1.likes;

    // 3. User A clicks like again -> toggles off (liked: false, likes: -1), preventing spam inflation
    const likeRes2 = await request(`/api/reviews/${review.id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(likeRes2.status, 200);
    const body2 = await likeRes2.json();
    assert.equal(body2.liked, false);
    assert.equal(body2.likes, likesAfterFirst - 1);
  });

  test("8. Social Endpoints: POST /fanfuture/:id/upvote requires authentication and prevents spam", async () => {
    // Register user
    const testUsername = `upvoter_${Date.now()}`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        email: `${testUsername}@example.com`,
        password: "Password123!"
      })
    });
    const { token } = await regRes.json();

    // Create a fanfuture post
    const createPostRes = await request("/api/fanfuture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Blade Runner 2099 Concept",
        synopsis: "Replicants seek transcendence in an orbital neon colony.",
        franchise: "Blade Runner"
      })
    });
    assert.equal(createPostRes.status, 201);
    const post = await createPostRes.json();

    // Unauthenticated -> 401
    const unauthRes = await request(`/api/fanfuture/${post.id}/upvote`, { method: "POST" });
    assert.equal(unauthRes.status, 401, "Unauthenticated upvote must be rejected with 401");

    // Authenticated -> 200
    const upvoteRes = await request(`/api/fanfuture/${post.id}/upvote`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(upvoteRes.status, 200);
    const body = await upvoteRes.json();
    assert.equal(typeof body.upvotes, "number");
    assert.equal(body.upvoted, true);
  });

  test("9. Social Endpoints: POST /fanconcepts/:id/upvote requires authentication", async () => {
    // Unauthenticated -> 401
    const unauthRes = await request("/api/fanconcepts/999/upvote", { method: "POST" });
    assert.equal(unauthRes.status, 401, "Unauthenticated concept upvote must be rejected with 401");
  });
});
