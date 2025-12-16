// Base de datos de preguntas
const preguntas = [
  {
    pregunta: "¿Cuál es la capital de Japón?",
    opciones: ["A) Osaka", "B) Kioto", "C) Tokio", "D) Hiroshima"],
    respuesta: "c",
  },
  {
    pregunta: "¿Qué animal puede vivir sin agua durante más tiempo?",
    opciones: ["A) Camello", "B) Rata canguro", "C) Tortuga del desierto", "D) Koala"],
    respuesta: "b",
  },
  {
    pregunta: "¿Cuál de las siguientes opciones es un sistema operativo?",
    opciones: ["A) Word", "B) Windows", "C) Chrome", "D) Photoshop"],
    respuesta: "b",
  },
  {
    pregunta: "¿Cuál es la capital de Suiza?",
    opciones: ["A) Zúrich", "B) Ginebra", "C) Basilea", "D) Berna"],
    respuesta: "d",
  },
  {
    pregunta: "¿Qué animal tiene la mordida más fuerte del mundo?",
    opciones: ["A) Tiburón blanco", "B) León", "C) Cocodrilo de agua salada", "D) Hipopótamo"],
    respuesta: "c",
  },
  {
    pregunta: "¿Cuál de las siguientes opciones es un navegador web?",
    opciones: ["A) Excel", "B) Outlook", "C) Firefox", "D) PowerPoint"],
    respuesta: "c",
  },
  {
    pregunta: "¿Cuál es la capital de Egipto?",
    opciones: ["A) El Cairo", "B) Alejandría", "C) Luxor", "D) Asuán"],
    respuesta: "a",
  },
  {
    pregunta: "¿Cuál es el animal terrestre más rápido del mundo?",
    opciones: ["A) León", "B) Guepardo", "C) Tigre", "D) Antílope"],
    respuesta: "b",
  },
  {
    pregunta: "¿En qué año se fundó Google?",
    opciones: ["A) 1996", "B) 1998", "C) 2000", "D) 2002"],
    respuesta: "b",
  },
  {
    pregunta: "¿Cuál es la capital de Brasil?",
    opciones: ["A) Río de Janeiro", "B) São Paulo", "C) Brasilia", "D) Salvador"],
    respuesta: "c",
  },
  {
    pregunta: "¿Cuántos corazones tiene un pulpo?",
    opciones: ["A) 1", "B) 2", "C) 3", "D) 4"],
    respuesta: "c",
  },
  {
    pregunta: "¿Qué empresa desarrolló el sistema operativo Windows?",
    opciones: ["A) Apple", "B) IBM", "C) Microsoft", "D) Google"],
    respuesta: "c",
  },
  {
    pregunta: "¿Cuál es la capital de Francia?",
    opciones: ["A) Londres", "B) Berlín", "C) Madrid", "D) París"],
    respuesta: "d",
  },
  {
    pregunta: "¿Cuál es el único mamífero que puede volar?",
    opciones: ["A) Ardilla voladora", "B) Murciélago", "C) Lémur volador", "D) Colibrí"],
    respuesta: "b",
  },
  {
    pregunta: "¿Qué animal es conocido como el 'rey de la selva'?",
    opciones: ["A) Tigre", "B) León", "C) Leopardo", "D) Jaguar"],
    respuesta: "b",
  }
];

let trivias = {};

export default {
  command: ["trivia"],
  
  run: async ({ conn, m, remoteJid, isGroup }) => {
    try {
      // Solo en grupos
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m);
      }

      // Verificar si hay un juego activo
      if (trivias[remoteJid]) {
        return await conn.sendText(
          remoteJid, 
          "⚠️ Ya hay una trivia activa en este grupo. Espera a que termine.", 
          m
        );
      }

      // Seleccionar pregunta aleatoria
      const trivia = preguntas[Math.floor(Math.random() * preguntas.length)];
      
      // Enviar pregunta
      const triviaMsg = await conn.sendText(
        remoteJid,
        `*🎓 TRIVIA TIME!*\n\n` +
        `*Pregunta:*\n${trivia.pregunta}\n\n` +
        `${trivia.opciones.join("\n")}\n\n` +
        `*❗ RESPONDE A ESTE MENSAJE* con la letra correcta (A, B, C o D).\n` +
        `*⏱️ Tienes 30 segundos!*`,
        m
      );

      // Guardar trivia activa
      trivias[remoteJid] = {
        respuesta: trivia.respuesta.toLowerCase(),
        mensajeId: triviaMsg.key.id,
        timeout: setTimeout(() => {
          if (trivias[remoteJid]) {
            conn.sendText(
              remoteJid,
              `*⏳ ¡TIEMPO AGOTADO!*\n\n` +
              `La respuesta correcta era: *${trivia.respuesta.toUpperCase()}*\n\n` +
              `¡Mejor suerte la próxima vez! 🎯`,
              m
            );
            delete trivias[remoteJid];
          }
        }, 30000), // 30 segundos
      };

    } catch (err) {
      console.error(`❌ Error en trivia.js: ${err.message}`);
      await conn.sendText(
        remoteJid,
        `⚠️ Error al iniciar la trivia: ${err.message}`,
        m
      );
    }
  },

  before: async (ctx) => {
    const { conn, m, remoteJid } = ctx;

    // Verificar si hay trivia activa en este grupo
    if (!trivias[remoteJid]) return false;

    const juego = trivias[remoteJid];

    // Verificar si el mensaje es una respuesta al mensaje de trivia
    if (!m.message?.extendedTextMessage?.contextInfo?.stanzaId) return false;
    if (m.message.extendedTextMessage.contextInfo.stanzaId !== juego.mensajeId) return false;

    // Obtener respuesta del usuario
    const respuestaUsuario = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      ""
    ).toLowerCase().trim();

    // Verificar si la respuesta es correcta
    if (respuestaUsuario === juego.respuesta) {
      // Respuesta correcta
      await conn.sendText(
        remoteJid,
        `*✅ ¡CORRECTO!*\n\n` +
        `@${m.key.participant.split('@')[0]} ha respondido correctamente! 🎉\n\n` +
        `La respuesta era: *${juego.respuesta.toUpperCase()}*`,
        m,
        { mentions: [m.key.participant] }
      );

      // Reaccionar con check
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: "✅", key: m.key }
        });
      } catch (err) {
        console.log("No se pudo reaccionar");
      }

      // Limpiar timeout y eliminar trivia
      clearTimeout(trivias[remoteJid].timeout);
      delete trivias[remoteJid];
    } else if (/^[a-d]$/i.test(respuestaUsuario)) {
      // Respuesta incorrecta pero válida (A, B, C o D)
      try {
        await conn.sendMessage(remoteJid, {
          react: { text: "❌", key: m.key }
        });
      } catch (err) {
        console.log("No se pudo reaccionar");
      }
    }

    // No detener procesamiento de otros comandos
    return false;
  }
};
 

