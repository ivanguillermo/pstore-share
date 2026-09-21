export default async function handler(req, res) {
  let { id } = req.query;

  if (id) {
    id = decodeURIComponent(id).replace('#', '').trim().toUpperCase();
  }

  // IMPORTANTE: Asegúrate de que este enlace CSV sea exactamente el de la pestaña de productos
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1Oy7oviUDfuKbSWfTWEO2qLLcRkblcxp8n0uVoQOEPE0/export?format=csv";

  const targetUrl = id 
    ? `https://pstore.com.ve/#${id}`
    : "https://pstore.com.ve/";

  let producto = null;

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (response.ok) {
      const csvText = await response.text();
      const filas = parseCSV(csvText);

      if (filas.length > 1) {
        const encabezados = filas[0].map(h => h.trim().toLowerCase());
        const idIndex = encabezados.findIndex(h => h === 'id');
        const nombreIndex = encabezados.findIndex(h => h === 'nombre');
        const precioIndex = encabezados.findIndex(h => h === 'precio');
        const descIndex = encabezados.findIndex(h => h === 'descripcion');
        const imgLinkIndex = encabezados.findIndex(h => h === 'imagen_link');
        const imgIndex = encabezados.findIndex(h => h === 'imagen');
        const imgDriveIndex = encabezados.findIndex(h => h === 'imagen_drive');

        console.log("Buscando ID:", id);
        console.log("Encabezados encontrados:", encabezados);

        for (let i = 1; i < filas.length; i++) {
          const fila = filas[i];
          if (!fila || idIndex === -1 || fila.length <= idIndex) continue;

          const filaId = String(fila[idIndex] || '').trim().toUpperCase();

          if (filaId === id) {
            let imgCruda = '';
            if (imgLinkIndex !== -1 && fila[imgLinkIndex]) imgCruda = fila[imgLinkIndex];
            else if (imgIndex !== -1 && fila[imgIndex]) imgCruda = fila[imgIndex];
            else if (imgDriveIndex !== -1 && fila[imgDriveIndex]) imgCruda = fila[imgDriveIndex];

            producto = {
              nombre: (nombreIndex !== -1 && fila[nombreIndex]) ? fila[nombreIndex].trim() : "Producto Pstore",
              precio: (precioIndex !== -1 && fila[precioIndex]) ? fila[precioIndex].trim() : "",
              descripcion: (descIndex !== -1 && fila[descIndex]) ? fila[descIndex].trim() : "Explora nuestro catálogo en Pstore.",
              imagen: imgCruda.trim()
            };
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error leyendo CSV:", error);
  }

  const nombre = producto ? producto.nombre : "Pstore | Tu Tienda Online";
  const precioStr = (producto && producto.precio) ? `$${parseFloat(producto.precio).toFixed(2)}` : "";
  const titulo = producto ? `${nombre} ${precioStr} | Pstore`.trim() : "Pstore | Tu Tienda Online";
  const descripcion = producto ? producto.descripcion : "Explora nuestro catálogo en Pstore.";
  
  let imagenUrl = "https://pstore.com.ve/assets/pstore.jpg";
  if (producto && producto.imagen) {
    const rawImg = producto.imagen;
    const matchDrive = rawImg.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawImg.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (matchDrive && matchDrive[1]) {
      imagenUrl = `https://lh3.googleusercontent.com/d/${matchDrive[1]}=w800-h800-rw`;
    } else if (rawImg.startsWith("http")) {
      imagenUrl = rawImg;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <meta property="og:type" content="website">
  <meta property="og:url" content="${targetUrl}">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descripcion}">
  <meta property="og:image" content="${imagenUrl}">
  <meta property="og:image:secure_url" content="${imagenUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <script>window.location.replace("${targetUrl}");</script>
</head>
<body>
  <p>Redirigiendo a Pstore...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}

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
