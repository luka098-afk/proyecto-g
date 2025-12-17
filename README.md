# 🤖 Proyecto G - Bot de WhatsApp

Bot de WhatsApp multiusuario con sistema de blacklist, anti-llamadas, y múltiples funcionalidades desarrollado con Baileys.

## ✨ Características

- 🚫 **Sistema de Blacklist** - Expulsa automáticamente usuarios en lista negra
- 📞 **Anti-Llamadas** - Bloquea automáticamente llamadas no deseadas
- 🎨 **Generador de Stickers** - Convierte imágenes/videos a stickers
- 🔐 **Pairing Code** - Conexión sin QR usando código de emparejamiento
- 👥 **Sistema de Grupos** - Gestión avanzada de grupos
- 🔌 **Plugins** - Sistema modular de comandos
- 🔄 **Auto-Reconexión** - Reconexión automática en caso de desconexión

## 📋 Requisitos

- Node.js v18 o superior
- FFmpeg (para stickers y medios)
- Git
- 2GB RAM mínimo

## 🚀 Instalación

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/proyecto-g-bot.git
cd proyecto-g-bot
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar el bot

Edita `config.js` con tus datos:

```javascript
export default {
  owner: ["59812345678"], // Tu número con código de país
  prefix: ".",             // Prefijo de comandos
  // ... más configuraciones
}
```

### 4️⃣ Iniciar el bot

```bash
npm start
```

### 5️⃣ Vincular con WhatsApp

El bot generará un **Pairing Code** de 8 dígitos. En tu WhatsApp:

1. Ve a **Dispositivos vinculados**
2. Toca **Vincular un dispositivo**
3. Ingresa el código de 8 dígitos

## 📱 Comandos Principales

### 👑 Owner

| Comando | Descripción |
|---------|-------------|
| `.ln +598...` | Agregar usuario a blacklist con número |
| `.ln @usuario` | Agregar usuario a blacklist con mención |
| `.ln2 +598...` | Remover usuario de blacklist |
| `.vln` | Ver lista negra completa |
| `.anticall on/off` | Activar/desactivar anti-llamadas |

### 🎨 General

| Comando | Descripción |
|---------|-------------|
| `.s` | Crear sticker (responder a imagen/video) |
| `.menu` | Ver menú de comandos |
| `.info` | Información del bot |

## 🗂️ Estructura del Proyecto

```
proyecto-g-bot/
├── plugins/          # Comandos del bot
│   ├── sticker.js
│   ├── blacklist.js
│   └── ...
├── lib/              # Librerías auxiliares
│   ├── waSocket.js
│   └── sticker.js
├── auth/             # Sesión de WhatsApp (ignorado por git)
├── tmp/              # Archivos temporales
├── db.js             # Sistema de base de datos
├── handler.js        # Manejador de comandos
├── index.js          # Archivo principal
├── config.js         # Configuración
└── package.json
```

## 🔧 Configuración Avanzada

### Blacklist Automática

El bot expulsa automáticamente usuarios en blacklist al intentar unirse a grupos donde el bot es admin.

### Anti-Llamadas

Cuando está activado, el bot bloquea automáticamente cualquier llamada entrante.

### Stickers con ViewOnce

El bot **NO** permite crear stickers de fotos/videos de "ver una vez" (ViewOnce) por privacidad.

## 🐛 Solución de Problemas

### El bot no se conecta

1. Verifica que el número en `config.js` sea correcto (con código de país)
2. Elimina la carpeta `auth/` y vuelve a vincular
3. Revisa que tu conexión a internet sea estable

### Error al crear stickers

1. Verifica que FFmpeg esté instalado: `ffmpeg -version`
2. En Termux: `pkg install ffmpeg`
3. En Linux: `sudo apt install ffmpeg`

### El bot expulsa usuarios incorrectamente

1. Verifica la blacklist: `.vln`
2. Revisa los logs en la consola
3. Asegúrate de que el bot sea admin en el grupo

## 📝 Desarrollo

### Crear un nuevo plugin

Crea un archivo en `plugins/`:

```javascript
// plugins/micomando.js
export async function run({ conn, m, args, remoteJid }) {
  await conn.sendText(remoteJid, "¡Hola mundo!", m);
}

export const command = ["micomando", "mc"];
export const owner = false; // true = solo owners
```

### Actualizar el bot

```bash
git pull
npm install
npm start
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "✨ Agregar nueva funcionalidad"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## ⚠️ Disclaimer

Este bot es solo para uso educativo. El uso indebido de este software es responsabilidad del usuario. No nos hacemos responsables por baneos, restricciones o cualquier consecuencia derivada del uso de este bot.

## 🙏 Créditos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [FFmpeg](https://ffmpeg.org/) - Procesamiento de medios

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

📫 Reporta bugs en [Issues](https://github.com/luka098-afk/proyecto-g-bot/issues)
