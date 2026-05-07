import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.post("/api/backup-data", async (req, res) => {
    const { uid, filename, data } = req.body;
    if (!uid || !filename || !data) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const fs = await import('fs');
    const dataDir = path.join(process.cwd(), 'data', uid);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Use timestamp in filename for history
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const finalFilename = `${filename.replace('.json', '')}_${timestamp}.json`;
    
    fs.writeFileSync(path.join(dataDir, finalFilename), JSON.stringify(data, null, 2));
    res.json({ status: "ok", filename: finalFilename });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);

  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // SPA Fallback for Development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    console.log("Serving static files from dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filepath) => {
        // Ensure Service Worker and related files are never cached
        if (filepath.endsWith('sw.js') || filepath.endsWith('manifest.json') || filepath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
