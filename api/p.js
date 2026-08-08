export default async function handler(req, res) {
  const { id } = req.query;

  const SHEETS_JSON_URL = "https://script.google.com/macros/s/AKfycby13DdZgzysrZd04zHKW3F-Qw9TrIHKlvsa0akmjhbJnOhXTfYErP8JKGARrdOnvpSbZQ/exec";

  const targetUrl = id 
    ? `https://ivanguillermo.github.io/pstore/#${id}`
    : "https://ivanguillermo.github.io/pstore/";

  // Detectar bots/scrapers de redes sociales
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const esBot = /facebookexternalhit|whatsapp|twitterbot|telegrambot|bingbot|googlebot/i.test(userAgent);

  // Si no hay ID y NO es un bot, redirigir directo
  if (!id && !esBot) {
    return res.redirect(302, targetUrl);
  }

  let producto = null;

  try {
    // Forzamos a fetch a seguir las redirecciones automáticas de Google Apps Script
    const response = await fetch(SHEETS_JSON_URL, { redirect: 'follow' });
    if (response.ok) {
      const productos = await response.json();
      const idBuscado = String(id || '').trim().toUpperCase();

      producto = productos.find(p => {
        const pId = String(p.id || p.ID || p.codigo || p.nombre_id || "").trim().toUpperCase();
        return pId === idBuscado;
      });
    }
  } catch (error) {
    console.error("Error al obtener los productos:", error);
  }

  // Si es un usuario humano y no encontramos el producto o falló el fetch, redirigir
  if (!esBot && !producto) {
    return res.redirect(302, targetUrl);
  }

  // Si llegamos aquí (es un bot O es un humano con producto encontrado), construimos los metadatos:
  const nombre = producto ? (producto.nombre || producto.producto || producto.Nombre || "Producto Pstore") : "Pstore";
  const precio = (producto && producto.precio) ? `$${parseFloat(producto.precio).toFixed(2)}` : "";
  const titulo = `${nombre} ${precio} | Pstore`.trim();
  const descripcion = producto ? (producto.descripcion || producto.Descripcion || "Encuentra este producto en Pstore.") : "Explora nuestro catálogo en Pstore.";
  
  let idDrive = "";
  if (producto) {
    const rawImagen = String(producto.id_drive_imagen || producto.imagen || "");
    const match = rawImagen.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawImagen.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      idDrive = match[1];
    } else if (rawImagen && !rawImagen.startsWith("http")) {
      idDrive = rawImagen.split(",")[0].trim();
    }
  }

  const imagenUrl = idDrive 
    ? `https://lh3.googleusercontent.com/d/${idDrive}=w600-h600-no` 
    : "https://ivanguillermo.github.io/pstore/assets/pstore.jpg";

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
