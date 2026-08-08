export default async function handler(req, res) {
  const { id } = req.query;

  // Reemplaza TU_SPREADSHEET_ID con el ID real de tu Google Sheet
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1Oy7oviUDfuKbSWfTWEO2qLLcRkblcxp8n0uVoQOEPE0/export?format=csv";

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
    const response = await fetch(SHEET_CSV_URL);
    if (response.ok) {
      const csvText = await response.text();
      const filas = parseCSVSimple(csvText);

      if (filas.length > 1) {
        const encabezados = filas[0].map(h => h.trim().toLowerCase());
        const idIndex = encabezados.findIndex(h => h === 'id');
        const nombreIndex = encabezados.findIndex(h => h === 'nombre');
        const precioIndex = encabezados.findIndex(h => h === 'precio');
        const descIndex = encabezados.findIndex(h => h === 'descripcion');
        const imgIndex = encabezados.findIndex(h => h === 'imagen' || h === 'imagen_link' || h === 'imagen_drive');

        const idBuscado = String(id || '').trim().toUpperCase();

        for (let i = 1; i < filas.length; i++) {
          const fila = filas[i];
          const filaId = String(fila[idIndex] || '').trim().toUpperCase();

          if (filaId === idBuscado) {
            producto = {
              nombre: fila[nombreIndex] || "Producto Pstore",
              precio: fila[precioIndex] || "",
              descripcion: fila[descIndex] || "Explora nuestro catálogo en Pstore.",
              imagen: fila[imgIndex] || ""
            };
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error leyendo CSV:", error);
  }

  if (!esBot && !producto) {
    return res.redirect(302, targetUrl);
  }

  const nombre = producto ? producto.nombre : "Pstore | Tu Tienda Online";
  const precio = (producto && producto.precio) ? `$${parseFloat(producto.precio).toFixed(2)}` : "";
  const titulo = producto ? `${nombre} ${precio} | Pstore`.trim() : "Pstore | Tu Tienda Online";
  const descripcion = producto ? producto.descripcion : "Explora nuestro catálogo en Pstore.";
  
  let imagenUrl = "https://ivanguillermo.github.io/pstore/assets/pstore.jpg";
  if (producto && producto.imagen) {
    const rawImg = producto.imagen.trim();
    if (rawImg.startsWith("http")) {
      imagenUrl = rawImg;
    } else {
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

// Parser ligero y rápido para CSV
function parseCSVSimple(text) {
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    const row = [];
    let insideQuotes = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  });
}
