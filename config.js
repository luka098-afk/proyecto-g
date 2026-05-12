export default {
  // 👑 Dueños del bot (NÚMERO PRINCIPAL PRIMERO)
  owner: ["598", "598"],

  // 📛 Nombre del bot
  name: "Proyecto G",

  // 📱 Número del bot (para pairing code)
  number: "598",

  // 👤 Datos extendidos de owners
  ownerData: [
    ["598", "Dueño Principal", true],
    ["598", "Co-Dueño", true]
  ],

  // 🔐 MAPEO DE LIDs (WhatsApp Logical IDs)
  // Si tu número usa LID en lugar de número real, mapéalo aquí
  lidMap: {
    "262": "598", // Tu LID → Tu número
    // Agrega más si es necesario
  },

  // 🔒 Prefijo de comandos
  prefix: ".",

  // ⚙️ Configuración de base de datos
  db: {
    path: "./database.json"
  }
}
