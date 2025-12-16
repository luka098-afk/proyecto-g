import fetch from "node-fetch";

export default {
  command: ["ss", "screenshot"],

  run: async ({ conn, m, remoteJid, args }) => {
    try {
      // Validar que haya una URL
      if (!args || args.length === 0) {
        return await conn.sendText(
          remoteJid,
          "⚠️ Debes proporcionar una URL.\n\nEjemplo: *.ss https://www.google.com*",
          m
        );
      }

      // Reaccionar con emoji de carga
      await conn.sendMessage(remoteJid, {
        react: {
          text: "⏳",
          key: m.key
        }
      });

      // Obtener la URL
      let url = args[0];

      // Agregar https:// si no tiene protocolo
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      console.log("📸 Capturando screenshot de:", url);

      // Obtener screenshot
      const response = await fetch(`https://image.thum.io/get/fullpage/${url}`);

      if (!response.ok) {
        throw new Error(`Error al capturar: ${response.status}`);
      }

      const screenshotBuffer = await response.buffer();

      console.log("✅ Screenshot capturado, enviando...");

      // Enviar imagen
      await conn.sendMessage(remoteJid, {
        image: screenshotBuffer,
        caption: `📸 Screenshot de: ${url}`
      }, { quoted: m });

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: "✅",
          key: m.key
        }
      });

      console.log("✅ Screenshot enviado exitosamente");

    } catch (error) {
      console.error("❌ Error en comando screenshot:", error.message);

      let mensajeError = "⚠️ No se pudo capturar el screenshot.";

      if (error.message.includes("Invalid URL")) {
        mensajeError = "⚠️ URL inválida. Verifica que sea correcta.";
      } else if (error.message.includes("404") || error.message.includes("400")) {
        mensajeError = "⚠️ No se pudo acceder a la página web.";
      }

      await conn.sendText(remoteJid, mensajeError, m);

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
