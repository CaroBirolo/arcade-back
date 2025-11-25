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

    // 🔹 page y size desde query
    const page = Number(c.req.query("page") || 0);
    const size = Number(c.req.query("size") || 40);
    const offset = page * size;

    // 🔹 Obtener la categoría por slug
    const categoria = await c.env.DB
      .prepare("SELECT id, nombre, slug FROM categorias WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first();

    if (!categoria) {
      return c.json({ error: "Categoría no encontrada" }, 404);
    }

    // 🔹 Contar el total de juegos de esa categoría
    const totalResult = await c.env.DB
      .prepare("SELECT COUNT(*) AS total FROM juegos WHERE categoria_id = ?")
      .bind(categoria.id)
      .first<{ total: number }>();

    const total = totalResult?.total || 0;

    // 🔹 Obtener los juegos de esa categoría con paginación
    const juegos = await c.env.DB
      .prepare(
        "SELECT * FROM juegos WHERE categoria_id = ? LIMIT ? OFFSET ?"
      )
      .bind(categoria.id, size, offset)
      .all();

    return c.json({
      categoria,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      juegos: juegos.results || [],
    });
  } catch (err) {
    return c.json(
      { error: "Error interno", detalle: (err as Error).message },
      500
    );
  }
};

