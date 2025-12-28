import type { Context } from "hono";


export const BuscarJuegos = async (c: Context) => {
  try {
    const url = new URL(c.req.url);
    const nombre = url.searchParams.get("nombre") || "";
    const page = parseInt(url.searchParams.get("page") || "0");
    const size = parseInt(url.searchParams.get("size") || "40");
    const offset = page * size;


    // 🔹 Contar el total de juegos de esa categoría
    const totalResult = await c.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM juegos WHERE LOWER(nombre) LIKE ?"
    )
      .bind(`%${nombre.toLowerCase()}%`)
      .all();

    const total =
      totalResult.results?.[0]?.total ||
      totalResult.results?.[0]?.["COUNT(*)"] ||
      0;

    const totalPages = Math.ceil(total / size);


    const results = await c.env.DB.prepare(
      "SELECT * FROM juegos WHERE LOWER(nombre) LIKE ? LIMIT ? OFFSET ?"
    )
      .bind(`%${nombre.toLowerCase()}%`, size, offset)
      .all();

    return c.json({ page, size, juegos: results.results, totalPages });
  } catch {
    return c.json({ error: "Error interno" }, 500);
  }
};

export const JuegosRandom = async (c: Context) => {
  try {
    const size = c.req.param("size");
    const results = await c.env.DB.prepare(
      "SELECT * FROM juegos ORDER BY RANDOM() LIMIT ?"
    )
      .bind(size)
      .all();

    return c.json(results.results);
  } catch (err) {
    return c.json(
      { error: "Error al obtener juegos aleatorios", detalle: err as any },
      500
    );
  }
};

export const JuegoBySlug = async (c: Context) => {
  try {
    const slug = c.req.param("slug");

    const result = await c.env.DB.prepare(
      "SELECT * FROM juegos WHERE slug = ? LIMIT 1"
    )
      .bind(slug)
      .first();

    if (!result) return c.json({ error: "Juego no encontrado" }, 404);

    return c.json(result);
  } catch (err) {
    return c.json({ error: "Error interno", detail: (err as any).message }, 500);
  }
};

export const JuegosByCategoriaSlug = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const letra = c.req.query("letra"); // ← OPCIONAL

    const page = Number(c.req.query("page") || 0);
    const size = Number(c.req.query("size") || 40);
    const offset = page * size;

    /* ===============================
       Buscar categoría
    ================================ */

    const categoria = await c.env.DB.prepare(
      "SELECT id, nombre, slug FROM categorias WHERE slug = ? LIMIT 1"
    )
      .bind(slug)
      .first();

    if (!categoria) {
      return c.json({ error: "Categoría no encontrada" }, 404);
    }

    /* ===============================
       Filtro por letra (opcional)
    ================================ */

    let filtroLetraSQL = "";
    let filtroParams: any[] = [];

    if (letra) {
      if (letra === "#") {
        filtroLetraSQL = "AND j.nombre GLOB '[0-9]*'";
      } else {
        filtroLetraSQL = "AND LOWER(j.nombre) LIKE ?";
        filtroParams.push(letra.toLowerCase() + "%");
      }
    }

    /* ===============================
       TOTAL
    ================================ */

    const totalQuery = `
      SELECT COUNT(*) AS total
      FROM juegos j
      WHERE j.categoria_id = ?
      ${filtroLetraSQL}
    `;

    const totalRes = await c.env.DB.prepare(totalQuery)
      .bind(categoria.id, ...filtroParams)
      .first();

    const total = totalRes?.total ?? totalRes?.["COUNT(*)"] ?? 0;
    const totalPages = Math.ceil(total / size);

    /* ===============================
       LISTADO
    ================================ */

    const juegosQuery = `
      SELECT j.*
      FROM juegos j
      WHERE j.categoria_id = ?
      ${filtroLetraSQL}
      LIMIT ? OFFSET ?
    `;

    const juegosRes = await c.env.DB.prepare(juegosQuery)
      .bind(categoria.id, ...filtroParams, size, offset)
      .all();

    return c.json({
      categoria,
      letra: letra || null,
      page,
      size,
      total,
      totalPages,
      juegos: juegosRes.results || [],
    });
  } catch (err) {
    return c.json(
      {
        error: "Error al obtener juegos por categoría",
        detalle: (err as Error).message,
      },
      500
    );
  }
};
