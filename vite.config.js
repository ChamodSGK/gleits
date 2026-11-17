import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Tiny file-based "backend" for form submissions.
 *
 * POST /api/enquiries     -> appends to data/enquiries.json   (Contact page)
 * POST /api/applications  -> appends to data/applications.json (Careers page)
 *
 * It runs inside the Vite server, so it works with `npm run dev` and
 * `npm run preview`. A purely static host (Netlify, GitHub Pages…) has no
 * server, so on those the forms need a hosted form service instead.
 */
const DATA_DIR = path.resolve(process.cwd(), "data");
const ROUTES = {
  "/api/enquiries": "enquiries.json",
  "/api/applications": "applications.json",
};
const MAX_BODY = 50 * 1024; // 50 KB is plenty for a text-only form

// Only these fields are kept; anything else in the request is dropped.
const FIELDS = {
  "/api/enquiries": ["name", "company", "email", "phone", "service", "budget", "message"],
  "/api/applications": ["name", "email", "phone", "role", "message"],
};

let writeQueue = Promise.resolve(); // serialise writes so entries never clobber each other

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("too_large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function append(file, entry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, file);
  let list = [];
  try {
    list = JSON.parse(await fs.readFile(target, "utf8"));
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  list.push(entry);
  await fs.writeFile(target, JSON.stringify(list, null, 2) + "\n", "utf8");
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function submissionsMiddleware(req, res, next) {
  const route = req.url && req.url.split("?")[0];
  if (!ROUTES[route]) return next();
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });

  readBody(req)
    .then((raw) => {
      const data = JSON.parse(raw || "{}");
      if (data.website) return send(res, 200, { ok: true }); // honeypot filled: quietly ignore bots

      const entry = { id: Date.now().toString(36), submittedAt: new Date().toISOString() };
      for (const key of FIELDS[route]) {
        entry[key] = typeof data[key] === "string" ? data[key].trim().slice(0, 5000) : "";
      }
      if (!entry.name || !/^\S+@\S+\.\S+$/.test(entry.email) || !entry.message) {
        return send(res, 400, { ok: false, error: "Please fill in your name, a valid email and a message." });
      }
      writeQueue = writeQueue.then(() => append(ROUTES[route], entry));
      return writeQueue.then(() => send(res, 200, { ok: true }));
    })
    .catch((err) =>
      send(res, err.message === "too_large" ? 413 : 400, { ok: false, error: "Could not read your submission." }),
    );
}

const jsonSubmissions = () => ({
  name: "gleits-json-submissions",
  configureServer(server) {
    server.middlewares.use(submissionsMiddleware);
  },
  configurePreviewServer(server) {
    server.middlewares.use(submissionsMiddleware);
  },
});

export default defineConfig({
  plugins: [react(), jsonSubmissions()],
  server: { watch: { ignored: ["**/data/**"] } }, // don't reload the page when a submission is saved
});
