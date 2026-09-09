export default async function handler(req, res) {
  const { id } = req.query;

  // URL de exportación CSV de tu Google Sheet
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1Oy7oviUDfuKbSWfTWEO2qLLcRkblcxp8n0uVoQOEPE0/export?format=csv";

  const targetUrl = id 
    ? `https://pstore.com.ve/#${id}`
    : "https://pstore.com.ve/";

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
      const filas = parseCSV(csvText);

      if (filas.length > 1) {
        // Mapear posiciones de columnas usando la primera fila (encabezados)
        const encabezados = filas[0].map(h => h.trim().toLowerCase());
        const idIndex = encabezados.findIndex(h => h === 'id');
        const nombreIndex = encabezados.findIndex(h => h === 'nombre');
        const precioIndex = encabezados.findIndex(h => h === 'precio');
        const descIndex = encabezados.findIndex(h => h === 'descripcion');
        const imgIndex = encabezados.findIndex(h => h === 'imagen' || h === 'imagen_link' || h === 'imagen_drive');

        const idBuscado = String(id || '').trim().toUpperCase();

        // Recorrer las filas de datos
        for (let i = 1; i < filas.length; i++) {
          const fila = filas[i];
          if (!fila || fila.length <= idIndex) continue;

          const filaId = String(fila[idIndex] || '').trim().toUpperCase();

          // Comparación exacta de ID
          if (filaId === idBuscado) {
            producto = {
              nombre: fila[nombreIndex] ? fila[nombreIndex].trim() : "Producto Pstore",
              precio: fila[precioIndex] ? fila[precioIndex].trim() : "",
              descripcion: fila[descIndex] ? fila[descIndex].trim() : "Explora nuestro catálogo en Pstore.",
              imagen: fila[imgIndex] ? fila[imgIndex].trim() : ""
            };
            break; // Detener la búsqueda al encontrar el producto exacto
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
  
  let imagenUrl = "https://pstore.com.ve/assets/pstore.jpg";
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

// Parser CSV robusto
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const row = [];
    let insideQuotes = false;
    let entry = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
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
    result.push(row);
  }
  return result;
}
