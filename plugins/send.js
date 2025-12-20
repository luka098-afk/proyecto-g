/**

 * Plugin: Mención automática para grupo de respaldo

 * - Se ejecuta cada 20 minutos

 * - Menciona a todos los del grupo principal excepto:

 *   - Los que ya tienen solicitud pendiente en el grupo de respaldo

 *   - Un ID específico filtrado

 */

let lastRun = 0

export default {

  before: async ({ conn }) => {

    try {

      const now = Date.now()

      // Ejecutar solo si pasaron 20 minutos (1200000 ms)

      if (now - lastRun < 120 * 60 * 1000) return false

      lastRun = now

      // ══════════════════════════════════════════════════════

      // ⚙️ CONFIGURACIÓN

      // ══════════════════════════════════════════════════════

      

      const jidGrupo1 = "120363404278828828@g.us" // Grupo principal

      const jidGrupo2 = "120363402949632793@g.us" // Grupo de respaldo

      const extraFiltro = "262573496758272@lid"   // ID a excluir siempre

      // ══════════════════════════════════════════════════════

      // 📋 OBTENER DATOS

      // ══════════════════════════════════════════════════════

      // Obtener solicitudes pendientes del grupo 2

      const pendientesGrupo2 = await conn.groupRequestParticipantsList(jidGrupo2)

      const pendientesIDs = pendientesGrupo2.map(p => p.jid)

      // Obtener participantes del grupo 1

      const groupMetadata = await conn.groupMetadata(jidGrupo1)

      const participants = groupMetadata.participants || []

      const participantsIDs = participants.map(p => p.id)

      // ══════════════════════════════════════════════════════

      // 🔍 FILTRAR MENCIONES

      // ══════════════════════════════════════════════════════

      // Excluir:

      // - Usuarios con solicitud pendiente

      // - ID específico filtrado

      const mencionesIDs = participantsIDs.filter(id =>

        !pendientesIDs.includes(id) && id !== extraFiltro

      )

      // Si no hay nadie a quien mencionar, no enviar nada

      if (mencionesIDs.length === 0) {

        console.log("✅ No hay usuarios para mencionar")

        return false

      }

      // ══════════════════════════════════════════════════════

      // 📤 ENVIAR MENSAJE

      // ══════════════════════════════════════════════════════

      const textSend = `- Envíe solicitud al grupo de respaldo para no ser mencionado en este mensaje.\n\nhttps://chat.whatsapp.com/K6za3cuKQIdKZzPSff1hTJ`

      await conn.sendMessage(jidGrupo1, {

        text: textSend,

        mentions: mencionesIDs

      })

      console.log(`✅ Mensaje de respaldo enviado (${mencionesIDs.length} menciones)`)

      return false // Continuar con otros plugins

    } catch (error) {

      console.error("❌ Error en _mentionBackup:", error.message)

      return false

    }

  }

}
