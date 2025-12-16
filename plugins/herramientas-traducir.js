import fetch from "node-fetch";

export default {
  command: ["traducir", "translate", "trad"],

  run: async ({ conn, m, remoteJid, text }) => {
    try {
      // Obtener texto del mensaje o del citado
      let textoParaTraducir = "";
      
      // Intentar obtener mensaje citado de diferentes formas
      let quotedText = null;
      
      // Forma 1: m.quoted.text (si existe)
      if (m.quoted && m.quoted.text) {
        quotedText = m.quoted.text;
      }
      // Forma 2: extendedTextMessage.contextInfo.quotedMessage
      else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
        if (quotedMsg.conversation) {
          quotedText = quotedMsg.conversation;
        } else if (quotedMsg.extendedTextMessage?.text) {
          quotedText = quotedMsg.extendedTextMessage.text;
        } else if (quotedMsg.imageMessage?.caption) {
          quotedText = quotedMsg.imageMessage.caption;
        } else if (quotedMsg.videoMessage?.caption) {
          quotedText = quotedMsg.videoMessage.caption;
        }
      }
      
      // Si hay mensaje citado, SIEMPRE usar ese (ignorar text)
      if (quotedText) {
        textoParaTraducir = quotedText;
        console.log("📝 Usando texto citado:", textoParaTraducir);
      } 
      // Si no hay citado, usar text pero limpiando el comando
      else if (text) {
        // Limpiar CUALQUIER cosa que parezca un comando al inicio
        textoParaTraducir = text
          .replace(/^\.(traducir|translate|trad)\s*/i, '')
          .replace(/^(traducir|translate|trad)\s*/i, '')
          .trim();
        console.log("📝 Usando texto del comando:", textoParaTraducir);
      }
      
      // Actualizar la variable text
      text = textoParaTraducir;

      // Validar que haya texto
      if (!text) {
        return await conn.sendText(
          remoteJid,
          "⚠️ Debes proporcionar un texto para traducir.\n\nEjemplo: *.traducir Hello world*\nO cita un mensaje y responde con *.traducir*",
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

      console.log("🌐 Traduciendo texto:", text);

      // Usar API de Lingva Translate (gratuita, sin API key, sin rate limit)
      const url = `https://lingva.ml/api/v1/auto/es/${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      console.log("📦 Respuesta:", JSON.stringify(data));

      if (!data.translation) {
        throw new Error("No se pudo obtener la traducción");
      }

      const textoTraducido = data.translation;

      console.log("✅ Traducción completada");

      // Enviar solo el texto traducido
      await conn.sendText(remoteJid, textoTraducido, m);

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: "✅",
          key: m.key
        }
      });

    } catch (error) {
      console.error("❌ Error en comando traducir:", error.message);
      await conn.sendText(
        remoteJid,
        "⚠️ No se pudo traducir el texto. Intenta de nuevo.",
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
