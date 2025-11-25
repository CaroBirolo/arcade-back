import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { CategoriasList } from "./endpoints/categorias";
import { JuegosList, JuegoById, JuegosByCategoria, BuscarJuegos, JuegosRandom, JuegosByCategoriaYLetra } from "./endpoints/juegos";


// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// ✅ Permitir CORS desde cualquier origen (temporalmente)
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["*"],
}));

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/categorias", CategoriasList);
openapi.get("/api/juegos", JuegosList);

openapi.get("/api/juegos/id/:id", JuegoById);
openapi.get("/api/juegos/categoria/:categoriaId", JuegosByCategoria);
openapi.get("/api/juegos/buscar", BuscarJuegos);
openapi.get("/api/juegos/random/:size", JuegosRandom);
openapi.get("/api/juegos/categoria/id/:id/letra/:letra", JuegosByCategoriaYLetra);


export default app;
