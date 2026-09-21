import axios from "axios";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export interface GoogleVerifiedPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

let cachedExpectedProjectId: string | null = null;

export function getExpectedFirebaseProjectId(): string | null {
  if (cachedExpectedProjectId) return cachedExpectedProjectId;

  const envPid = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (envPid) {
    cachedExpectedProjectId = envPid;
    return cachedExpectedProjectId;
  }

  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (raw && raw.projectId && typeof raw.projectId === "string") {
        cachedExpectedProjectId = raw.projectId.trim();
        return cachedExpectedProjectId;
      }
    }
  } catch (_) {}

  return null;
}

// In-memory cached Google x509 public certificates for Firebase ID token verification
let googleCertCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (googleCertCache && googleCertCache.expiresAt > now) {
    return googleCertCache.certs;
  }

  try {
    const res = await axios.get<Record<string, string>>(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { timeout: 5000 }
    );
    if (res.data && typeof res.data === "object") {
      // Cache certs for 1 hour
      googleCertCache = {
        certs: res.data,
        expiresAt: now + 60 * 60 * 1000
      };
      return res.data;
    }
  } catch (err: any) {
    console.warn("Notice: Failed to fetch Google x509 certs for Firebase ID token verification:", err?.message);
  }

  return googleCertCache?.certs || {};
}

export async function verifyGoogleToken(token: string): Promise<GoogleVerifiedPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const cleanToken = token.trim();

  // 1. Try Google ID Token verification (tokeninfo?id_token=)
  try {
    const idRes = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(cleanToken)}`,
      { timeout: 5000 }
    );
    if (idRes.data && idRes.data.email) {
      if (idRes.data.email_verified === "false" || idRes.data.email_verified === false) {
        console.warn("Google ID token rejected: email is not verified.");
        return null;
      }
      return {
        email: idRes.data.email.toLowerCase(),
        name: idRes.data.name || idRes.data.given_name || idRes.data.email.split("@")[0],
        picture: idRes.data.picture,
        sub: idRes.data.sub
      };
    }
  } catch (idErr: any) {
    // Not a Google ID token or query failed; try access_token / userinfo endpoints
  }

  // 2. Try Google OAuth2 Access Token via userinfo endpoint
  try {
    const userinfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${cleanToken}` },
      timeout: 5000
    });

    if (userinfoRes.data && userinfoRes.data.email) {
      if (userinfoRes.data.email_verified === "false" || userinfoRes.data.email_verified === false) {
        console.warn("Google Access token rejected: email is not verified.");
        return null;
      }
      return {
        email: userinfoRes.data.email.toLowerCase(),
        name: userinfoRes.data.name || userinfoRes.data.given_name || userinfoRes.data.email.split("@")[0],
        picture: userinfoRes.data.picture,
        sub: userinfoRes.data.sub
      };
    }
  } catch (accessErr: any) {
    // Try tokeninfo?access_token=
    try {
      const accessInfoRes = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(cleanToken)}`,
        { timeout: 5000 }
      );
      if (accessInfoRes.data && accessInfoRes.data.email) {
        if (accessInfoRes.data.email_verified === "false" || accessInfoRes.data.email_verified === false) {
          console.warn("Google tokeninfo access_token rejected: email not verified.");
          return null;
        }
        return {
          email: accessInfoRes.data.email.toLowerCase(),
          name: accessInfoRes.data.email.split("@")[0],
          picture: undefined,
          sub: accessInfoRes.data.sub
        };
      }
    } catch {
      // Continue to Firebase token check
    }
  }

  // 3. Try Firebase ID Token (Cryptographically verified against Google's public x509 certificates)
  try {
    if (cleanToken.split(".").length === 3) {
      const decodedComplete = jwt.decode(cleanToken, { complete: true }) as {
        header?: { alg?: string; kid?: string };
        payload?: any;
      } | null;

      const expectedProjectId = getExpectedFirebaseProjectId();

      if (
        decodedComplete?.header?.kid &&
        decodedComplete.header.alg === "RS256" &&
        decodedComplete.payload?.iss?.startsWith("https://securetoken.google.com/")
      ) {
        // Enforce expected Firebase Project ID and Audience binding
        if (expectedProjectId) {
          const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
          if (decodedComplete.payload.iss !== expectedIssuer) {
            console.warn(
              `Firebase token rejected: issuer mismatch (expected ${expectedIssuer}, received ${decodedComplete.payload.iss})`
            );
            return null;
          }
          if (decodedComplete.payload.aud !== expectedProjectId) {
            console.warn(
              `Firebase token rejected: audience mismatch (expected ${expectedProjectId}, received ${decodedComplete.payload.aud})`
            );
            return null;
          }
        }

        const certs = await getGooglePublicCerts();
        const cert = certs[decodedComplete.header.kid];

        if (!cert) {
          console.warn("Firebase token rejected: unknown kid in Google public certificates.");
          return null;
        }

        const verifyOptions: jwt.VerifyOptions = {
          algorithms: ["RS256"]
        };
        if (expectedProjectId) {
          verifyOptions.audience = expectedProjectId;
          verifyOptions.issuer = `https://securetoken.google.com/${expectedProjectId}`;
        }

        // Verify cryptographic signature with Google's public certificate
        const verifiedPayload = jwt.verify(cleanToken, cert, verifyOptions) as any;

        if (verifiedPayload && verifiedPayload.email) {
          if (verifiedPayload.email_verified === false) {
            console.warn("Firebase token rejected: email is not verified.");
            return null;
          }

          return {
            email: verifiedPayload.email.toLowerCase(),
            name: verifiedPayload.name || verifiedPayload.email.split("@")[0],
            picture: verifiedPayload.picture,
            sub: verifiedPayload.sub || verifiedPayload.user_id
          };
        }
      }
    }
  } catch (fbErr: any) {
    console.warn("Firebase token cryptographic signature verification failed:", fbErr?.message);
    return null;
  }

  console.warn("Google token verification failed for provided token.");
  return null;
}

