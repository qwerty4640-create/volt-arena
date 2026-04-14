import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Rate limiting to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });

  app.use(express.json());
  app.use("/api/", limiter);

  // Gemini AI Coach Endpoint
  app.post("/api/ai-coach", async (req, res) => {
    try {
      const { message, currentWorkoutTitle, currentExercises } = req.body;

      // Basic input validation
      if (!message || typeof message !== 'string' || message.length > 1000) {
        return res.status(400).json({ error: "Invalid message. Must be a string under 1000 characters." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("Server Error: GEMINI_API_KEY is missing");
        return res.status(500).json({ error: "AI service is currently unavailable." });
      }

      const genAI = new GoogleGenAI({ apiKey });

      const SYSTEM_INSTRUCTION = `You are the Volt Arena AI Coach, a tactical strength and conditioning expert with over 15 years of experience training elite athletes and tactical operators. 
Your tone is industrial, high-performance, and firm but encouraging. You focus on precision, form, and progressive overload.
You are currently coaching a user during their workout session.

When the user asks to "surprise me", you should suggest 1-2 additional accessory exercises or a core circuit to add to their routine. 
These should be relevant to their current workout but provide a unique challenge (e.g., a landmine variation, a high-intensity finisher, or a complex core movement).

You can also answer questions about form, RPE, or general strength training principles.
Always maintain your persona as a seasoned, tactical coach.`;
      
      const prompt = `Current Workout: ${currentWorkoutTitle || 'Unknown'}
Current Exercises: ${(currentExercises || []).join(', ')}

User Message: ${message}`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The coach's spoken response to the user." },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['ADD_EXERCISE', 'REPLACE_EXERCISE'] },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              weight: { type: Type.STRING },
                              reps: { type: Type.STRING },
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["text"]
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("AI Coach Error:", error);
      res.status(500).json({ error: "Failed to communicate with AI Coach. Please try again later." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
