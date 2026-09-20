import axios from "axios";

export interface GoogleVerifiedPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
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

  // 3. Try Firebase ID Token (JWT with securetoken.google.com)
  try {
    if (cleanToken.split(".").length === 3) {
      const parts = cleanToken.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (
        payload &&
        payload.iss &&
        payload.iss.startsWith("https://securetoken.google.com/") &&
        payload.email
      ) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < nowSec) {
          console.warn("Firebase token is expired");
          return null;
        }
        if (payload.email_verified === false) {
          console.warn("Firebase token email not verified");
          return null;
        }
        return {
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split("@")[0],
          picture: payload.picture,
          sub: payload.sub || payload.user_id
        };
      }
    }
  } catch (fbErr: any) {
    // Ignore parse error
  }

  console.warn("Google token verification failed for provided token.");
  return null;
}

