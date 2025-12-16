import { performance } from 'perf_hooks'

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  command: ["doxxear"],
  admin: false,

  run: async ({ conn, m, remoteJid, senderJid, isGroup, text }) => {
    try {
      // ══════════════════════════════════════════════════════
      // ✅ VALIDAR QUE SEA GRUPO
      // ══════════════════════════════════════════════════════
      if (!isGroup) {
        return await conn.sendText(
          remoteJid,
          `❌ Este comando solo funciona en grupos.`,
          m
        )
      }

      // ══════════════════════════════════════════════════════
      // 🎯 DETECTAR USUARIO OBJETIVO
      // ══════════════════════════════════════════════════════
      let targetJid = null
      let userName = null
      
      // Verificar si hay mención directa
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
      }
      
      // Verificar si es respuesta a un mensaje
      if (!targetJid && m.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = m.message.extendedTextMessage.contextInfo.participant
      }

      // Si no hay mención, usar el sender
      if (!targetJid) {
        targetJid = senderJid
      }

      const targetNum = cleanNum(targetJid)

      // Obtener nombre del usuario
      userName = m.pushName || text || 'Usuario desconocido'

      // ══════════════════════════════════════════════════════
      // 📍 OBTENER METADATA PARA MENCIONES
      // ══════════════════════════════════════════════════════
      const metadata = await conn.groupMetadata(remoteJid)
      const groupParticipants = metadata.participants || []
      
      // Mapear JID real del usuario
      let realTargetJid = targetJid
      for (const p of groupParticipants) {
        if (cleanNum(p.id) === targetNum) {
          realTargetJid = p.id
          break
        }
      }

      // ══════════════════════════════════════════════════════
      // 🔄 ANIMACIÓN DE PROGRESO
      // ══════════════════════════════════════════════════════
      let start = `🧑‍💻 *Iniciando doxeo*...`
      let boost = `*${pickRandom(['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'])}%*`
      let boost2 = `*${pickRandom(['21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40'])}%*`
      let boost3 = `*${pickRandom(['41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60'])}%*`
      let boost4 = `*${pickRandom(['61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80'])}%*`
      let boost5 = `*${pickRandom(['81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100'])}%*`

      const { key } = await conn.sendMessage(remoteJid, { text: start }, { quoted: m })
      
      await delay(1000)
      await conn.sendMessage(remoteJid, { text: boost, edit: key })
      
      await delay(1000)
      await conn.sendMessage(remoteJid, { text: boost2, edit: key })
      
      await delay(1000)
      await conn.sendMessage(remoteJid, { text: boost3, edit: key })
      
      await delay(1000)
      await conn.sendMessage(remoteJid, { text: boost4, edit: key })
      
      await delay(1000)
      await conn.sendMessage(remoteJid, { text: boost5, edit: key })

      // ══════════════════════════════════════════════════════
      // 📋 GENERAR DOXEO FAKE
      // ══════════════════════════════════════════════════════
      let old = performance.now()
      let neww = performance.now()
      let speed = `${neww - old}`

      let doxeo = `👤 *Persona doxeada* 

📅 ${new Date().toLocaleDateString()}
⏰ ${new Date().toLocaleTimeString()}

📢 Resultados:

*Nombre:* ${userName}
*Usuario:* @${targetNum}
*Ip:* 92.28.211.234
*N:* 43 7462
*W:* 12.4893
*SS NUMBER:* 6979191519182016
*IPV6:* fe80::5dcd::ef69::fb22::d9888%12 
*UPNP:* Enabled
*DMZ:* 10.112.42.15
*MAC:* 5A:78:3E:7E:00
*ISP:* Ucom universal 
*DNS:* 8.8.8.8
*ALT DNS:* 1.1.1.1 
*DNS SUFFIX:* Dlink
*WAN:* 100.23.10.15
*WAN TYPE:* private nat
*GATEWAY:* 192.168.0.1
*SUBNET MASK:* 255.255.0.255
*UDP OPEN PORTS:* 8080, 80
*TCP OPEN PORTS:* 443
*ROUTER VENDEDOR:* ERICCSON
*DEVICE VENDEDOR:* WIN32-X
*CONNECTION TYPE:* TPLINK COMPANY
*ICMPHOPS:* 192.168.0.1, 192.168.1.1, 100.73.43.4
host-132.12.32.167.ucom.com
host-132.12.111.ucom.com
36.134.67.189, 216.239.78.11
Sof02s32inf14.1e100.net
*HTTP:* 192.168.3.1:433-->92.28.211.234:80
*Http:* 192.168.625-->92.28.211.455:80
*Http:* 192.168.817-->92.28.211.8:971
*Upd:* 192.168.452-->92.28.211:7265288
*Tcp:* 192.168.682-->92.28.211:62227.7
*Tcp:* 192.168.725-->92.28.211:67wu2
*Tcp:* 192.168.629-->92.28.211.167:8615
*EXTERNAL MAC:* 6U:77:89:ER:O4
*MODEM JUMPS:* 64`

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR RESULTADO
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        doxeo,
        m,
        { mentions: [realTargetJid] }
      )

      console.log(`🧑‍💻 Doxeo fake realizado a: ${targetNum}`)

    } catch (err) {
      console.error(`❌ Error en doxear.js:`, err.message)
      console.error(err.stack)

      try {
        await conn.sendMessage(remoteJid, {
          react: { text: '⚠️', key: m.key }
        })
      } catch (e) {
        console.log(`⚠️ No se pudo reaccionar: ${e.message}`)
      }
    }
  }
}
