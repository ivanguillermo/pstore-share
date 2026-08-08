export default async function handler(req, res) {
  const { id } = req.query; // Captura el ID del producto (ej: ART-001)

  // URL pública de la API/Google Sheets o tu JSON de productos
  const SHEETS_JSON_URL = "URL_DE_TU_GOOGLE_SHEET_EN_JSON_O_PSTORE_JSON";

  if (!id) {
    return res.redirect("https://ivanguillermo.github.io/pstore/");
  }

  try {
    // 1. Obtener datos de tus productos
    const response = await fetch(SHEETS_JSON_URL);
    const productos = await response.json();

    // 2. Buscar el producto por ID o Nombre
    const producto = productos.find(p => p.id === id || p.nombre_id === id);

    if (!producto) {
      return res.redirect("https://ivanguillermo.github.io/pstore/");
    }

    const titulo = `${producto.nombre} | Pstore ($${producto.precio})`;
    const descripcion = producto.descripcion || "Encuentra este y más productos en Pstore.";
    // Usamos la URL limpia de Google Drive para la vista previa
    const imagenUrl = `https://lh3.googleusercontent.com/d/${producto.id_drive_imagen}`;
    const targetUrl = `https://ivanguillermo.github.io/pstore/#${id}`;

    // 3. Generar HTML con Meta Tags para el Crawler de WhatsApp
    const html = `
      <!DOCTYPE html>
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

        <!-- Redirección automática si un humano abre el enlace -->
        <meta http-equiv="refresh" content="0;url=${targetUrl}">
        <script>window.location.href = "${targetUrl}";</script>
      </head>
      <body>
        <p>Redirigiendo a Pstore...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (error) {
    // Si falla la consulta, redirige directamente a la tienda
    return res.redirect(`https://ivanguillermo.github.io/pstore/#${id}`);
  }
}
