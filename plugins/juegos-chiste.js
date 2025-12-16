function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default {
  command: ["chiste"],
  admin: false,

  run: async ({ conn, m, remoteJid, isGroup }) => {
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
      // 💀 ARRAY DE CHISTES DE HUMOR NEGRO
      // ══════════════════════════════════════════════════════
      const chistes = [
        "¿Cuál es la diferencia entre una pizza y un bebé? Que la pizza no grita en el horno.",
        "Doctor, ¿cuánto me queda de vida? 10... ¿10 qué? 9... 8... 7...",
        "¿Qué hace un paracaidista ciego? Un agujero muy grande.",
        "Mi novia me dijo que soy inmaduro. Le dije que se saliera de mi fuerte.",
        "¿Cuál es la parte más difícil de comer vegetales? La silla de ruedas.",
        "Me gusta mi café como me gustan mis ex: amargo y que me arruine el día.",
        "¿Qué le dice un jardinero a otro? Disfrutemos mientras podamos.",
        "Fui a donar sangre, nunca vuelvo. Hicieron demasiadas preguntas como '¿De quién es esta sangre?'",
        "Mi terapeuta dice que tengo un preocupante problema de abandono. Así que dejé de ir.",
        "¿Por qué los buzos se tiran de espaldas? Porque si se tiran de frente, caen al bote.",
        "Ayer salí con una chica en silla de ruedas. Pensé que íbamos bien hasta que me di cuenta que estaba de pie en su cara.",
        "¿Qué tiene 4 patas y un brazo? Un pitbull feliz.",
        "Doctor: Tiene 2 semanas de vida. Paciente: ¿No puede darme un mes? Doctor: Ok, también tiene febrero.",
        "Mi ex me mandó un mensaje: 'Te extraño'. Le respondí: 'Suerte con eso'.",
        "¿Cómo llamas a una persona sin brazos ni piernas en el agua? Bob. ¿Y en la puerta? Mat.",
        "¿Qué es rojo y malo para los dientes? Un ladrillo.",
        "Compré un libro de suicidio. Solo tenía un capítulo.",
        "¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro.",
        "Mi novia se enojó porque le dije que tenía el cuerpo de una modelo. Al parecer 'calacas de Halloween' no cuenta.",
        "¿Sabes qué es peor que encontrar un gusano en tu manzana? El holocausto.",
        "Fui al médico y me dijo: 'No coma nada grasoso'. Le pregunté: '¿Cómo qué?' Me dijo: 'Hamburguesas, pizza...' Le dije: 'Ah, pensé que no podía comerme a tu mamá'.",
        "¿Cuántos bebés necesitas para pintar una pared? Depende de qué tan fuerte los lances.",
        "Mi abuelo murió en un campo de concentración. Se cayó de la torre de vigilancia.",
        "¿Por qué los niños en África no juegan videojuegos? Porque no tienen luz.",
        "Ayer vi a un enano escapando de la cárcel bajando por una cuerda. Pensé: 'Ese es un pequeño medio fugitivo'.",
        "¿Qué tiene un orfanato y no tiene una familia normal? Niños disponibles.",
        "Mi psicólogo me dijo que escriba cartas a las personas que odio y luego las queme. Lo hice. Pero ahora no sé qué hacer con las cartas.",
        "¿Cuál es la mejor parte de tener sexo con veinticinco personas? No tener que saludar a todas.",
        "Fui al funeral de un amigo y su viuda me preguntó si podía decir unas palabras. Le dije: 'Plétora'. Me dijo: 'Gracias, eso significa mucho'.",
        "¿Por qué los esqueletos no pelean entre sí? Porque no tienen agallas.",
        "Mi ex me dijo: 'Espero que encuentres a alguien que te haga feliz'. Le respondí: 'Ya lo hice, por eso terminé contigo'.",
        "¿Sabes lo que tiene 100 bolas y maltrata mujeres? El cáncer de próstata.",
        "Ayer atropellé a un ciego. Me dijo: '¡No te vi venir!' Le dije: 'Yo tampoco'.",
        "¿Por qué romper con alguien es como lanzar un disco duro viejo? Porque tienes que formatear todo y empezar de cero.",
        "Mi papá murió cuando no pudimos recordar su tipo de sangre. Mientras moría, seguía insistiendo: 'Sean positivos', pero es difícil sin él.",
        "¿Qué pesa más: 100kg de ladrillos o 100kg de plumas? Las plumas, porque también tienes que cargar con lo que le hiciste a esas pobres aves.",
        "Compré zapatos de un traficante. No sé qué me puso, pero he estado volando todo el día.",
        "Mi esposa me dejó porque dijo que soy demasiado inseguro. Oh no, espera. Volvió. Solo fue a la cocina.",
        "¿Cuántos policías se necesitan para cambiar un foco? Ninguno. Lo golpean por estar oscuro.",
        "Ayer salí con una chica que resultó ser un fantasma. Le pregunté: '¿Por qué no me dijiste?' Me respondió: 'Pensé que era obvio'.",
        "Mi hermana me preguntó si podía prestarle maquillaje. Le dije: 'No lo necesitas, ya tienes dos caras'.",
        "Fui a una fiesta de disfraces vestido de Hitler. Todos dijeron que era de mal gusto. Les dije: 'Cálmense, es solo un disfraz'. Me expulsaron del bar mitzvá.",
        "¿Por qué los mineros siempre están deprimidos? Porque tocan fondo todos los días.",
        "Mi doctor me dijo que tengo un año de vida. Le disparé. Me dieron cadena perpetua. Problema resuelto.",
        "¿Cuál es la diferencia entre un sacerdote y el acné? El acné espera hasta los 13 para aparecer en tu cara.",
        "Ayer fui al zoológico y solo había un perro. Era un Shih Tzu.",
        "¿Qué es peor que una abeja en tu oído? Dos abejas. ¿Qué es peor que dos abejas? El SIDA.",
        "Mi abuela me dijo: 'Antes todo era mejor'. Le dije: 'Sí abuela, como tu rodilla'.",
        "¿Por qué no puedes jugar cartas en la selva? Demasiados guepardos.",
        "Ayer fui a un bar de amputados. No tenía atmósfera.",
        "Mi hijo me preguntó: 'Papá, ¿soy adoptado?' Le respondí: 'No lo sé aún, todavía no nos han llamado'.",
        "¿Cuántos hombres necesitas para cambiar un foco? Ninguno. Deja que ella cocine en la oscuridad.",
        "Fui al cementerio y todos estaban dentro de las rejas. Aparentemente hay una epidemia de zombies.",
        "Mi esposa me dijo: 'Si algo me pasa, quiero que seas feliz'. Eso fue hace 10 años. ¿Cuánto más tengo que esperar?",
        "¿Qué tiene 9 brazos y apesta? Un basurero en un hospital.",
        "Ayer fui a un restaurante que se llama 'Karma'. No había menú, solo te traían lo que te mereces.",
        "¿Por qué las feministas no pueden hacer un sándwich? Porque necesitan a un hombre que las ayude.",
        "Mi hijo me preguntó de dónde vienen los bebés. Le dije: 'De malas decisiones'.",
        "¿Cuál es el colmo de un electrocutado? Que le dé corriente su novia.",
        "Ayer vi a un tipo en silla de ruedas siendo golpeado. Grité: '¡Defiéndete!' Aparentemente es paralítico.",
        "¿Qué tiene 4 ruedas y vuela? Un camión de basura. ¿Y 4 ruedas y NO vuela? Un tetrapléjico.",
        "Mi novia me dijo que actuaba como mi padre. Le dije: 'Imposible, él nunca volvió'.",
        "¿Por qué las mujeres tienen períodos? Porque se lo merecen.",
        "Ayer fui a la iglesia y el cura me preguntó si aceptaba a Jesús. Le dije: 'Si él me acepta primero'.",
        "¿Cuál es la diferencia entre un niño y una bolsa de cocaína? Eric Clapton nunca dejaría caer una bolsa de cocaína por la ventana.",
        "Mi terapeuta me dijo que tengo problemas de ira. Le dije: 'Y tú tienes problemas de cara pero no ando diciendo'.",
        "¿Qué le dijo el dedo al pulgar? Estoy contando contigo.",
        "Ayer me comí un reloj. Fue muy tardado.",
        "Mi esposa me preguntó por qué hablo solo. Le dije: 'Porque necesito consejo de un experto'.",
        "¿Cuál es la diferencia entre un judío y una pizza? La pizza no grita en el horno.",
        "Fui al médico con una zanahoria en el oído y un apio en la nariz. Me dijo: 'No estás comiendo bien'.",
        "¿Por qué los niños en sillas de ruedas no pueden jugar al escondite? Porque siempre están en el mismo lugar.",
        "Mi abuelo murió pacíficamente mientras dormía. Los pasajeros del bus no tanto.",
        "¿Cuántos policías se necesitan para cambiar un foco? Ninguno. Solo golpean la habitación por resistirse.",
        "Ayer fui a un show de magia. El mago hizo desaparecer mi billetera. Aún no vuelve.",
        "Mi ex me dijo: 'No eres tú, soy yo'. Le dije: 'Sí, tienes razón. Eres tú'.",
        "¿Qué es peor que morderse la lengua? Pisar un LEGO. ¿Qué es peor que pisar un LEGO? El genocidio.",
        "Fui a una tienda de mascotas y pregunté: '¿Tienen algo tranquilo?' Me vendieron un pez muerto.",
        "Mi hijo me preguntó: 'Papá, ¿las plantas sienten?' Le dije: 'No lo sé, pregúntale a tu madre'.",
        "¿Por qué los vampiros siempre están solos? Porque chupan.",
        "Ayer fui al dentista. Me dijo: 'Esto no va a doler'. Mentira. Me cobró 500 dólares.",
        "¿Cuál es la mejor parte de ser huérfano? Todos los videojuegos son de un jugador.",
        "Mi esposa me dijo: 'Estoy embarazada'. Le dije: 'Hola Embarazada, soy Papá'.",
        "¿Qué hace un niño con cáncer en el parque? Quimio-terapia recreativa.",
        "Ayer compré un perro sin patas. Lo llamé Cigarrillo. Todas las mañanas lo saco a arrastrarse.",
        "¿Por qué Hitler nunca tomó alcohol? Porque lo hacía enojar.",
        "Mi doctor me dijo que dejara de masturbarme. Le pregunté: '¿Por qué?' Me dijo: 'Porque estoy tratando de examinarlo'.",
        "¿Cuál es la diferencia entre un camión de bebés y un camión de bolos? No puedes descargar los bolos con una horca.",
        "Ayer fui a un bar de ciegos. Nadie me vio entrar.",
        "Mi hijo me preguntó: 'Papá, ¿qué es el suicidio?' Le dije: 'Búscalo en Google'. No volvió.",
        "¿Por qué los mexicanos cruzan la frontera de dos en dos? Porque el letrero dice 'No Tres-passing'.",
        "Fui al hospital porque tragué monedas. Todavía no hay cambios.",
        "Mi esposa me dijo que soy muy egocéntrico. Arruiné mi cumpleaños con eso.",
        "¿Qué le dijo el cero al ocho? Bonito cinturón.",
        "Ayer vi a un tipo sin brazos ahogándose. Le dije: 'No te preocupes, te echo una mano'. Se hundió.",
        "¿Por qué los esqueletos no van a fiestas? No tienen cuerpo con quien ir.",
        "Mi terapeuta dice que tengo miedo al compromiso. Ya llevamos 3 años juntos.",
        "¿Cuál es el colmo de un electricista? Que su mujer se llame Luz y sus hijos le sigan la corriente.",
        "Ayer fui a un restaurante que sirve 'comida del mar'. Pedí pescado. Me trajeron un pez muerto en un plato."
      ]

      // ══════════════════════════════════════════════════════
      // 🎲 ELEGIR CHISTE AL AZAR
      // ══════════════════════════════════════════════════════
      const chiste = pickRandom(chistes)

      // ══════════════════════════════════════════════════════
      // 📤 ENVIAR CHISTE
      // ══════════════════════════════════════════════════════
      await conn.sendText(
        remoteJid,
        `💀 *CHISTE DE HUMOR NEGRO* 💀\n\n${chiste}\n\n_⚠️ Es solo humor, no lo tomes en serio_`,
        m
      )

      console.log(`💀 Chiste enviado`)

    } catch (err) {
      console.error(`❌ Error en chiste.js:`, err.message)
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
