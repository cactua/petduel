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
          p: ['El responsable del tratamiento es {owner}. Para cualquier pregunta sobre privacidad o para ejercer tus derechos, escribe a {email}.'],
        },
        {
          h: 'Qué datos recogemos',
          list: [
            'Cuenta: correo, nombre de usuario y contraseña. La contraseña solo se guarda cifrada: nadie puede leerla, ni siquiera nosotros. Solo te escribimos para confirmar el correo, para recuperar la contraseña y para contarte el resultado de tus denuncias.',
            'Perfil: biografía, pronombres, avatar e imagen de portada, si los añades.',
            { only: ['pets'], t: 'Mascotas y fotos: nombre, especie, raza, ciudad y las fotos que subes.' },
            { only: ['furry'], t: 'Personajes y dibujos: nombre, especie, la ficha del personaje (pronombres, colores, reglas para quien lo dibuja) y las imágenes que subes, con el nombre y el enlace del artista si los indicas.' },
            { only: ['moto'], t: 'Motos y fotos: nombre, tipo de moto, marca y modelo, ciudad y las fotos que subes.' },
            { only: ['artists'], t: 'Perfil de artista: si te marcas como artista, los enlaces a tus páginas, el estado de tus encargos y las imágenes en las que otras personas te indican como autor.' },
            'Votos: qué imágenes has elegido en los duelos. Con cuenta, el voto está ligado a tu perfil; sin cuenta, a un código anónimo guardado en una cookie técnica.',
            'Actividad en el sitio: a quién sigues, tus favoritos, los cumplidos que haces y las personas que bloqueas.',
            'Denuncias: el motivo y el texto que escribes. Si denuncias sin cuenta, también el correo que dejas para recibir la respuesta.',
            { only: ['shelters'], t: 'Refugios: nombre, ciudad, descripción, web, código fiscal, correo y teléfono de contacto, y los datos para donaciones (IBAN y enlace). El código fiscal, el correo y el teléfono de contacto solo los ven los moderadores y el propio refugio.' },
            { only: ['shelters'], t: 'Solicitudes de adopción: el mensaje y el teléfono (opcional) que envías a un refugio.' },
            'Avisos y notificaciones: los avisos de la campana. Si activas las notificaciones push, guardamos la dirección que tu navegador nos da para su servicio de notificaciones y el idioma en que recibirlas.',
            'Datos técnicos: idioma del navegador y ubicación aproximada (país y ciudad) que la red que protege el sitio deduce de la dirección IP. Nunca guardamos la IP tal cual: solo una huella cifrada que no permite recuperar la dirección, para limitar votos automáticos, registros en serie e intentos de acceso.',
            'Anuncios: cuando ves o pulsas un anuncio guardamos el evento con una huella cifrada de tu código de voto o de tu cuenta, el país, la ciudad y el idioma, para contar visualizaciones, clics y cuántas veces al día ves el mismo anuncio.',
          ],
        },
        {
          h: 'Para qué los usamos',
          list: [
            { only: ['pets'], t: 'Para que uses el servicio: cuenta, mascotas, duelos, clasificaciones, retos y adopciones (ejecución del contrato).' },
            { only: ['furry'], t: 'Para que uses el servicio: cuenta, personajes, duelos, clasificaciones, retos y créditos a los artistas (ejecución del contrato).' },
            { only: ['moto'], t: 'Para que uses el servicio: cuenta, motos, duelos, clasificaciones y retos (ejecución del contrato).' },
            'Por seguridad: frenar bots, votos falsos, cuentas en serie y contenido prohibido, moderar las imágenes, gestionar las denuncias y registrar las acciones de los moderadores (interés legítimo y obligaciones del Reglamento europeo de servicios digitales).',
            'Para mostrar anuncios de nuestros propios anunciantes elegidos por zona, idioma y hora, sin perfilarte (interés legítimo).',
            'Para mostrar anuncios de Google que usan cookies, solo si aceptas en el banner (consentimiento).',
            'Para enviarte notificaciones push, solo si las activas (consentimiento, que retiras desactivándolas).',
            { only: ['shelters'], t: 'Para verificar los refugios y sus datos para donaciones antes de publicarlos (interés legítimo y protección de los animales y de quien dona).' },
          ],
        },
        {
          h: 'Qué ven los demás',
          p: [
            { only: ['pets'], t: 'Son públicos tu nombre de usuario, tu perfil (biografía, pronombres, avatar), tus mascotas con nombre, raza y ciudad, las fotos aprobadas, cuántos votos has dado (no cuáles) y, si gestionas un refugio verificado, su página pública con los datos para donaciones.' },
            { only: ['furry'], t: 'Son públicos tu nombre de usuario, tu perfil (biografía, pronombres, avatar), tus personajes con su ficha, las imágenes aprobadas con el nombre del artista, tu perfil de artista si lo activas y cuántos votos has dado (no cuáles).' },
            { only: ['moto'], t: 'Son públicos tu nombre de usuario, tu perfil (biografía, pronombres, avatar), tus motos con marca, modelo y ciudad, las fotos aprobadas y cuántos votos has dado (no cuáles).' },
            'No son públicos tu correo, qué imágenes has votado, tus denuncias, a quién bloqueas ni los corazones que reciben tus participantes fuera del top 5.',
          ],
        },
        {
          h: 'Con quién los compartimos',
          list: [
            'Los proveedores que alojan el sitio, la base de datos y las imágenes, y el que protege el sitio de ataques, que tratan los datos solo por cuenta nuestra.',
            'El proveedor que envía nuestros correos (confirmación del correo, nueva contraseña, resultado de las denuncias): recibe tu dirección y el texto del correo.',
            'El servicio de notificaciones de tu navegador (Google, Mozilla, Apple o Microsoft), solo si activas las notificaciones push: recibe las notificaciones cifradas para entregarlas.',
            { only: ['shelters'], t: 'El refugio al que envías una solicitud de adopción: recibe el mensaje, tu nombre de usuario, tu correo para responderte y tu teléfono si lo indicas.' },
            { only: ['shelters'], t: 'OpenStreetMap: el mapa de refugios carga las imágenes del mapa desde sus servidores, que ven tu dirección IP. Cuando un refugio busca su dirección, el texto buscado pasa al servicio de búsqueda de OpenStreetMap.' },
            'Google, solo si aceptas los anuncios de Google: en ese caso Google usa sus propias cookies, como explica su política (policies.google.com/privacy).',
          ],
          p: ['No vendemos tus datos a nadie.'],
        },
        {
          h: 'Datos fuera de la Unión Europea',
          p: ['Si aceptas los anuncios de Google o activas las notificaciones push, algunos datos pueden llegar a Estados Unidos (Google, Apple, Microsoft). Estos proveedores participan en el Marco de Privacidad de Datos UE-EE. UU. o usan las cláusulas contractuales tipo aprobadas por la Comisión Europea.'],
        },
        {
          h: 'Cuánto tiempo',
          p: [
            { only: ['pets'], t: 'Guardamos los datos de la cuenta mientras exista. Cuando la eliminas borramos enseguida perfil, mascotas, fotos (también los archivos), refugio, solicitudes de adopción, denuncias hechas, avisos y suscripciones push.' },
            { only: ['furry', 'moto'], t: 'Guardamos los datos de la cuenta mientras exista. Cuando la eliminas borramos enseguida perfil, participantes, imágenes (también los archivos), denuncias hechas, avisos y suscripciones push.' },
            'Los votos que has dado se quedan, pero sin ningún vínculo contigo: sirven para no falsear las clasificaciones de los demás. Lo mismo vale para los recuentos de los anuncios.',
            'Las huellas cifradas de la IP usadas contra los abusos se borran solas como mucho al cabo de un día; las ligadas a un aviso de votos sospechosos se quedan con el aviso, que los moderadores usan para reconocer abusos repetidos. Los enlaces enviados por correo valen una hora (nueva contraseña) o 48 horas (confirmación del correo). Las denuncias hechas sin cuenta las guardamos mientras hagan falta para gestionarlas y responder a posibles reclamaciones.',
          ],
        },
        {
          h: 'Tus derechos',
          list: [
            'Ver y descargar tus datos: desde la página «Tu cuenta» descargas un archivo con todo lo que te concierne.',
            'Corregirlos: el perfil y los participantes se editan desde el sitio; para lo demás, escríbenos.',
            'Borrarlos: desde la página «Tu cuenta» eliminas la cuenta cuando quieras.',
            'Oponerte al tratamiento o limitarlo, retirar el consentimiento a los anuncios de Google desde el menú, en «Cookies y anuncios», y desactivar las notificaciones push desde tu perfil o el navegador.',
            'Reclamar ante una autoridad de protección de datos: en Italia, el Garante per la protezione dei dati personali (garanteprivacy.it).',
          ],
        },
        {
          h: 'Edad mínima',
          p: ['Para crear una cuenta debes tener al menos 14 años, y te pedimos que lo confirmes al registrarte. Si eres más joven, pide a tu madre, padre o tutor que cree la cuenta por ti. Si descubrimos que una cuenta es de una persona menor de 14 años, la eliminamos.'],
        },
        {
          h: 'Cambios',
          p: ['Si cambiamos esta política actualizamos la fecha de arriba. Si los cambios son importantes, te lo diremos con un aviso en el sitio.'],
        },
      ],
    },
    cookie: {
      title: 'Política de cookies',
      intro: 'Las cookies son pequeños archivos que el sitio guarda en tu navegador. {site} usa pocas, y casi todas sirven solo para que funcione.',
      sections: [
        {
          h: 'Cookies técnicas',
          p: ['Son necesarias para que el sitio funcione y no requieren tu consentimiento. No las usamos para seguirte en otros sitios.'],
          table: {
            head: ['Nombre', 'Para qué sirve', 'Duración'],
            rows: [
              ['nuxt-session', 'Mantener tu sesión y recordar tu código anónimo de voto si no tienes cuenta (cifrado)', '30 días'],
              ['lang', 'Recordar el idioma que elegiste', '1 año'],
              ['theme', 'Recordar el tema claro u oscuro', '1 año'],
              ['a11y-motion, a11y-contrast, a11y-haptics', 'Recordar tus preferencias de accesibilidad: menos animaciones, contraste alto, vibración apagada', '1 año'],
              ['consent', 'Recordar tu elección sobre los anuncios de Google', '6 meses'],
            ],
          },
        },
        {
          h: 'Otros datos guardados en el navegador',
          p: ['Además de las cookies, el sitio guarda en el navegador alguna información técnica que no sale de tu dispositivo:'],
          list: [
            '«petduel:nudge-closed» (almacenamiento local): recuerda que cerraste el consejo bajo los duelos. Se queda hasta que borres los datos del sitio.',
            'Una copia del sitio para la app instalable (service worker y caché): hace que el sitio se abra más rápido y te permite recibir notificaciones push, si las activas.',
          ],
        },
        {
          h: 'Cookies de los anuncios de Google',
          p: [
            'Solo si aceptas en el banner cargamos los anuncios de Google AdSense. Google usa sus propias cookies para mostrar, medir y personalizar anuncios según tu actividad.',
            'Si rechazas, el script de Google no se carga en absoluto: solo ves anuncios de nuestros propios anunciantes, que no usan cookies.',
            'Cómo usa Google los datos: policies.google.com/technologies/partner-sites.',
          ],
        },
        {
          h: 'Nada de servicios externos sin motivo',
          p: [
            'Las fuentes del sitio las sirve el propio sitio: abrir una página no envía tu dirección IP a servicios de fuentes externos.',
            { only: ['shelters'], t: 'El mapa de refugios carga las imágenes de OpenStreetMap, que no usa cookies pero ve tu dirección IP.' },
          ],
        },
        {
          h: 'Cómo cambiar de opinión',
          p: [
            'Puedes cambiar tu elección cuando quieras desde el menú de arriba a la derecha, en «Cookies y anuncios».',
            'También puedes borrar las cookies en los ajustes del navegador. Si borras las cookies técnicas tendrás que volver a entrar.',
          ],
        },
        {
          h: 'Contacto',
          p: ['Para preguntas sobre las cookies, escribe a {email}.'],
        },
      ],
    },
    terms: {
      title: 'Condiciones de uso',
      intro: [
        { only: ['pets'], t: 'Al usar {site} aceptas estas normas. Están pensadas para que el sitio sea agradable, justo y seguro para personas y animales.' },
        { only: ['furry', 'moto'], t: 'Al usar {site} aceptas estas normas. Están pensadas para que el sitio sea agradable, justo y seguro para todos.' },
      ],
      sections: [
        {
          h: 'El servicio',
          p: [
            { only: ['pets'], t: '{site} es un sitio gratuito donde se votan fotos de animales por parejas, se participa en retos temáticos y se descubren animales que buscan hogar. Lo gestiona {owner}.' },
            { only: ['furry'], t: '{site} es un sitio gratuito donde se votan por parejas dibujos de personajes furry, se participa en retos temáticos y se da crédito a los artistas. Lo gestiona {owner}.' },
            { only: ['moto'], t: '{site} es un sitio gratuito donde se votan por parejas fotos de motos, agrupadas por tipo, y se participa en retos temáticos. Lo gestiona {owner}.' },
            'Para contactarnos, también como autoridad o por cuestiones del Reglamento europeo de servicios digitales, escribe a {email} en italiano o en inglés.',
          ],
        },
        {
          h: 'Tu cuenta',
          list: [
            'Debes tener al menos 14 años.',
            'Una cuenta por persona. Mantén en secreto la contraseña: eres responsable de lo que pase con tu cuenta. Si la olvidas, puedes elegir una nueva con el enlace «¿Has olvidado la contraseña?».',
            'El nombre de usuario no debe imitar a otras personas ni ser ofensivo.',
          ],
        },
        {
          h: 'Las imágenes que subes',
          list: [
            { only: ['pets'], t: 'Sube solo fotos hechas por ti o que tengas derecho a usar, y solo de animales tuyos o que cuidas.' },
            { only: ['furry'], t: 'Sube solo dibujos tuyos, o de otros artistas que te hayan dado permiso: en ese caso indica el artista. No se permiten imágenes generadas con inteligencia artificial, aunque estén retocadas.' },
            { only: ['moto'], t: 'Sube solo fotos hechas por ti o que tengas derecho a usar. Tapa las matrículas y no muestres personas reconocibles sin su consentimiento.' },
            'Están prohibidos los contenidos violentos, crueles, sexuales o de odio, los datos personales de otros, la publicidad y cualquier contenido ilegal.',
            'Las imágenes siguen siendo tuyas. Al subirlas nos permites mostrarlas en {site}, en duelos, clasificaciones, retos y tarjetas para compartir, hasta que las borres.',
            'Cada imagen la revisa un moderador antes de hacerse pública.',
          ],
        },
        {
          h: 'Denuncias y moderación',
          list: [
            'Cualquiera, incluso sin cuenta, puede denunciar una imagen o un perfil con el botón «Denunciar», explicando qué pasa. Quien denuncia sin cuenta deja un correo y le escribimos con el resultado.',
            'Los moderadores son personas y deciden según estas condiciones, las normas de la comunidad y la ley. No usamos sistemas automáticos para decidir sobre los contenidos.',
            'Si quitamos o rechazamos una imagen tuya te decimos el motivo. Si suspendemos tu cuenta lo verás al intentar entrar, y puedes preguntarnos el motivo en {email}. Si no estás de acuerdo con una decisión, escríbenos: otra persona la revisará. Siempre quedan las vías previstas por la ley.',
            'Quien publica a menudo contenido claramente ilegal, o envía a menudo denuncias claramente infundadas, puede ser suspendido.',
          ],
        },
        {
          h: 'Derechos de autor',
          p: [
            'Si un contenido usa tu obra sin permiso, denúncialo con «Denunciar» eligiendo «Publicada sin permiso», o escribe a {email} con el enlace y por qué la obra es tuya. La quitamos en cuanto lo comprobamos.',
            { only: ['artists'], t: 'Si alguien te indica como autor de un dibujo que no has hecho, puedes quitar tu nombre desde la página de tu perfil («No soy yo»). Si el dibujo es tuyo pero no diste permiso, denúncialo desde allí: las denuncias de los artistas tienen prioridad.' },
            { only: ['pets', 'moto'], t: 'Las fotos de ejemplo vienen de Wikimedia Commons con sus licencias libres: autores y licencias están en la página de créditos.' },
          ],
        },
        {
          h: 'Votos limpios',
          p: ['Están prohibidos los bots, los votos automáticos, las cuentas múltiples y cualquier truco para inflar los corazones de un participante. Si ocurre, podemos anular los votos, quitar al participante de las clasificaciones o suspender la cuenta.'],
        },
        {
          h: 'Refugios, adopciones y donaciones',
          only: ['shelters'],
          list: [
            'Los refugios deben dar información veraz sobre sí mismos y sobre los animales. Los verificamos antes de publicarlos y revisamos cada nuevo IBAN o enlace para donaciones antes de mostrarlo.',
            'Las adopciones se hacen directamente entre tú y el refugio. {site} os pone en contacto, pero no participa en la adopción ni responde de los acuerdos.',
            'Las donaciones van directamente al refugio: {site} no las recibe, no se queda nada y no puede devolverlas. Antes de donar puedes comprobar el refugio en sus canales oficiales.',
          ],
        },
        {
          h: 'Anuncios',
          p: ['El sitio se mantiene con anuncios mostrados entre duelos, siempre señalados como publicidad. No somos responsables de los productos ni de los sitios de los anunciantes.'],
        },
        {
          h: 'Suspensión y eliminación',
          p: ['Puedes eliminar tu cuenta cuando quieras desde la página «Tu cuenta». Podemos suspender o eliminar las cuentas que incumplan estas normas; si ocurre, te decimos el motivo cuando nos lo preguntes.'],
        },
        {
          h: 'Responsabilidad',
          p: ['Hacemos lo posible para que el sitio funcione bien, pero puede tener interrupciones o errores. En los límites de la ley, no respondemos de los daños indirectos por el uso del sitio. Tus derechos como consumidor siguen siempre vigentes.'],
        },
        {
          h: 'Cambios y ley aplicable',
          p: [
            'Si cambiamos estas condiciones actualizamos la fecha de arriba y, para los cambios importantes, te lo decimos en el sitio.',
            'Se aplica la ley italiana. Para preguntas, escribe a {email}.',
          ],
        },
      ],
    },
    accessibility: {
      title: 'Declaración de accesibilidad',
      intro: 'Queremos que {site} sea fácil de usar para todos, también para quien usa un lector de pantalla, solo el teclado, la ampliación o tiene dificultades con los movimientos precisos.',
      sections: [
        {
          h: 'Objetivo',
          p: ['Seguimos las pautas WCAG 2.2 nivel AA y la norma europea EN 301 549, como exige el Acta Europea de Accesibilidad (Directiva UE 2019/882).'],
        },
        {
          h: 'Estado de conformidad',
          p: ['{site} es parcialmente conforme: la mayoría de las páginas cumplen los requisitos, pero quedan las limitaciones indicadas abajo.'],
        },
        {
          h: 'Qué hemos hecho',
          list: [
            'Puedes votar con el botón «Elegir», sin arrastrar; con el teclado bastan las flechas.',
            'Enlace «Ir al contenido», orden de tabulación lógico y foco bien visible.',
            'Textos y botones con contraste de al menos 4,5:1 y botones de al menos 44 píxeles.',
            'Desde el menú puedes elegir menos animaciones, contraste alto, tema claro u oscuro y apagar la vibración.',
            'El sitio funciona con el zoom del navegador hasta el 200 % y en 5 idiomas.',
          ],
        },
        {
          h: 'Limitaciones conocidas',
          list: [
            'Las imágenes subidas por los usuarios se describen con el nombre y los datos que introdujeron, no con una descripción completa de lo que muestran.',
            'Los anuncios vienen de terceros y puede que no cumplan todos los requisitos.',
          ],
        },
        {
          h: 'Cómo lo comprobamos',
          p: ['Con una evaluación interna, con controles automáticos y pruebas manuales con teclado y lector de pantalla.'],
        },
        {
          h: 'Informa de un problema',
          p: ['Si encuentras una parte del sitio que no puedes usar, escríbenos a {email}: respondemos en 30 días y, si es posible, te damos el contenido de otra forma.', 'Si la respuesta no te satisface, puedes dirigirte a la autoridad de vigilancia de tu país.'],
        },
      ],
    },
  },
} satisfies LegalTexts
