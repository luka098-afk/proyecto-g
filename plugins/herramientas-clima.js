import axios from "axios";

export default {
  command: ["clima", "tiempo"],

  run: async ({ conn, m, remoteJid, args }) => {
    try {
      // Validar que haya una ciudad
      if (!args || args.length === 0) {
        return await conn.sendText(
          remoteJid,
          "⚠️ Debes especificar una ciudad.\n\nEjemplo: *.clima Madrid*",
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

      // Obtener la ciudad (unir args si son múltiples palabras)
      const ciudad = args.join(" ");

      console.log("🌍 Consultando clima para:", ciudad);

      // Hacer petición a la API
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&lang=es`
      );

      const data = response.data;

      // Extraer información
      const name = data.name;
      const Country = data.sys.country;
      const Weather = data.weather[0].description;
      const Temperature = data.main.temp + "°C";
      const Minimum_Temperature = data.main.temp_min + "°C";
      const Maximum_Temperature = data.main.temp_max + "°C";
      const Humidity = data.main.humidity + "%";
      const Wind = data.wind.speed + "km/h";

      // Formato del mensaje
      const mensaje = `「 📍 」𝙻𝚄𝙶𝙰𝚁: ${name}
「 🗺️ 」𝙿𝙰𝙸𝚂: ${Country}
「 🌤️ 」𝚃𝙸𝙴𝙼𝙿𝙾: ${Weather}
「 🌡️ 」𝚃𝙴𝙼𝙿𝙴𝚁𝙰𝚃𝚄𝚁𝙰: ${Temperature}
「 💠 」𝚃𝙴𝙼𝙿𝙴𝚁𝙰𝚃𝚄𝚁𝙰 𝙼𝙸𝙽𝙸𝙼𝙰: ${Minimum_Temperature}
「 📛 」𝚃𝙴𝙼𝙿𝙴𝚁𝙰𝚃𝚄𝚁𝙰 𝙼𝙰𝚇𝙸𝙼𝙰: ${Maximum_Temperature}
「 💦 」𝙷𝚄𝙼𝙴𝙳𝙰𝙳: ${Humidity}
「 🌬️ 」𝚅𝙸𝙴𝙽𝚃𝙾: ${Wind}`;

      console.log("✅ Clima obtenido exitosamente");

      // Enviar mensaje
      await conn.sendText(remoteJid, mensaje, m);

      // Reaccionar con check
      await conn.sendMessage(remoteJid, {
        react: {
          text: "✅",
          key: m.key
        }
      });

    } catch (error) {
      console.error("❌ Error en comando clima:", error.message);

      let mensajeError = "⚠️ No se pudo obtener el clima.";

      if (error.response?.status === 404) {
        mensajeError = "⚠️ Ciudad no encontrada. Verifica el nombre e intenta nuevamente.";
      } else if (error.response?.status === 401) {
        mensajeError = "⚠️ Error con la API key del clima.";
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
