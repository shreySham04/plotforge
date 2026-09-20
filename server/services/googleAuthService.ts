import axios from "axios";

export interface GoogleVerifiedPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleVerifiedPayload | null> {
  if (!idToken || typeof idToken !== "string") {
    return null;
  }

  try {
    // Verify token against Google's public tokeninfo service
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      timeout: 5000
    });

    if (response.data && response.data.email) {
      // Ensure email is verified by Google
      if (response.data.email_verified === "false" || response.data.email_verified === false) {
        console.warn("Google token verification rejected: email is not verified.");
        return null;
      }

      return {
        email: response.data.email.toLowerCase(),
        name: response.data.name || response.data.given_name || response.data.email.split("@")[0],
        picture: response.data.picture,
        sub: response.data.sub
      };
    }
    return null;
  } catch (error: any) {
    console.warn("Google token verification error:", error?.response?.data || error?.message);
    return null;
  }
}
