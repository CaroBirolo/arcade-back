import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { BuscarJuegos,
  JuegosRandom, JuegoBySlug, JuegosByCategoriaSlug 
} from "./endpoints/juegos";
import { CategoriasList } from "./endpoints/categorias";


/*CONFIG GENERAL*/
const DEV_MODE = true; // 🔴 poner en false en producción

const allowedOrigins = [
  "https://retroverse.cc",
  "https://www.retroverse.cc",
];

/*RATE LIMIT (simple)*/
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60_000;

const ipRequests = new Map<string, { count: number; time: number }>();

/*APP*/
const app = new Hono<{ Bindings: Env }>();

/* CORS */
app.use("*", async (c, next) => {
  // 🔓 DEV: permitir todo
  if (DEV_MODE) {
    return cors({
      origin: "*",
      allowMethods: ["GET"],
      allowHeaders: ["*"],
    })(c, next);
  }

  // 🔒 PROD
  const origin = c.req.header("origin") ?? null;

  let allowOrigin: string | null = null;

  if (!origin) {
    allowOrigin = "*";
  } else if (allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  }

  return cors({
    origin: allowOrigin,
    allowMethods: ["GET"],
    allowHeaders: ["content-type"],
  })(c, next);
});

/* ANTI BOTS (solo PROD)*/
app.use("*", async (c, next) => {
  if (DEV_MODE) return next();

  const ua = (c.req.header("user-agent") || "").toLowerCase();
  const badBots = ["curl", "wget", "python", "scraper", "bot", "java", "fetch"];

  if (badBots.some(b => ua.includes(b))) {
    return c.text("Forbidden (bot detected)", 403);
  }

  await next();
});

/*RATE LIMIT (solo PROD) */
app.use("*", async (c, next) => {
  if (DEV_MODE) return next();

  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const now = Date.now();

  let entry = ipRequests.get(ip);

  if (!entry) {
    ipRequests.set(ip, { count: 1, time: now });
  } else {
    if (now - entry.time < RATE_LIMIT_WINDOW) {
      entry.count++;
      if (entry.count > RATE_LIMIT_MAX) {
        return c.text("Rate limit exceeded", 429);
      }
    } else {
      entry.count = 1;
      entry.time = now;
    }
  }

  await next();
});

/* RIGIN CHECK EXTRA (solo PROD) */
app.use("*", async (c, next) => {
  if (DEV_MODE) return next();

  const origin = c.req.header("origin");

  // permitir requests sin origin (SSR, Workers, etc)
  if (!origin) return next();

  if (!allowedOrigins.includes(origin)) {
    return c.text("Forbidden origin", 403);
  }

  await next();
});

/*ENDPOINTS*/
const openapi = fromHono(app, { docs_url: "/" });

openapi.get("/api/categorias", CategoriasList);
openapi.get("/api/juegos/slug/:slug", JuegoBySlug);

openapi.get("/api/juegos/buscar", BuscarJuegos);
openapi.get("/api/juegos/random/:size", JuegosRandom);
openapi.get("/api/juegos/categoria/slug/:slug", JuegosByCategoriaSlug);
export default app;
