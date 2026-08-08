export default async function handler(req, res) {
  const { id } = req.query;

  const SHEETS_JSON_URL = "https://script.google.com/macros/s/AKfycby13DdZgzysrZd04zHKW3F-Qw9TrIHKlvsa0akmjhbJnOhXTfYErP8JKGARrdOnvpSbZQ/exec";

  const targetUrl = id 
    ? `https://ivanguillermo.github.io/pstore/#${id}`
    : "https://ivanguillermo.github.io/pstore/";

  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const esBot = /facebookexternalhit|whatsapp|twitterbot|telegrambot|bingbot|googlebot/i.test(userAgent);

  if (!id && !esBot) {
    return res.redirect(302, targetUrl);
  }

  let producto = null;

  try {
    const response = await fetch(SHEETS_JSON_URL, { redirect: 'follow' });
    if (response.ok) {
      const productos = await response.json();
      const idBuscado = String(id || '').trim().toUpperCase();

      // Búsqueda usando exactamente la columna ID de tu CSV
      producto = productos.find(p => {
        const pId = String(p.ID || p.id || "").trim().toUpperCase();
        return pId === idBuscado;
      });
    }
  } catch (error) {
    console.error("Error al consultar productos:", error);
  }

  if (!esBot && !producto) {
    return res.redirect(302, targetUrl);
  }

  // Mapeo exacto según los encabezados de tu Sheet / CSV
  const nombre = producto ? (producto.nombre || "Producto Pstore") : "Pstore | Tu Tienda Online";
  const precio = (producto && producto.precio) ? `$${parseFloat(producto.precio).toFixed(2)}` : "";
  const titulo = producto ? `${nombre} ${precio} | Pstore`.trim() : "Pstore | Tu Tienda Online";
  const descripcion = producto ? (producto.descripcion || "Explora nuestro catálogo en Pstore.") : "Explora nuestro catálogo en Pstore.";
  
  // Imagen: toma 'imagen', 'imagen_link', 'imagen_drive' o usa el logo por defecto
  let imagenUrl = "https://ivanguillermo.github.io/pstore/assets/pstore.jpg";
  if (producto) {
    const rawImg = producto.imagen || producto.imagen_link || producto.imagen_drive;
    if (rawImg && rawImg.startsWith("http")) {
      imagenUrl = rawImg;
    } else if (rawImg) {
      // Si viene solo el ID de Google Drive
      imagenUrl = `https://lh3.googleusercontent.com/d/${rawImg}=w600-h600-no`;
    }
  }

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
}
