import type { Context } from "hono";

export async function CategoriasList(c: Context) {
  // Ejecuta la consulta a la base D1 (binding DB)
  const results = await c.env.DB.prepare("SELECT * FROM categorias").all();
  return c.json(results.results);
}

// ==========================
// OBTENER CATEGORÍA POR SLUG
// ==========================
export const CategoriaBySlug = async (c: Context) => {
  try {
    const slug = c.req.param("slug");

    const result = await c.env.DB
      .prepare("SELECT * FROM categorias WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first();

    if (!result) return c.json({ error: "No encontrado" }, 404);

    return c.json(result);
  } catch (err) {
    return c.json(
      { error: "Error interno", detalle: (err as Error).message },
      500
    );
  }
};
