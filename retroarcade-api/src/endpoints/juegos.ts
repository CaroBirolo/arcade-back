import type { Context } from "hono";

// Obtener un juego por ID
export const JuegoById = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("SELECT * FROM juegos WHERE id = ?").bind(id).first();
    if (!result) return c.json({ error: 'No encontrado' }, 404);
    return c.json(result);
  } catch {
    return c.json({ error: 'Error interno' }, 500);
  }
};

// Listar todos los juegos paginados
export const JuegosList = async (c: Context) => {
  try {
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '40');
    const offset = page * size;

    const results = await c.env.DB
      .prepare("SELECT * FROM juegos LIMIT ? OFFSET ?")
      .bind(size, offset)
      .all();

    return c.json({ page, size, content: results.results });
  } catch {
    return c.json({ error: 'Error interno' }, 500);
  }
};

// Listar juegos por categoriaId paginados
export const JuegosByCategoria = async (c: Context) => {
  try {
    const categoriaId = c.req.param('categoriaId');
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '40');
    const offset = page * size;

    // 🔹 Contar el total de juegos de esa categoría
    const totalQuery = await c.env.DB
      .prepare("SELECT COUNT(*) AS total FROM juegos WHERE categoria_id = ?")
      .bind(categoriaId)
      .first();


    const total = totalQuery?.total || 0;
    const totalPages = Math.ceil(total / size);

    // 🔹 Obtener los juegos paginados
    const results = await c.env.DB
      .prepare("SELECT * FROM juegos WHERE categoria_id = ? LIMIT ? OFFSET ?")
      .bind(categoriaId, size, offset)
      .all();

    return c.json({
      page,
      size,
      total,
      totalPages,
      content: results.results,
    });
  } catch (err) {
    return c.json({ error: 'Error interno', detalle: (err as any).message }, 500);
  }
};

// Buscar juegos por nombre (contiene)
export const BuscarJuegos = async (c: Context) => {
  try {
    const url = new URL(c.req.url);
    const nombre = url.searchParams.get('nombre') || '';
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '40');
    const offset = page * size;

    const results = await c.env.DB
      .prepare("SELECT * FROM juegos WHERE LOWER(nombre) LIKE ? LIMIT ? OFFSET ?")
      .bind(`%${nombre.toLowerCase()}%`, size, offset)
      .all();

    return c.json({ page, size, content: results.results });
  } catch {
    return c.json({ error: 'Error interno' }, 500);
  }
};

// Juegos aleatorios (ajustado)
export const JuegosRandom = async (c: Context) => {
  try {
    const size = c.req.param('size');
    const results = await c.env.DB
      .prepare("SELECT * FROM juegos ORDER BY RANDOM() LIMIT ?")
      .bind(size)
      .all();

    return c.json(results.results);
  } catch (err) {
    return c.json({ error: "Error al obtener juegos aleatorios", detalle: err as any }, 500);
  }
};

// Juegos por nombre de categoría

export const JuegosByCategoriaSlugYLetra = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const letra = c.req.param("letra");

    const page = Number(c.req.query("page") || 0);
    const size = Number(c.req.query("size") || 40);
    const offset = page * size;

    if (!letra) {
      return c.json({ error: "Debe especificar una letra (A-Z) o # para números" }, 400);
    }

    // 🔹 Buscar categoría por slug
    const categoria = await c.env.DB
      .prepare("SELECT id, nombre, slug FROM categorias WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first();

    if (!categoria) {
      return c.json({ error: "Categoría no encontrada" }, 404);
    }

    // 🔹 Armar filtro por letra
    let filtroNombre = "";
    let bindValues: any[] = [];

    if (letra === "#") {
      filtroNombre = "j.nombre GLOB '[0-9]*'";
      bindValues = [categoria.id, size, offset];
    } else {
      filtroNombre = "LOWER(j.nombre) LIKE ?";
      bindValues = [categoria.id, letra.toLowerCase() + "%", size, offset];
    }

    // 🔹 Consulta principal
    const query = `
      SELECT j.*
      FROM juegos j
      WHERE j.categoria_id = ?
      AND ${filtroNombre}
      LIMIT ? OFFSET ?
    `;

    const results = await c.env.DB.prepare(query).bind(...bindValues).all();

    // 🔹 Contar el total de elementos
    let countValues: any[] = [];

    if (letra === "#") {
      countValues = [categoria.id];
    } else {
      countValues = [categoria.id, letra.toLowerCase() + "%"];
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM juegos j
      WHERE j.categoria_id = ?
      AND ${filtroNombre}
    `;

    const totalRes = await c.env.DB.prepare(countQuery).bind(...countValues).first();
    const total = totalRes?.total || 0;

    return c.json({
      categoria,
      letra,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
      content: results.results || [],
    });

  } catch (err) {
    return c.json(
      { error: "Error al obtener juegos por categoría y letra", detalle: (err as any).message },
      500
    );
  }
};


// ==========================
// OBTENER JUEGO POR SLUG
// ==========================
export const JuegoBySlug = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const result = await c.env.DB
      .prepare("SELECT * FROM juegos WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first();

    if (!result) return c.json({ error: "No encontrado" }, 404);

    return c.json(result);
  } catch (err) {
    return c.json(
      { error: "Error interno", detalle: (err as any).message },
      500
    );
  }
};

export const JuegosByCategoriaSlug = async (c: Context) => {
  try {
    const slug = c.req.param("slug");

    const page = Number(c.req.query("page") || 0);
    const size = Number(c.req.query("size") || 40);
    const offset = page * size;

    const categoria = await c.env.DB
      .prepare("SELECT id, nombre, slug FROM categorias WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first();

    if (!categoria) {
      return c.json({ error: "Categoría no encontrada" }, 404);
    }

    const totalResult = await c.env.DB
      .prepare("SELECT COUNT(*) AS total FROM juegos WHERE categoria_id = ?")
      .bind(categoria.id)
      .first<{ total: number }>();

    const total = totalResult?.total || 0;

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

