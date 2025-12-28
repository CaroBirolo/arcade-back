import type { Context } from "hono";

export async function CategoriasList(c: Context) {
  // Ejecuta la consulta a la base D1 (binding DB)
  const results = await c.env.DB.prepare("SELECT * FROM categorias").all();
  return c.json(results.results);
}
