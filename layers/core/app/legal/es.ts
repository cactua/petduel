import type { LegalTexts } from './types'

export default {
  updated: 'Última actualización: {date}',
  missing: 'por completar',
  seeAlso: 'Ver también',
  docs: {
    privacy: {
      title: 'Política de privacidad',
      intro: 'Aquí explicamos qué datos recoge {site}, para qué los usa, quién puede verlos y cómo puedes controlarlos. Intentamos recoger solo lo que de verdad hace falta.',
      sections: [
        {
          h: 'Responsable',
          p: ['El responsable del tratamiento es {owner}. Para cualquier pregunta sobre privacidad o para ejercer tus derechos escribe a {email}.'],
        },
        {
          h: 'Qué datos recogemos',
          list: [
            'Cuenta: email, nombre de usuario y contraseña. La contraseña se guarda solo cifrada: nadie puede leerla, ni siquiera nosotros.',
            'Mascotas y fotos: nombre, especie, raza, ciudad y las fotos que subes.',
            'Votos: qué fotos elegiste en los duelos. Con cuenta, el voto está ligado a tu perfil; sin cuenta, a un código anónimo guardado en una cookie técnica.',
            'Refugios: nombre, ciudad, descripción, web, identificación fiscal, email y teléfono de contacto. La identificación fiscal, el email y el teléfono solo los ven los moderadores y el propio refugio.',
            'Solicitudes de adopción: el mensaje y el teléfono (opcional) que envías a un refugio.',
            'Avisos: las notificaciones que te mostramos en la campana.',
            'Datos técnicos: idioma del navegador y ubicación aproximada (país y ciudad) obtenida de la dirección IP. Usamos la IP solo un instante para limitar votos automáticos y abusos, y no la guardamos.',
            'Anuncios: cuando ves o pulsas un anuncio guardamos el evento con un código anónimo, el país, la ciudad y el idioma, para contar visualizaciones y clics.',
          ],
        },
        {
          h: 'Para qué los usamos',
          list: [
            'Para que uses el servicio: cuenta, mascotas, duelos, clasificaciones, retos y adopciones (ejecución del contrato).',
            'Por seguridad: bloquear bots, votos falsos y contenido prohibido, y moderar las fotos (interés legítimo).',
            'Para mostrar anuncios de nuestros anunciantes elegidos por zona, idioma y hora, sin perfilarte (interés legítimo).',
            'Para mostrar anuncios de Google que usan cookies, solo si aceptas en el banner (consentimiento).',
            'Para verificar los refugios antes de hacerlos públicos (interés legítimo y protección de los animales).',
          ],
        },
        {
          h: 'Qué ven los demás',
          p: [
            'Son públicos tu nombre de usuario, tus mascotas con nombre, raza y ciudad, las fotos aprobadas y, si gestionas un refugio verificado, su página pública.',
            'No son públicos tu email, los votos que das ni los corazones que reciben tus mascotas fuera del top 5: eso solo lo ves tú.',
          ],
        },
        {
          h: 'Con quién los compartimos',
          list: [
            'El proveedor que aloja el sitio y la base de datos, que trata los datos solo por cuenta nuestra.',
            'El refugio al que envías una solicitud de adopción: recibe el mensaje, tu nombre de usuario, tu email para responderte y el teléfono si lo indicas.',
            'Google, solo si aceptas los anuncios de Google: en ese caso Google usa sus propias cookies, como explica su política (policies.google.com/privacy).',
          ],
          p: ['No vendemos tus datos a nadie.'],
        },
        {
          h: 'Datos fuera de la Unión Europea',
          p: ['Si aceptas los anuncios de Google, algunos datos pueden transferirse a Estados Unidos. Google se adhiere al Marco de Privacidad de Datos UE-EE. UU. y usa las cláusulas contractuales tipo aprobadas por la Comisión Europea.'],
        },
        {
          h: 'Durante cuánto tiempo',
          p: [
            'Guardamos los datos de la cuenta mientras la cuenta exista. Cuando la eliminas borramos enseguida perfil, mascotas, fotos (también los archivos), refugio, solicitudes de adopción y avisos.',
            'Los votos que diste se quedan, pero sin ningún vínculo contigo: así no se alteran las clasificaciones de los demás. Lo mismo vale para los recuentos de anuncios.',
          ],
        },
        {
          h: 'Tus derechos',
          list: [
            'Ver y descargar tus datos: en la página «Tu cuenta» descargas un archivo con todo lo que te concierne.',
            'Corregirlos: nombre, raza y ciudad de las mascotas se editan desde el perfil; para lo demás, escríbenos.',
            'Borrarlos: elimina tu cuenta cuando quieras desde la página «Tu cuenta».',
            'Oponerte al tratamiento o limitarlo, y retirar el consentimiento a los anuncios de Google desde el menú, en «Cookies y anuncios».',
            'Reclamar ante una autoridad de protección de datos, como la de tu país (en España, la AEPD).',
          ],
        },
        {
          h: 'Edad mínima',
          p: ['Para crear una cuenta debes tener al menos 14 años. Si eres menor, pide a tu madre, padre o tutor que la cree por ti.'],
        },
        {
          h: 'Cambios',
          p: ['Si cambiamos esta política actualizamos la fecha de arriba. Si los cambios son importantes te avisaremos en el sitio.'],
        },
      ],
    },
    cookie: {
      title: 'Política de cookies',
      intro: 'Las cookies son pequeños archivos que el sitio guarda en tu navegador. {site} usa pocas, y casi todas sirven solo para que funcione.',
      sections: [
        {
          h: 'Cookies técnicas',
          p: ['Son necesarias para el funcionamiento del sitio y no requieren tu consentimiento. No las usamos para seguirte en otros sitios.'],
          table: {
            head: ['Nombre', 'Para qué sirve', 'Duración'],
            rows: [
              ['nuxt-session', 'Mantener tu sesión y recordar el código anónimo de votos si no tienes cuenta (cifrada)', '30 días'],
              ['lingua', 'Recordar el idioma que elegiste', '1 año'],
              ['tema', 'Recordar el tema claro u oscuro', '1 año'],
              ['consenso', 'Recordar tu elección sobre los anuncios de Google', '6 meses'],
            ],
          },
        },
        {
          h: 'Cookies de los anuncios de Google',
          p: [
            'Solo si aceptas en el banner cargamos los anuncios de Google AdSense. Google usa sus propias cookies para mostrar, medir y personalizar anuncios según tu actividad.',
            'Si rechazas, el script de Google no se carga en absoluto: solo ves anuncios de nuestros anunciantes, que no usan cookies.',
            'Cómo usa Google los datos: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Cómo cambiar de opinión',
          p: [
            'Puedes cambiar tu elección cuando quieras desde el menú de arriba a la derecha, en «Cookies y anuncios».',
            'También puedes borrar las cookies desde los ajustes del navegador. Si borras las cookies técnicas tendrás que volver a iniciar sesión.',
          ],
        },
        {
          h: 'Contacto',
          p: ['Para preguntas sobre cookies escribe a {email}.'],
        },
      ],
    },
    terms: {
      title: 'Condiciones de uso',
      intro: 'Al usar {site} aceptas estas reglas. Están pensadas para que el sitio sea agradable, justo y seguro para personas y animales.',
      sections: [
        {
          h: 'El servicio',
          p: ['{site} es un sitio gratuito donde se votan fotos de animales por parejas, se participa en retos temáticos y se descubren animales que buscan hogar. Lo gestiona {owner}.'],
        },
        {
          h: 'Tu cuenta',
          list: [
            'Debes tener al menos 14 años.',
            'Una cuenta por persona. Guarda en secreto tu contraseña: eres responsable de lo que pase con tu cuenta.',
            'El nombre de usuario no debe suplantar a otras personas ni ser ofensivo.',
          ],
        },
        {
          h: 'Las fotos que subes',
          list: [
            'Sube solo fotos hechas por ti o que tengas derecho a usar, y solo de animales tuyos o a tu cuidado.',
            'Están prohibidas las fotos con personas reconocibles, contenido violento, cruel o sexual, animales maltratados o en peligro, publicidad y textos ofensivos.',
            'Las fotos siguen siendo tuyas. Al subirlas nos permites mostrarlas en {site}, en duelos, clasificaciones, retos y tarjetas para compartir, hasta que las borres.',
            'Cada foto se revisa antes de hacerse pública. Podemos rechazar o retirar una foto que no cumpla estas reglas.',
          ],
        },
        {
          h: 'Votos limpios',
          p: ['Están prohibidos los bots, los votos automáticos, las cuentas múltiples y cualquier truco para inflar los corazones de una mascota. Si ocurre podemos anular votos, sacar la mascota de las clasificaciones o suspender la cuenta.'],
        },
        {
          h: 'Refugios y adopciones',
          list: [
            'Los refugios deben dar información verdadera sobre sí mismos y sobre los animales. Los verificamos antes de hacerlos públicos.',
            'Las adopciones se hacen directamente entre tú y el refugio. {site} os pone en contacto pero no participa en la adopción ni responde de los acuerdos.',
          ],
        },
        {
          h: 'Anuncios',
          p: ['El sitio se mantiene con anuncios mostrados entre duelos. No somos responsables de los productos ni de los sitios de los anunciantes.'],
        },
        {
          h: 'Suspensión y eliminación',
          p: ['Puedes eliminar tu cuenta cuando quieras desde la página «Tu cuenta». Podemos suspender o eliminar las cuentas que incumplan estas reglas.'],
        },
        {
          h: 'Responsabilidad',
          p: ['Hacemos lo posible para que el sitio funcione bien, pero puede tener interrupciones o errores. En los límites que permite la ley no respondemos de daños indirectos derivados del uso del sitio. Los derechos que la ley reconoce a los consumidores siguen siempre vigentes.'],
        },
        {
          h: 'Cambios y ley aplicable',
          p: [
            'Si cambiamos estas condiciones actualizamos la fecha de arriba y, si los cambios son importantes, te avisamos en el sitio.',
            'Se aplica la ley italiana. Para preguntas escribe a {email}.',
          ],
        },
      ],
    },
  },
} satisfies LegalTexts
