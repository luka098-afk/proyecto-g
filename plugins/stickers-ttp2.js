import Jimp from "jimp-legacy";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export default {
  command: ["ttp2", "attp2"],

  run: async ({ conn, m, remoteJid, text }) => {
    try {
      // Validar que haya texto
      if (!text && !m.quoted?.text) {
        return await conn.sendText(remoteJid, "⚠️ Ingresa un texto para crear el sticker animado.\n\nEjemplo: *.ttp2 Hola Mundo*", m);
      }

      // Reaccionar con emoji de carga
      await conn.sendMessage(remoteJid, {
        react: {
          text: "⏳",
          key: m.key
        }
      });

      // Obtener el texto y LIMPIAR el comando
      let raw = text || m.quoted?.text || "";
      
      // IMPORTANTE: Remover el comando .ttp2 o ttp2 o .attp2 o attp2 del inicio
      raw = raw.replace(/^\.?(ttp2|attp2)\s*/i, '').trim();
      
      if (!raw) {
        return await conn.sendText(remoteJid, "⚠️ Debes escribir un texto después del comando.\n\nEjemplo: *.ttp2 Hola Mundo*", m);
      }

      const teks = raw.toUpperCase().trim();

      console.log("📝 Texto a procesar (RGB):", teks);

      // Dividir en palabras
      const words = teks.split(" ");
      let lines = [];

      if (words.length <= 6) {
        const rows = Math.ceil(Math.sqrt(words.length));
        const perRow = Math.ceil(words.length / rows);
        for (let i = 0; i < words.length; i += perRow) {
          lines.push(words.slice(i, i + perRow).join(" "));
        }
      } else {
        const idealCharPerLine = Math.floor(Math.sqrt(teks.length * 1.3)) + 5;
        const wrapLength = Math.max(10, idealCharPerLine);
        let current = "";
        for (const word of words) {
          if ((current + " " + word).trim().length > wrapLength) {
            lines.push(current.trim());
            current = word;
          } else {
            current += " " + word;
          }
        }
        if (current) lines.push(current.trim());
      }

      console.log("📋 Líneas generadas:", lines);

      const font = await Jimp.loadFont("./resources/BebasNeue.fnt");
      const canvasWidth = 500;
      const canvasHeight = 500;

      const coloresUnicos = 16;
      const duracionPorColorMs = 100;

      const tmp = "./tmp";
      if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

      // Usar timestamp único para evitar conflictos
      const timestamp = Date.now();

      // Generar frames con diferentes colores
      for (let i = 0; i < coloresUnicos; i++) {
        const hue = (i / coloresUnicos) * 360;
        const color = Jimp.cssColorToHex(`hsl(${hue}, 100%, 50%)`);

        const bg = new Jimp(canvasWidth, canvasHeight, 0x00000000);

        let maxWidth = 0;
        let totalHeight = 0;
        const lineHeights = [];

        for (const line of lines) {
          const w = Jimp.measureText(font, line);
          const h = Jimp.measureTextHeight(font, line, 1000);
          maxWidth = Math.max(maxWidth, w);
          totalHeight += h;
          lineHeights.push(h);
        }

        const textImg = new Jimp(maxWidth + 20, totalHeight + 20, 0x00000000);
        let y = 0;

        for (let j = 0; j < lines.length; j++) {
          const x = (textImg.bitmap.width - Jimp.measureText(font, lines[j])) / 2;
          textImg.print(font, x, y, lines[j]);
          y += lineHeights[j];
        }

        textImg.autocrop();
        textImg.scaleToFit(canvasWidth - 40, canvasHeight - 40);
        bg.composite(
          textImg,
          (canvasWidth - textImg.bitmap.width) / 2,
          (canvasHeight - textImg.bitmap.height) / 2
        );

        // Aplicar color RGB
        bg.scan(0, 0, bg.bitmap.width, bg.bitmap.height, function (x, y, idx) {
          if (this.bitmap.data[idx + 3] > 10) {
            this.bitmap.data[idx] = (color >> 16) & 255;
            this.bitmap.data[idx + 1] = (color >> 8) & 255;
            this.bitmap.data[idx + 2] = color & 255;
          }
        });

        await bg.writeAsync(`${tmp}/rgb_${timestamp}_${i.toString().padStart(3, "0")}.png`);
      }

      console.log("🎨 Frames generados, creando animación...");

      const output = `${tmp}/rgb_final_${timestamp}.webp`;

      // Eliminar archivo de salida si existe
      if (fs.existsSync(output)) {
        fs.unlinkSync(output);
      }

      // Crear animación con ffmpeg
      await execAsync(
        `ffmpeg -y -r ${1000 / duracionPorColorMs} -i "${tmp}/rgb_${timestamp}_%03d.png" ` +
        `-vf "fps=${1000 / duracionPorColorMs}" -c:v libwebp -lossless 0 -quality 85 -loop 0 -preset picture -an "${output}"`
      );

      // Limpiar frames temporales
      for (let i = 0; i < coloresUnicos; i++) {
        try {
          fs.unlinkSync(`${tmp}/rgb_${timestamp}_${i.toString().padStart(3, "0")}.png`);
        } catch {}
      }

      console.log("✅ Animación creada, enviando sticker...");

      // Verificar que el archivo se creó correctamente
      if (!fs.existsSync(output)) {
        throw new Error("No se pudo crear la animación WebP");
      }

      // Leer el archivo generado
      const buffer = fs.readFileSync(output);
      
      // Limpiar archivo temporal
      try {
        fs.unlinkSync(output);
      } catch (err) {
        console.log("⚠️ No se pudo eliminar archivo temporal:", output);
      }

      console.log("✅ Enviando sticker animado...");

      // Enviar sticker directamente (el WebP ya está en formato correcto)
      await conn.sendMessage(remoteJid, {
        sticker: buffer
      }, { quoted: m });

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: "✅",
          key: m.key
        }
      });

      console.log("✅ Sticker TTP2 RGB enviado exitosamente");

    } catch (error) {
      console.error("❌ Error en comando TTP2:", error.message);
      console.error("Stack:", error.stack);

      await conn.sendText(
        remoteJid,
        `⚠️ Error al crear el sticker animado: ${error.message}`,
        m
      );

      // Reaccionar con X
      await conn.sendMessage(remoteJid, {
        react: {
          text: "❌",
          key: m.key
        }
      });
    }
  }
};
