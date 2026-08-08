export default async function handler(req, res) {
  const { id } = req.query;

  const SHEETS_JSON_URL = "https://script.google.com/macros/s/AKfycby13DdZgzysrZd04zHKW3F-Qw9TrIHKlvsa0akmjhbJnOhXTfYErP8JKGARrdOnvpSbZQ/exec";

  if (!id) {
    return res.redirect(302, "https://ivanguillermo.github.io/pstore/");
  }

  try {
    const response = await fetch(SHEETS_JSON_URL);
    const productos = await response.json();

    // Normalizamos el ID recibido (quitamos espacios y pasamos a mayúsculas: "dk-z-0007 " -> "DK-Z-0007")
    const idBuscado = String(id).trim().toUpperCase();

    // Búsqueda tolerante a variaciones de nombres de columnas y casing
    const producto = productos.find(p => {
      const pId = String(p.id || p.ID || p.codigo || p.nombre_id || "").trim().toUpperCase();
      return pId === idBuscado;
    });

    if (!producto) {
      return res.redirect(302, "https://ivanguillermo.github.io/pstore/");
    }

    // Tolerancia por si la columna de nombre viene con otro encabezado
    const nombre = producto.nombre || producto.producto || producto.Nombre || "Producto Pstore";
    const precio = producto.precio ? `$${parseFloat(producto.precio).toFixed(2)}` : "";
    const titulo = `${nombre} | Pstore ${precio}`.trim();
    const descripcion = producto.descripcion || producto.Descripcion || "Encuentra este y más productos en Pstore.";
    
    // Tu lógica de imagen intacta (si no trae imagen, usa el logo por defecto)
    let imagenUrl = producto.id_drive_imagen || producto.imagen || "https://ivanguillermo.github.io/pstore/assets/pstore.jpg";
    
    // Si viene solo el ID de Drive, le anteponemos el formato de Google Photos/Drive
    if (!imagenUrl.startsWith("http")) {
      imagenUrl = `https://lh3.googleusercontent.com/d/${imagenUrl}=w600-h600-no`;
    }

    const targetUrl = `https://ivanguillermo.github.io/pstore/#${id}`;

    // Detectar Scrapers / Bots para no redirigirlos de golpe
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const esBot = /facebookexternalhit|whatsapp|twitterbot|telegrambot|bingbot|googlebot/i.test(userAgent);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  
  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${targetUrl}">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descripcion}">
  <meta property="og:image" content="${imagenUrl}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titulo}">
  <meta name="twitter:description" content="${descripcion}">
  <meta name="twitter:image" content="${imagenUrl}">

  ${!esBot ? `<script>window.location.replace("${targetUrl}");</script>` : ''}
</head>
<body>
  <p>Cargando producto en Pstore...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (error) {
    return res.redirect(302, `https://ivanguillermo.github.io/pstore/#${id}`);
  }
}
