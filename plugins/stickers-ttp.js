import Jimp from "jimp-legacy";
import { sticker } from "../lib/sticker.js";

export default {
  command: ["ttp"],

  run: async ({ conn, m, remoteJid, text }) => {
    try {
      // Validar que haya texto
      if (!text && !m.quoted?.text) {
        return await conn.sendText(remoteJid, "⚠️ Ingresa un texto para crear el sticker.\n\nEjemplo: *.ttp Hola Mundo*", m);
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
      
      // IMPORTANTE: Remover el comando .ttp o ttp del inicio
      raw = raw.replace(/^\.?ttp\s*/i, '').trim();
      
      if (!raw) {
        return await conn.sendText(remoteJid, "⚠️ Debes escribir un texto después del comando.\n\nEjemplo: *.ttp Hola Mundo*", m);
      }
      
      let teks = raw.toUpperCase().trim();

      console.log("📝 Texto a procesar:", teks);

      // Dividir en palabras
      const words = teks.split(" ");
      let lines = [];

      // Distribuir palabras en líneas
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
        for (let word of words) {
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

      // Configuración del canvas
      const canvasWidth = 500;
      const canvasHeight = 500;
      const bg = new Jimp(canvasWidth, canvasHeight, 0x00000000);
      const font = await Jimp.loadFont("./resources/BebasNeue.fnt");  
      
      // Calcular dimensiones del texto
      let maxWidth = 0;
      let totalHeight = 0;
      const lineHeights = [];

      for (let line of lines) {
        const w = Jimp.measureText(font, line);
        const h = Jimp.measureTextHeight(font, line, 1000);
        maxWidth = Math.max(maxWidth, w);
        totalHeight += h;
        lineHeights.push(h);
      }

      // Crear imagen de texto
      const textImg = new Jimp(maxWidth + 20, totalHeight + 20, 0x00000000);
      let currentY = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const x = (textImg.getWidth() - Jimp.measureText(font, line)) / 2;
        textImg.print(font, x, currentY, line);
        currentY += lineHeights[i];
      }

      // Ajustar y centrar
      textImg.autocrop();
      const maxContentWidth = canvasWidth - 40;
      const maxContentHeight = canvasHeight - 40;
      textImg.scaleToFit(maxContentWidth, maxContentHeight);

      const xCenter = (canvasWidth - textImg.getWidth()) / 2;
      const yCenter = (canvasHeight - textImg.getHeight()) / 2;
      bg.composite(textImg, xCenter, yCenter);

      console.log("🎨 Imagen generada, convirtiendo a sticker...");

      // Convertir a buffer PNG
      const buffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      
      // Generar sticker
      const stickerBuffer = await sticker(buffer, null);

      if (!stickerBuffer) {
        throw new Error("Error al generar el sticker");
      }

      console.log("✅ Sticker generado, enviando...");

      // Enviar sticker
      await conn.sendMessage(remoteJid, {
        sticker: stickerBuffer
      }, { quoted: m });
      
      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: "✅",
          key: m.key
        }
      });

      console.log("✅ Sticker TTP enviado exitosamente");

    } catch (error) {
      console.error("❌ Error en comando TTP:", error.message);
      console.error("Stack:", error.stack);

      await conn.sendText(
        remoteJid,
        `⚠️ Error al crear el sticker: ${error.message}`,
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
