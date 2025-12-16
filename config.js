export default {
  // 👑 Dueños del bot (NÚMERO PRINCIPAL PRIMERO)
  owner: ["59896026646", "59896385127"],

  // 📛 Nombre del bot
  name: "Proyecto G",

  // 📱 Número del bot (para pairing code)
  number: "59896026646",

  // 👤 Datos extendidos de owners
  ownerData: [
    ["59896026646", "Dueño Principal", true],
    ["59896385127", "Co-Dueño", true]
  ],

  // 🔐 MAPEO DE LIDs (WhatsApp Logical IDs)
  // Si tu número usa LID en lugar de número real, mapéalo aquí
  lidMap: {
    "262573496758272": "59896026646", // Tu LID → Tu número
    // Agrega más si es necesario
  },

  // 🔒 Prefijo de comandos
  prefix: ".",

  // ⚙️ Configuración de base de datos
  db: {
    path: "./database.json"
  }
}
