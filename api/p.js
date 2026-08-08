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

      // Busca coincidencia en CUALQUIER propiedad del objeto que contenga el ID buscado
      producto = productos.find(p => {
        return Object.values(p).some(val => String(val).trim().toUpperCase() === idBuscado);
      });
    }
  } catch (error) {
    console.error("Error al obtener productos:", error);
  }

  if (!esBot && !producto) {
    return res.redirect(302, targetUrl);
  }

  // Extracción flexible de campos
  let nombre = "Producto Pstore";
  let precio = "";
  let idDrive = "";
  let descripcion = "Explora nuestro catálogo en Pstore.";

  if (producto) {
    // Buscar nombre
    nombre = producto.nombre || producto.producto || producto.Nombre || producto.title || Object.values(producto)[1] || "Producto Pstore";
    
    // Buscar precio
    const precioVal = producto.precio || producto.Precio || producto.price;
    if (precioVal) {
      precio = `$${parseFloat(precioVal).toFixed(2)}`;
    }

    // Buscar descripción
    descripcion = producto.descripcion || producto.Descripcion || producto.detalle || descripcion;

    // Extraer ID de Drive de cualquier campo que contenga una URL o un ID de imagen
    const posibleImagen = producto.id_drive_imagen || producto.imagen || producto.imagen_url || producto.id_drive || producto.url || "";
    const stringImg = String(posibleImagen);
    
    const match = stringImg.match(/\/d\/([a-zA-Z0-9_-]+)/) || stringImg.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      idDrive = match[1];
    } else if (stringImg && !stringImg.startsWith("http")) {
      idDrive = stringImg.split(",")[0].trim();
    }
  }

  const titulo = producto ? `${nombre} ${precio} | Pstore`.trim() : "Pstore | Tu Tienda Online";
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
