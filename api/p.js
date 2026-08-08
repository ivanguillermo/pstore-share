export default async function handler(req, res) {
  const { id } = req.query;

  // URL pública donde obtienes tus datos de productos
  const SHEETS_JSON_URL = "https://script.google.com/macros/s/AKfycby13DdZgzysrZd04zHKW3F-Qw9TrIHKlvsa0akmjhbJnOhXTfYErP8JKGARrdOnvpSbZQ/exec";

  if (!id) {
    return res.redirect(302, "https://ivanguillermo.github.io/pstore/");
  }

  try {
    const response = await fetch(SHEETS_JSON_URL);
    const productos = await response.json();

    const producto = productos.find(p => p.id === id || p.nombre_id === id);

    if (!producto) {
      return res.redirect(302, "https://ivanguillermo.github.io/pstore/");
    }

    const titulo = `${producto.nombre} | Pstore ($${parseFloat(producto.precio).toFixed(2)})`;
    const descripcion = producto.descripcion || "Encuentra este y más productos en Pstore.";
    
    // URL optimizada para miniatura de Google Drive
    const imagenUrl = `https://lh3.googleusercontent.com/d/${producto.id_drive_imagen}=w600-h600-no`;
    const targetUrl = `https://ivanguillermo.github.io/pstore/#${id}`;

    // Detectar si la petición viene de un Bot/Scraper de redes sociales
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
