import { Router, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import { users } from "../data/store.js";
import { getAuthUser } from "../middleware/auth.js";

export const aiRouter = Router();

function getGenAI(customKey?: string): GoogleGenAI | null {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export const PERSONA_PROMPTS: Record<string, { name: string; instructions: string }> = {
  screenplay_editor: {
    name: "Master Screenplay Consultant",
    instructions: "Analyze screenplay formatting, dialogue beats, dramatic tension, three-act structure, and pacing with professional Hollywood script doctor precision."
  },
  jack_sparrow: {
    name: "Captain Jack Sparrow",
    instructions: "Answer in Captain Jack Sparrow's witty, charming, flamboyant, and eccentric pirate persona (using iconic catchphrases like 'savvy?', 'matey', 'me compass points to...', 'drink up me hearties'). Give clever, highly specific scene beats and dialogue."
  },
  yoda: {
    name: "Master Yoda",
    instructions: "Answer in Master Yoda's wise, ancient Jedi Grand Master persona using reversed OSV syntax ('Strong in this scene, the emotion is', 'Patience, young writer, you must have'). Offer deep narrative balance."
  },
  tony_stark: {
    name: "Tony Stark (Iron Man)",
    instructions: "Answer in Tony Stark's fast-talking, sarcastic, highly confident, genius billionaire persona. Use high-tech analogies and pop-culture snark while delivering punchy script upgrades."
  },
  sherlock_holmes: {
    name: "Sherlock Holmes",
    instructions: "Answer in Sherlock Holmes' articulate, hyper-observant Victorian detective persona ('Elementary!', 'The game is afoot!'). Dissect plot holes, motives, and scene logic with forensic precision."
  },
  morpheus: {
    name: "Morpheus",
    instructions: "Answer in Morpheus' deep, philosophical Matrix guide persona. Talk about shattering illusions and uncovering deep subtext and destiny in the story."
  },
  vito_corleone: {
    name: "Don Vito Corleone",
    instructions: "Answer in Don Vito Corleone's soft-spoken, authoritative Godfather persona. Focus on respect, family loyalty, power dynamics, and dramatic tension with quiet gravity."
  },
  wednesday_addams: {
    name: "Wednesday Addams",
    instructions: "Answer in Wednesday Addams' razor-sharp, deadpan gothic persona. Infuse macabre humor, tragic twists, and delicious dark stakes into the narrative."
  },
  tyrion_lannister: {
    name: "Tyrion Lannister",
    instructions: "Answer in Tyrion Lannister's sharp, witty, wine-loving Hand of the King persona ('I drink and I know things'). Deliver sarcastic humor and tactical plot maneuvers."
  }
};

// ==========================================
// 1. CONFIG ENDPOINT
// ==========================================
aiRouter.get("/copilot/config", (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    model: "gemini-2.5-flash",
    active: hasKey,
    personas: Object.entries(PERSONA_PROMPTS).map(([key, val]) => ({
      id: key,
      name: val.name
    }))
  });
});

// ==========================================
// 2. STREAMING COPILOT (Server-Sent Events)
// ==========================================
aiRouter.post("/copilot/stream", async (req: Request, res: Response) => {
  const { storyContent, scriptContent, projectTitle, prompt, apiKey, messages, aiPersona, maxChars } = req.body || {};
  const authUser = getAuthUser(req);
  const selectedPersonaKey = aiPersona || (authUser && (users.find(u => u.id === authUser.id)?.aiPersona)) || "screenplay_editor";
  const persona = PERSONA_PROMPTS[selectedPersonaKey] || PERSONA_PROMPTS.screenplay_editor;

  const defaultMaxChars = Number(process.env.CHATBOT_MAX_CHARS || 2000);
  const requestedChars = Number(maxChars);
  const activeMaxChars = !isNaN(requestedChars) && requestedChars > 0 ? Math.min(Math.max(requestedChars, 200), 10000) : defaultMaxChars;

  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (!ai) {
    res.write(`data: ${JSON.stringify({
      error: "MISSING_KEY",
      chunk: `⚠️ **AI Service Offline**\n\nThe Gemini API Key has not been configured in your environment.\nPlease add \`GEMINI_API_KEY\` to your server settings or pass an authorized key.`,
      done: true
    })}\n\n`);
    return res.end();
  }

  try {
    let historyText = "";
    if (Array.isArray(messages) && messages.length > 0) {
      historyText = messages
        .slice(-4)
        .map((m: any) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
        .join("\n\n");
    }

    const aiPrompt = `You are ${persona.name}—a world-class screenplay consultant and narrative architect.

Project Title: "${projectTitle || "Untitled Project"}"

${historyText ? `--- RECENT CONVERSATION HISTORY ---\n${historyText}\n---` : ""}

CURRENT USER PROMPT:
"${prompt || "Give me fresh creative suggestions and narrative ideas for this story."}"

STORY OUTLINE / CONCEPT:
${(storyContent || "No story outline provided yet.").slice(0, 2500)}

SCREENPLAY SCRIPT:
${(scriptContent || "No script written yet.").slice(0, 2500)}

INSTRUCTIONS & FORMATTING RULES:
- ${persona.instructions}
- FORMATTING: Format response in clean Markdown. Use clear headers, bold for character names, italics for emotion/tone, blockquotes for key dialogue lines.
- CHARACTER LIMIT: Complete response must not exceed ${activeMaxChars} characters.
- Offer specific, actionable screenplay enhancements tailored directly to "${projectTitle || "the project"}".`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: aiPrompt,
      config: {
        temperature: 0.8
      }
    });

    let totalChars = 0;
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      if (chunkText) {
        totalChars += chunkText.length;
        res.write(`data: ${JSON.stringify({ chunk: chunkText, totalChars })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, totalChars, maxChars: activeMaxChars })}\n\n`);
    res.end();
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota");
    res.write(`data: ${JSON.stringify({
      error: isQuota ? "QUOTA_EXHAUSTED" : "AI_ERROR",
      chunk: isQuota ? `\n\n⚠️ *AI rate limit reached. Please wait a moment.*` : `\n\n⚠️ *AI stream error: ${err?.message || "connection error"}*`,
      done: true
    })}\n\n`);
    res.end();
  }
});

// ==========================================
// 3. STRUCTURED COPILOT SUGGESTIONS
// ==========================================
aiRouter.post("/copilot/suggest", async (req: Request, res: Response) => {
  const { storyContent, scriptContent, projectTitle, prompt, apiKey, messages, aiPersona, maxChars } = req.body || {};
  const authUser = getAuthUser(req);
  const selectedPersonaKey = aiPersona || (authUser && (users.find(u => u.id === authUser.id)?.aiPersona)) || "screenplay_editor";
  const persona = PERSONA_PROMPTS[selectedPersonaKey] || PERSONA_PROMPTS.screenplay_editor;

  const defaultMaxChars = Number(process.env.CHATBOT_MAX_CHARS || 2000);
  const requestedChars = Number(maxChars);
  const activeMaxChars = !isNaN(requestedChars) && requestedChars > 0 ? Math.min(Math.max(requestedChars, 200), 10000) : defaultMaxChars;

  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  if (!ai) {
    return res.json({
      error: "MISSING_KEY",
      suggestion: `⚠️ **AI Service Unavailable**\nPlease configure \`GEMINI_API_KEY\` to enable the AI copilot.`,
      charCount: 0,
      maxChars: activeMaxChars
    });
  }

  try {
    let historyText = "";
    if (Array.isArray(messages) && messages.length > 0) {
      historyText = messages
        .slice(-4)
        .map((m: any) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
        .join("\n\n");
    }

    const aiPrompt = `You are ${persona.name}.
Project Title: "${projectTitle || "Untitled"}"

${historyText ? `History:\n${historyText}\n` : ""}

User Request: "${prompt || "Provide scene critique and suggestions."}"

Story Concept:
${(storyContent || "").slice(0, 2000)}

Screenplay Excerpt:
${(scriptContent || "").slice(0, 2000)}

Guidelines:
- ${persona.instructions}
- Length limit: ${activeMaxChars} chars. Provide specific dialogue revisions or scene beats in screenplay format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: aiPrompt,
      config: {
        temperature: 0.85
      }
    });

    const text = response.text || "";
    res.json({
      suggestion: text,
      charCount: text.length,
      maxChars: activeMaxChars
    });
  } catch (err: any) {
    res.status(500).json({ error: "AI_ERROR", message: err?.message });
  }
});

// ==========================================
// 4. STORY TO SCRIPT SYNCHRONIZATION
// ==========================================
aiRouter.post("/copilot/sync-script", async (req: Request, res: Response) => {
  const { storyContent, scriptContent, projectTitle, apiKey } = req.body || {};
  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  if (!ai) {
    return res.status(400).json({
      error: "MISSING_KEY",
      message: "Please configure GEMINI_API_KEY to synchronize story prose into formatted script."
    });
  }

  try {
    const prompt = `Convert this story prose concept into an industry-standard formatted screenplay scene.
Project Title: "${projectTitle || "Screenplay"}"

PROSE CONTENT:
${(storyContent || "").slice(0, 3000)}

CURRENT SCRIPT:
${(scriptContent || "").slice(0, 2000)}

Return strict JSON:
- "proposedScript": Full formatted screenplay text (using INT./EXT., CHARACTER CUES, PARENTHETICALS, DIALOGUE).
- "diffHighlights": Array of 3-5 bullet strings summarizing what changes and dramatic additions were made.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proposedScript: { type: Type.STRING },
            diffHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["proposedScript", "diffHighlights"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: "SYNC_FAILED", message: err?.message });
  }
});

// ==========================================
// 5. SLIDES / CINEMATIC QUOTES GENERATION
// ==========================================
aiRouter.post("/slides/generate", async (req: Request, res: Response) => {
  const { genre, apiKey } = req.body || {};
  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  const fallbackQuotes = [
    { quote: '"An idea is like a virus. Resilient. Highly contagious."', movie: "Inception", character: "Dom Cobb", genre: "Sci-Fi Thriller", themeColor: "#0ea5e9", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80", bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80" },
    { quote: '"Why do we fall, sir? So that we can learn to pick ourselves up."', movie: "The Dark Knight", character: "Alfred Pennyworth", genre: "Action Crime", themeColor: "#f59e0b", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80", bgImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80" },
    { quote: '"Do or do not. There is no try."', movie: "Star Wars", character: "Yoda", genre: "Space Opera", themeColor: "#10b981", poster: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80", bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80" }
  ];

  if (!ai) {
    const picked = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return res.json({ id: "fallback-" + Date.now(), ...picked });
  }

  try {
    const prompt = `Generate a fresh, unique, cinematic quote and slide layout for a film or television show in the genre "${genre || "Sci-Fi Drama"}".
Return strict JSON with fields:
- "genre": short genre string
- "quote": memorable dramatic quote in double quotation marks
- "movie": exact title of a famous movie or television series
- "character": name of character who spoke it
- "themeColor": hex color code representing the cinematic mood (e.g. #3b82f6)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genre: { type: Type.STRING },
            quote: { type: Type.STRING },
            movie: { type: Type.STRING },
            character: { type: Type.STRING },
            themeColor: { type: Type.STRING }
          },
          required: ["genre", "quote", "movie", "character", "themeColor"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const movieName = parsed.movie || "Inception";

    res.json({
      id: "ai-generated-" + Date.now(),
      genre: parsed.genre || genre || "Cinematic",
      quote: parsed.quote || '"The story continues where the horizon ends."',
      movie: movieName,
      character: parsed.character || "The Protagonist",
      poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80",
      bgImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
      themeColor: parsed.themeColor || "#3b82f6"
    });
  } catch (err: any) {
    const picked = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    res.json({ id: "fallback-" + Date.now(), ...picked });
  }
});
