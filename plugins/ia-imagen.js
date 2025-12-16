import axios from 'axios';
import * as cheerio from 'cheerio';

// Función personalizada para buscar imágenes en Google
async function googleImage(query) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const images = [];

    // Extraer URLs de imágenes
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && src.startsWith('http')) {
        images.push(src);
      }
    });

    // También buscar en los scripts JSON
    $('script').each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes('["http')) {
        const matches = content.match(/\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/\["|"/g, '');
            if (url.startsWith('http')) {
              images.push(url);
            }
          });
        }
      }
    });

    return [...new Set(images)]; // Eliminar duplicados
  } catch (error) {
    console.error('Error en googleImage:', error.message);
    return [];
  }
}

export default {
  command: ["imagen"],
  admin: false,
  
  run: async ({ conn, m, remoteJid, isGroup, text }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE HAYA TEXTO
      // ══════════════════════════════════════════════════════
      let cleanText = text ? text.replace(/^\.imagen\s*/i, '').trim() : '';

      if (!cleanText) {
        return await conn.sendText(
          remoteJid,
          `❌ Debes proporcionar un término de búsqueda.\n\n*Ejemplo:*\n.imagen gato\n.imagen paisaje montaña\n.imagen auto deportivo`,
          m
        );
      }

      text = cleanText;

      // ══════════════════════════════════════════════════════
      // 🔄 REACCIÓN DE BÚSQUEDA
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '🔍', key: m.key }
        });
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar`);
      }

      // ══════════════════════════════════════════════════════
      // 🖼️ BUSCAR IMAGEN EN GOOGLE
      // ══════════════════════════════════════════════════════
      console.log(`🔍 Buscando imagen: ${text}`);

      const res = await googleImage(text);

      if (!res || res.length === 0) {
        await conn.sendText(
          remoteJid,
          `❌ No se encontraron resultados para: *${text}*\n\nIntenta con otro término de búsqueda.`,
          m
        );
        return;
      }

      // Filtrar solo imágenes válidas (no muy pequeñas)
      const validImages = res.filter(url => 
        !url.includes('logo') && 
        !url.includes('icon') &&
        !url.includes('avatar') &&
        url.length < 500
      );

      const results = validImages.slice(0, 20);

      if (results.length === 0) {
        await conn.sendText(
          remoteJid,
          `❌ No se encontraron imágenes válidas para: *${text}*\n\nIntenta con otro término.`,
          m
        );
        return;
      }

      // Elegir uno al azar
      const imageUrl = results[Math.floor(Math.random() * results.length)];

      console.log(`✅ Imagen encontrada: ${imageUrl}`);

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR IMAGEN
      // ══════════════════════════════════════════════════════
      await conn.sendMessage(remoteJid, {
        image: { url: imageUrl },
        caption: `🔍 *Resultado de:* ${text}`,
        mimetype: 'image/jpeg'
      }, { quoted: m });

      console.log(`✅ Imagen enviada para: ${text}`);

      // ══════════════════════════════════════════════════════
      // ✅ REACCIÓN DE ÉXITO
      // ══════════════════════════════════════════════════════
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '✅', key: m.key }
        });
      } catch (err) {
        console.log(`⚠️ No se pudo reaccionar`);
      }

    } catch (err) {
      console.error(`❌ Error en ia-imagen.js:`, err.message);
      console.error(err.stack);

      await conn.sendText(
        remoteJid,
        `❌ Ocurrió un error al buscar la imagen.\n\nIntenta nuevamente o con otro término.`,
        m
      );

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⚠️', key: m.key }
        });
      } catch (e) {
        console.log(`⚠️ No se pudo reaccionar: ${e.message}`);
      }
    }
  }
};
