import type { Context } from "hono";

/* =====================================
   GET - Obtener comentarios aprobados
===================================== */
export const ObtenerComentarios = async (c: Context) => {
  try {
    const slug = c.req.query("slug");

    if (!slug) {
      return c.json({ error: "Slug del juego requerido" }, 400);
    }

    const comentarios = await c.env.DB.prepare(
      `SELECT
        id,
        nombre,
        contenido,
        rating,
        fecha_creacion
      FROM comentarios
      WHERE juego_slug = ? AND estado = 'aprobado'
      ORDER BY fecha_creacion DESC`
    )
      .bind(slug)
      .all();

    return c.json(comentarios.results || []);
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    return c.json(
      { error: "Error al cargar comentarios", detalle: (err as Error).message },
      500
    );
  }
};

/* =====================================
   POST - Crear nuevo comentario
===================================== */
export const CrearComentario = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { juego_id, juego_slug, nombre, email, contenido, rating } = body;

    // Validaciones básicas
    if (!juego_id || !juego_slug || !nombre || !email || !contenido) {
      return c.json(
        { error: "Faltan campos requeridos" },
        400
      );
    }

    if (nombre.length < 2 || nombre.length > 100) {
      return c.json(
        { error: "Nombre debe tener entre 2 y 100 caracteres" },
        400
      );
    }

    if (contenido.length < 5 || contenido.length > 500) {
      return c.json(
        { error: "Comentario debe tener entre 5 y 500 caracteres" },
        400
      );
    }

    const ratingNum = parseInt(rating || "5");
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return c.json(
        { error: "Rating debe ser un número entre 1 y 5" },
        400
      );
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        { error: "Email inválido" },
        400
      );
    }

    // Obtener IP del cliente
    const ip =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "unknown";
    const userAgent = c.req.header("user-agent") || "unknown";

    /* =====================================
       Verificar spam por IP/Email
    ===================================== */
    const spamCheck = await c.env.DB.prepare(
      `SELECT bloqueado, cantidad_comentarios
       FROM comentarios_spam
       WHERE (email = ? OR ip_address = ?)
       LIMIT 1`
    )
      .bind(email, ip)
      .first();

    if (spamCheck?.bloqueado) {
      return c.json(
        { error: "Tu cuenta ha sido bloqueada por sospecha de spam" },
        403
      );
    }

    // Contar comentarios del mismo email en últimas 24 horas
    const recentComments = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM comentarios
       WHERE email = ? AND fecha_creacion > datetime('now', '-24 hours')`
    )
      .bind(email)
      .first();

    const recentCount = (recentComments as any)?.count || 0;
    if (recentCount > 10) {
      return c.json(
        { error: "Has excedido el límite de comentarios. Intenta mañana" },
        429
      );
    }

    /* =====================================
       Verificar juego existe
    ===================================== */
    const juego = await c.env.DB.prepare(
      "SELECT id FROM juegos WHERE id = ? AND slug = ? LIMIT 1"
    )
      .bind(juego_id, juego_slug)
      .first();

    if (!juego) {
      return c.json(
        { error: "Juego no encontrado" },
        404
      );
    }

    /* =====================================
       Insertar comentario
    ===================================== */
    const resultado = await c.env.DB.prepare(
      `INSERT INTO comentarios
       (juego_id, juego_slug, nombre, email, contenido, rating, estado, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`
    )
      .bind(juego_id, juego_slug, nombre, email, contenido, ratingNum, ip, userAgent)
      .run();

    /* =====================================
       Actualizar tabla de spam
    ===================================== */
    if (spamCheck) {
      // Ya existe registro, incrementar contador
      await c.env.DB.prepare(
        `UPDATE comentarios_spam
         SET cantidad_comentarios = cantidad_comentarios + 1,
             ultima_accion = CURRENT_TIMESTAMP
         WHERE email = ? OR ip_address = ?`
      )
        .bind(email, ip)
        .run();
    } else {
      // Crear nuevo registro en spam tracking
      await c.env.DB.prepare(
        `INSERT INTO comentarios_spam (email, ip_address, cantidad_comentarios)
         VALUES (?, ?, 1)`
      )
        .bind(email, ip)
        .run();
    }

    return c.json(
      {
        success: true,
        message: "Comentario enviado correctamente. Será visible después de revisión.",
        id: resultado.meta.last_row_id,
      },
      201
    );
  } catch (err) {
    console.error("Error al crear comentario:", err);
    return c.json(
      { error: "Error interno al publicar comentario", detalle: (err as Error).message },
      500
    );
  }
};
