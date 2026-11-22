import { LEGAL_DOCS_REGISTRY, PROVIDER_INFO } from '../config/legalConfig'
import type { LegalDocFull } from '../types/legal.types'

export const LEGAL_DOCUMENTS: Record<string, LegalDocFull> = {
  // 1. TÉRMINOS Y CONDICIONES
  terminos: {
    ...LEGAL_DOCS_REGISTRY.terminos,
    sections: [
      {
        id: 'introduccion',
        numeral: '1.',
        title: 'Identificación de las Partes y Aceptación Contractual',
        paragraphs: [
          `El presente contrato regula el acceso y uso de la plataforma digital Style Radar (en adelante, «Style Radar» o «la Plataforma»), de titularidad de ${PROVIDER_INFO.razonSocial}, identificada con NIT ${PROVIDER_INFO.nit}, con domicilio principal en ${PROVIDER_INFO.direccion}, correo electrónico de contacto ${PROVIDER_INFO.correoGeneral} y línea de atención ${PROVIDER_INFO.telefono}.`,
          `Al registrarte, navegar, interactuar o realizar transacciones en Style Radar, declaras de manera libre, previa y voluntaria que has leído, comprendido y aceptado en su totalidad estos Términos y Condiciones, así como nuestra Política de Tratamiento de Datos Personales. Si no estás de acuerdo con alguna de las disposiciones aquí establecidas, deberás abstenerte de utilizar la Plataforma.`,
        ],
      },
      {
        id: 'naturaleza-rol',
        numeral: '2.',
        title: 'Naturaleza del Servicio y Rol de Intermediación',
        paragraphs: [
          `Style Radar es una plataforma tecnológica que conecta la oferta de tiendas de moda independiente, marcas locales y proyectos de diseño con sede o presencia en Bogotá D.C., Colombia, así como iniciativas circulares y fundaciones sin ánimo de lucro, con usuarios compradores finales.`,
          `En los términos de la Ley 1480 de 2011 (Estatuto del Consumidor), Style Radar actúa principalmente como portal de contacto e intermediario tecnológico. La relación comercial directa de compraventa o donación de prendas y accesorios se perfecciona entre el comprador y la tienda aliada, o entre el donante y la fundación respectiva, quienes son los únicos responsables de la existencia, calidad, idoneidad, descripción y garantía de los productos ofertados.`,
        ],
      },
      {
        id: 'edad-capacidad',
        numeral: '3.',
        title: 'Mayoría de Edad y Capacidad Legal (+18 Años)',
        paragraphs: [
          `El uso y registro en Style Radar está estrictamente reservado a personas naturales mayores de dieciocho (18) años que cuenten con plena capacidad civil para obligarse conforme a la legislación colombiana, o a personas jurídicas legalmente constituidas a través de sus representantes legales debidamente facultados.`,
          `Queda prohibido el registro de menores de edad. En caso de detectarse cuentas abiertas por menores de 18 años, Style Radar procederá a la cancelación inmediata de la cuenta y a la supresión de los datos personales asociados, conforme a la Ley 1581 de 2012.`,
        ],
      },
      {
        id: 'roles-usuarios',
        numeral: '4.',
        title: 'Roles de Usuario dentro de la Plataforma',
        paragraphs: [
          `Style Radar contempla los siguientes perfiles de usuario, cada uno con facultades y responsabilidades específicas:`,
        ],
        bullets: [
          `Comprador / Explorador: Persona que explora el catálogo local, utiliza el probador virtual, guarda prendas en playlists, adquiere productos de tiendas o apoya causas de donación.`,
          `Almacén / Tienda Aliada: Establecimiento de comercio o marca de diseño local autorizada para exhibir inventario, gestionar pedidos y despachar productos a través de la suscripción correspondiente.`,
          `Representante de Fundación: Organización sin ánimo de lucro verificada (ESAL) encargada de recibir, clasificar y certificar donaciones de ropa.`,
          `Administrador Style Radar: Personal autorizado para la moderación comunitaria, auditoría de catálogo, soporte técnico y supervisión de cumplimiento normativo.`,
        ],
      },
      {
        id: 'precios-moneda-iva',
        numeral: '5.',
        title: 'Precios en Pesos Colombianos (COP) e Impuestos',
        paragraphs: [
          `Todos los precios publicados en el catálogo de Style Radar están expresados de manera clara y visible en pesos colombianos (COP), e incluyen el Impuesto sobre las Ventas (IVA) y cualquier otro gravamen tributario aplicable en Colombia, de estricto acuerdo con el artículo 26 de la Ley 1480 de 2011.`,
          `Los costos de transporte o envío local en Bogotá y sus alrededores se discriminan de manera previa e independiente antes de que el usuario confirme cualquier orden de pago.`,
        ],
      },
      {
        id: 'disponibilidad-errores',
        numeral: '6.',
        title: 'Disponibilidad de Inventario y Precios Tipográficos',
        paragraphs: [
          `La disponibilidad de las prendas depende del stock informado en tiempo real por cada tienda aliada. En caso de que una prenda quede fuera de inventario de manera sobreviniente, la tienda deberá notificar al comprador dentro de las veinticuatro (24) horas siguientes y coordinar el cambio o la devolución total e inmediata del dinero.`,
          `En caso de presentarse un error manifiesto y desproporcionado en la publicación del precio (error tipográfico evidente), la tienda aliada y Style Radar se reservan el derecho de corregir la publicación e informar al usuario, procediendo con la cancelación de la orden y el reintegro de fondos sin penalidad.`,
        ],
      },
      {
        id: 'suspension-cuentas',
        numeral: '7.',
        title: 'Suspensión, Inactivación y Cancelación de Cuentas',
        paragraphs: [
          `Style Radar se reserva la facultad de suspender o cancelar temporal o definitivamente el acceso a cualquier usuario o tienda que incurra en:`,
        ],
        bullets: [
          `Suministro de información falsa, fraudulenta o suplantación de identidad.`,
          `Publicación o venta de réplicas, falsificaciones o prendas no autorizadas.`,
          `Violación reiterada de los tiempos de despacho o reiteradas quejas sin resolver.`,
          `Uso indebido de la plataforma, ingeniería inversa o extracción no autorizada de datos (scraping).`,
        ],
      },
      {
        id: 'limitacion-responsabilidad',
        numeral: '8.',
        title: 'Limitación de Responsabilidad Tecnológica',
        paragraphs: [
          `Style Radar procura la máxima disponibilidad y estabilidad del servicio web; sin embargo, no garantiza un funcionamiento ininterrumpido o libre de errores derivados de fallas en redes de telecomunicaciones, servidores externos o causas de fuerza mayor o caso fortuito.`,
        ],
      },
      {
        id: 'jurisdiccion-ley',
        numeral: '9.',
        title: 'Ley Aplicable, Domicilio y Jurisdicción',
        paragraphs: [
          `Estos Términos y Condiciones se rigen e interpretan bajo las leyes de la República de Colombia. Cualquier controversia que no pueda resolverse de común acuerdo entre las partes será sometida a los jueces competentes de la ciudad de Bogotá D.C., o al tribunal de arbitramento conforme a la legislación procesal civil colombiana.`,
          `Sin perjuicio de lo anterior, los usuarios tienen expedito su derecho de acudir ante la Delegatura de Protección al Consumidor de la Superintendencia de Industria y Comercio (SIC) a través de www.sic.gov.co.`,
        ],
      },
    ],
  },

  // 2. POLÍTICA DE DATOS PERSONALES
  'datos-personales': {
    ...LEGAL_DOCS_REGISTRY['datos-personales'],
    sections: [
      {
        id: 'responsable',
        numeral: '1.',
        title: 'Responsable del Tratamiento de Datos Personales',
        paragraphs: [
          `${PROVIDER_INFO.razonSocial}, sociedad identificada con NIT ${PROVIDER_INFO.nit}, con domicilio en ${PROVIDER_INFO.direccion}, Bogotá D.C., Colombia, es la Responsable del tratamiento de los datos personales recolectados a través de la plataforma Style Radar.`,
          `Canal oficial para el ejercicio de derechos de Habeas Data: correo electrónico ${PROVIDER_INFO.correoDatos}, teléfono ${PROVIDER_INFO.telefono}, en el horario de atención ${PROVIDER_INFO.horarioAtencion}.`,
        ],
      },
      {
        id: 'marco-legal',
        numeral: '2.',
        title: 'Marco Normativo Colombiano',
        paragraphs: [
          `Esta política se expide en estricto cumplimiento de los artículos 15 y 20 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto Único Reglamentario 1074 de 2015) y las directrices emitidas por la Superintendencia de Industria y Comercio (SIC).`,
          `Inscripción en el Registro Nacional de Bases de Datos (RNBD): de conformidad con la Circular Externa 002 de 2015 de la SIC, Style Radar registrará oportunamente sus bases de datos en el RNBD en caso de alcanzar los topes de activos o exigencias normativas vigentes.`,
        ],
      },
      {
        id: 'datos-recolectados',
        numeral: '3.',
        title: 'Categorías de Datos Personales Recolectados',
        paragraphs: [
          `Style Radar recopila únicamente los datos estrictamente necesarios y pertinentes para la prestación de sus servicios, clasificados así:`,
        ],
        bullets: [
          `Datos de identificación y contacto: Nombre y apellidos completos, tipo y número de documento de identidad (en caso de facturación o trámites específicos), correo electrónico, número de teléfono o celular, y dirección física de entrega en Bogotá.`,
          `Datos transaccionales: Historial de suscripciones, reservas de prendas, solicitudes de donación y radicados de PQRS. Aclaramos expresamente que Style Radar NO recopila ni almacena datos financieros ni códigos de seguridad CVV/CVC, los cuales son procesados directamente por ${PROVIDER_INFO.pasarelaPagos} bajo certificación PCI-DSS.`,
          `Datos técnicos y de navegación: Dirección IP, identificador de dispositivo, sistema operativo, preferencias de visualización y cookies según el consentimiento otorgado.`,
          `Datos biométricos o de imagen (Opcionales): Fotografías corporales o siluetas para el uso voluntario del Probador Virtual, las cuales cuentan con un régimen reforzado de autorización previa y expresa.`,
        ],
      },
      {
        id: 'finalidades',
        numeral: '4.',
        title: 'Finalidades del Tratamiento de Datos',
        paragraphs: [
          `Los datos personales de los Titulares serán tratados para las siguientes finalidades legítimas:`,
        ],
        bullets: [
          `Gestionar el registro de usuario, validación de cuenta y autenticación segura mediante contraseñas cifradas y códigos de verificación OTP.`,
          `Permitir la conexión comercial entre compradores y tiendas aliadas de Bogotá, y entre donantes y fundaciones.`,
          `Coordinar la entrega física y despacho de prendas adquiridas a través de servicios de mensajería local.`,
          `Atender consultas, quejas, reclamos, solicitudes de garantía y trámites de derecho de retracto.`,
          `Enviar comunicaciones operativas sobre el estado de pedidos, actualizaciones técnicas o modificaciones de políticas.`,
          `Enviar boletines informativos, tendencias y ofertas exclusivas de moda local únicamente a los usuarios que hayan marcado de forma expresa la casilla opcional de novedades comerciales.`,
        ],
      },
      {
        id: 'derechos-titular',
        numeral: '5.',
        title: 'Derechos del Titular de los Datos Personales (Derechos ARCO)',
        paragraphs: [
          `De conformidad con el artículo 8 de la Ley 1581 de 2012, tú como Titular de los datos cuentas con los siguientes derechos inalienables y gratuitos:`,
        ],
        bullets: [
          `Conocer, actualizar y rectificar tus datos personales frente a Style Radar o encargados del tratamiento cuando estos sean parciales, inexactos, incompletos o induzcan a error.`,
          `Solicitar prueba de la autorización otorgada a Style Radar para el tratamiento de tus datos.`,
          `Ser informado, previa solicitud, respecto del uso que se le ha dado a tus datos personales.`,
          `Revocar la autorización y/o solicitar la supresión de tus datos cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.`,
          `Acceder en forma gratuita a tus datos personales que hayan sido objeto de tratamiento.`,
        ],
      },
      {
        id: 'procedimiento-consultas-reclamos',
        numeral: '6.',
        title: 'Procedimiento de Consultas (10 días) y Reclamos (15 días)',
        paragraphs: [
          `Los titulares o sus causahabientes podrán ejercer sus derechos mediante solicitud escrita dirigida al correo ${PROVIDER_INFO.correoDatos} o a través de nuestra sección de PQRS:`,
        ],
        bullets: [
          `Consultas: Serán atendidas en un término máximo de diez (10) días hábiles contados a partir de la fecha de su recibo. Si no fuere posible atender la consulta dentro de dicho término, se informará al interesado antes del vencimiento expresando los motivos y señalando la fecha en que se resolverá, la cual no superará los cinco (5) días hábiles siguientes al vencimiento del primer término.`,
          `Reclamos: Cuando el titular considere que la información debe ser corregida, actualizada o suprimida, o advierta incumplimiento legal, formulará un reclamo. Si el reclamo resulta incompleto, se requerirá al interesado dentro de los cinco (5) días siguientes a la recepción para que subsane las fallas. Transcurridos dos (2) meses sin que el peticionario presente la información requerida, se entenderá desistido. El término máximo para atender el reclamo será de quince (15) días hábiles; prorrogable por máximo ocho (8) días hábiles adicionales mediando justificación.`,
        ],
      },
      {
        id: 'menores-sensibles',
        numeral: '7.',
        title: 'Tratamiento de Datos de Menores de Edad y Datos Sensibles',
        paragraphs: [
          `Style Radar no recopila voluntariamente datos de niños, niñas y adolescentes. Si se identifica información de un menor, será eliminada inmediatamente.`,
          `Respecto a datos sensibles (fotos corporales o medidas antropométricas para el probador virtual), el usuario tiene derecho expreso a no responder ni suministrar dichos datos, y su entrega es 100% voluntaria.`,
        ],
      },
      {
        id: 'seguridad-conservacion',
        numeral: '8.',
        title: 'Medidas de Seguridad de la Información y Conservación',
        paragraphs: [
          `Style Radar implementa controles técnicos, humanos y administrativos para evitar la adulteración, pérdida, consulta, uso o acceso no autorizado a los datos, incluyendo cifrado en tránsito HTTPS/TLS 1.3, hashing seguro de contraseñas (bcrypt/Argon2) y almacenamiento en bases de datos con control de acceso por roles.`,
          `Los datos se conservarán mientras subsista la relación contractual con el usuario y por los plazos legales contables y tributarios exigidos por el Estatuto Tributario y Código de Comercio colombiano (hasta 5 a 10 años).`,
        ],
      },
      {
        id: 'autoridad-sic',
        numeral: '9.',
        title: 'Autoridad de Control y Enlace a la SIC',
        paragraphs: [
          `La Superintendencia de Industria y Comercio (SIC), a través de la Delegatura para la Protección de Datos Personales, ejerce la vigilancia sobre Style Radar. Si consideras que tus derechos han sido vulnerados una vez agotado el trámite directo con nosotros, podrás acudir a www.sic.gov.co.`,
        ],
      },
    ],
  },

  // 3. AVISO DE PRIVACIDAD
  'aviso-privacidad': {
    ...LEGAL_DOCS_REGISTRY['aviso-privacidad'],
    sections: [
      {
        id: 'resumen-ejecutivo',
        numeral: '1.',
        title: '¿Quién es el Responsable de tus datos?',
        paragraphs: [
          `${PROVIDER_INFO.razonSocial}, con NIT ${PROVIDER_INFO.nit}, domicilio en ${PROVIDER_INFO.direccion}, Bogotá D.C., y correo electrónico ${PROVIDER_INFO.correoDatos}.`,
        ],
      },
      {
        id: 'para-que',
        numeral: '2.',
        title: '¿Para qué usamos tu información?',
        paragraphs: [
          `Usamos tus datos para permitirte crear una cuenta, explorar marcas locales de Bogotá, conectarte con tiendas y fundaciones, coordinar despachos de pedidos y responder tus dudas o PQRS. No vendemos tus datos a terceros.`,
        ],
      },
      {
        id: 'derechos-rapidos',
        numeral: '3.',
        title: 'Tus derechos como titular',
        paragraphs: [
          `Tienes derecho a conocer, actualizar, rectificar y solicitar la eliminación de tus datos en cualquier momento escribiendo a ${PROVIDER_INFO.correoDatos}. Consulta la Política de Tratamiento de Datos Personales completa para conocer los detalles del procedimiento.`,
        ],
      },
    ],
  },

  // 4. POLÍTICA DE COOKIES
  cookies: {
    ...LEGAL_DOCS_REGISTRY.cookies,
    sections: [
      {
        id: 'que-son',
        numeral: '1.',
        title: '¿Qué son las cookies y para qué se utilizan?',
        paragraphs: [
          `Las cookies y tecnologías de almacenamiento local (como localStorage y sessionStorage) son pequeños archivos que se almacenan en tu navegador web al visitar Style Radar. Permiten recordar tus preferencias, mantener iniciada tu sesión de forma segura y recopilar información estadística para mejorar tu experiencia de compra de moda local.`,
        ],
      },
      {
        id: 'tabla-cookies',
        numeral: '2.',
        title: 'Clasificación e Inventario de Cookies en Style Radar',
        paragraphs: [
          `En cumplimiento de los principios de transparencia y minimización de datos, a continuación detallamos las categorías de cookies que utilizamos:`,
        ],
        bullets: [
          `Cookies Técnicas y Estrictamente Necesarias: Indispensables para el funcionamiento básico del sitio, gestión de autenticación segura (tokens JWT), carrito de compras y prevención de fraudes. Siempre activas por defecto (Duración: Sesión y hasta 1 año). Proveedor: Style Radar.`,
          `Cookies Funcionales: Permiten recordar tu configuración personalizada, como el maniquí preferido en el probador, el tema de interfaz (oscuro/claro) o los filtros activos en el catálogo (Duración: 6 meses). Proveedor: Style Radar.`,
          `Cookies Analíticas: Miden de forma agregada y anónima el número de visitantes, páginas vistas y patrones de navegación para optimizar la velocidad y el diseño del portal (Duración: Hasta 1 año). Proveedor: ${PROVIDER_INFO.razonSocial} / ${PROVIDER_INFO.sicUrl ? 'Métricas locales sin rastreo cruzado' : ''}. Desactivadas por defecto.`,
          `Cookies de Publicidad y Marketing: Miden la efectividad de campañas promocionales de tiendas aliadas y evitan mostrarte el mismo anuncio repetidamente (Duración: Hasta 6 meses). Desactivadas por defecto.`,
        ],
      },
      {
        id: 'gestion-consentimiento',
        numeral: '3.',
        title: '¿Cómo configurar o revocar el consentimiento?',
        paragraphs: [
          `Puedes cambiar tus preferencias en cualquier momento pulsando el botón «Configurar cookies» ubicado permanentemente en el pie de página de nuestro sitio web, o ajustando la configuración de privacidad directamente en tu navegador (Chrome, Firefox, Safari, Edge).`,
        ],
      },
    ],
  },

  // 5. POLÍTICA DE DEVOLUCIONES, CAMBIOS, RETRACTO Y GARANTÍAS
  'devoluciones-garantias': {
    ...LEGAL_DOCS_REGISTRY['devoluciones-garantias'],
    sections: [
      {
        id: 'retracto',
        numeral: '1.',
        title: 'Derecho de Retracto Legal (Artículo 47, Ley 1480 de 2011)',
        paragraphs: [
          `En todas las compras de prendas y accesorios realizadas a distancia o por medios electrónicos a través de Style Radar, el consumidor tiene derecho a ejercer el Derecho de Retracto dentro de los cinco (5) días hábiles siguientes a la fecha de entrega física del producto.`,
          `Condiciones para el ejercicio del retracto: La prenda debe ser devuelta en el mismo estado en que fue recibida, sin uso, sin lavar, con todas sus etiquetas y empaques originales intactos. Los costos de transporte y demás que conlleve la devolución del producto correrán por cuenta del consumidor, salvo acuerdo en contrario con la tienda.`,
          `Excepciones legales al derecho de retracto: Conforme al numeral 7 del artículo 47 de la Ley 1480 de 2011, se exceptúan del derecho de retracto las prendas de uso personal e íntimo (tales como ropa interior, vestidos de baño, tapabocas o aretes), por razones evidentes de higiene y bioseguridad.`,
        ],
      },
      {
        id: 'garantia-legal',
        numeral: '2.',
        title: 'Garantía Legal por Defectos de Calidad e Idoneidad',
        paragraphs: [
          `Todas las prendas nuevas comercializadas por tiendas aliadas en Style Radar cuentan con una garantía legal mínima de treinta (30) días calendario (o el plazo superior que informe expresamente la marca aliada) por defectos de fabricación, confección, costuras rotas o cierres defectuosos no atribuibles al mal uso.`,
          `Procedimiento: El comprador deberá radicar la solicitud de garantía a través de nuestro módulo de PQRS o directamente con la tienda. La tienda tendrá hasta quince (15) días hábiles para responder sobre la efectividad de la garantía (reparación gratuita del bien, cambio por una prenda idéntica o devolución del dinero si no admite reparación).`,
        ],
      },
      {
        id: 'cambios-talla',
        numeral: '3.',
        title: 'Políticas Comerciales de Cambios por Talla o Color',
        paragraphs: [
          `Los cambios de prendas por motivos de talla, color o gusto personal constituyen una política comercial de cada tienda aliada. En caso de solicitar cambio por talla, el comprador deberá coordinar con la tienda respectiva dentro de los plazos informados por esta, asumiendo los fletes correspondientes salvo promoción de primer cambio gratis.`,
        ],
      },
    ],
  },

  // 6. POLÍTICA DE ENVÍOS Y ENTREGAS
  'envios-entregas': {
    ...LEGAL_DOCS_REGISTRY['envios-entregas'],
    sections: [
      {
        id: 'cobertura',
        numeral: '1.',
        title: 'Cobertura de Envíos en Bogotá y Alrededores',
        paragraphs: [
          `Style Radar opera principalmente en la ciudad de Bogotá D.C. y su área de influencia (Chía, Cota, Soacha, Cajicá, La Calera). Los envíos son operados a través de empresas de mensajería urbana autorizadas y transportadoras nacionales aliadas de cada tienda.`,
        ],
      },
      {
        id: 'tiempos-entrega',
        numeral: '2.',
        title: 'Tiempos de Despacho y Entrega',
        paragraphs: [
          `El plazo de entrega promedio para entregas urbanas en Bogotá oscila entre 24 y 72 horas hábiles contadas a partir de la confirmación del pago. Cada tienda aliada cuenta con un plazo máximo de 24 a 48 horas para alistar y entregar el paquete a la transportadora.`,
        ],
      },
      {
        id: 'entrega-fallida',
        numeral: '3.',
        title: 'Protocolo de Entrega Fallida o Dirección Errónea',
        paragraphs: [
          `La transportadora realizará hasta dos (2) intentos de entrega en la dirección suministrada. En caso de no contactar al destinatario, el paquete retornará a la sede de la tienda y se coordinará un nuevo envío cuyos costos correrán a cargo del comprador si el error en la dirección fue atribuible a este.`,
        ],
      },
    ],
  },

  // 7. PAGOS Y SEGURIDAD
  'pagos-seguridad': {
    ...LEGAL_DOCS_REGISTRY['pagos-seguridad'],
    sections: [
      {
        id: 'pasarelas',
        numeral: '1.',
        title: 'Pago con Mercado Pago',
        paragraphs: [],
        bullets: [
          `Los pagos de planes y suscripciones se hacen con Mercado Pago en pesos colombianos (COP)`,
          `StyleRadar no almacena datos de tarjetas ni de otros medios de pago`,
        ],
      },
    ],
  },

  // 8. PQRS
  pqrs: {
    ...LEGAL_DOCS_REGISTRY.pqrs,
    sections: [
      {
        id: 'que-es-pqrs',
        numeral: '1.',
        title: '¿Qué es una PQRS y cuáles son sus tipos?',
        paragraphs: [
          `Style Radar pone a disposición de todos los usuarios un canal formal y trazable para la gestión de solicitudes, de conformidad con la Ley 1480 de 2011 y la Ley 1755 de 2015:`,
        ],
        bullets: [
          `Petición: Solicitud formal de información sobre prendas, políticas o servicios. Plazo legal de respuesta: 10 días hábiles.`,
          `Queja: Manifestación de inconformidad por la atención recibida por parte del equipo o de una tienda. Plazo legal de respuesta: 15 días hábiles.`,
          `Reclamo: Solicitud relativa a inconformidad con el producto recibido, garantía legal o incumplimiento contractual. Plazo legal de respuesta: 15 días hábiles.`,
          `Retracto: Notificación formal de desistimiento de compra dentro de los 5 días hábiles siguientes a la entrega. Plazo de confirmación: 5 días hábiles.`,
          `Sugerencia: Propuesta de mejora para la plataforma. Plazo de respuesta: 10 días hábiles.`,
        ],
      },
      {
        id: 'radicacion-tramite',
        numeral: '2.',
        title: 'Número de Radicado y Trazabilidad',
        paragraphs: [
          `Al enviar tu solicitud a través del formulario oficial de PQRS en esta página, el sistema generará automáticamente un número de radicado único (ej. SR-PQRS-YYYYMMDD-XXXX) y enviará una copia al correo electrónico informado. Puedes consultar el estado en cualquier momento con ese radicado.`,
        ],
      },
      {
        id: 'instancia-sic',
        numeral: '3.',
        title: 'Instancia Posterior ante la Superintendencia de Industria y Comercio',
        paragraphs: [
          `Si transcurrido el término legal no has obtenido respuesta o esta no resulta satisfactoria, podrás acudir ante la Delegatura de Protección al Consumidor de la SIC en www.sic.gov.co o en los canales telefónicos ${PROVIDER_INFO.sicLineaGratuita}.`,
        ],
      },
    ],
  },

  // 9. REGLAS PARA TIENDAS
  'reglas-tiendas': {
    ...LEGAL_DOCS_REGISTRY['reglas-tiendas'],
    sections: [
      {
        id: 'requisitos-registro',
        numeral: '1.',
        title: 'Requisitos de Registro y Vinculación de Tiendas Aliadas',
        paragraphs: [
          `Para operar como tienda o marca en Style Radar, el establecimiento debe ser una persona natural o jurídica legalmente matriculada ante la Cámara de Comercio de Bogotá u otra del territorio nacional, contar con Registro Único Tributario (RUT) activo, y superar el proceso de validación documental realizado por el equipo de moderación.`,
        ],
      },
      {
        id: 'prohibicion-replicas',
        numeral: '2.',
        title: 'Prohibición Absoluta de Réplicas y Falsificaciones',
        paragraphs: [
          `Queda terminantemente prohibida la publicación, exhibición o comercialización de prendas de imitación, réplicas no autorizadas, falsificaciones de marcas registradas o mercancía que infrinja los derechos de propiedad industrial de terceros. La infracción de esta norma conlleva la suspensión inmediata y definitiva de la tienda y el reporte a las autoridades competentes.`,
        ],
      },
      {
        id: 'veracidad-despacho',
        numeral: '3.',
        title: 'Veracidad en Precios, Tallas y Tiempos de Despacho',
        paragraphs: [
          `Las tiendas aliadas se comprometen a suministrar información fidedigna respecto a la composición textil, tallas reales (con tabla de medidas veraz), colores y disponibilidad de inventario. El despacho de pedidos deberá realizarse dentro del término pactado (máximo 48 horas hábiles).`,
        ],
      },
      {
        id: 'responsabilidad-proveedor',
        numeral: '4.',
        title: 'Condición de Proveedor Responsable frente al Consumidor',
        paragraphs: [
          `En virtud del Estatuto del Consumidor, la tienda aliada asume en forma directa e individual la calidad de proveedor del producto, siendo responsable de otorgar la garantía legal, atender el derecho de retracto y responder ante cualquier reclamación por idoneidad del bien vendido.`,
        ],
      },
      {
        id: 'comisiones-planes',
        numeral: '5.',
        title: 'Comisiones de Plataforma y Cuotas de Suscripción',
        paragraphs: [
          `Las condiciones comerciales aplicables a las tiendas incluyen la suscripción periódica al plan de aliados y/o una comisión fijada en ${PROVIDER_INFO.comisionTiendas} sobre el valor neto de las transacciones exitosas originadas a través de la plataforma, previa deducción de costos de pasarela e IVA.`,
        ],
      },
    ],
  },

  // 10. REGLAS PARA FUNDACIONES
  'reglas-fundaciones': {
    ...LEGAL_DOCS_REGISTRY['reglas-fundaciones'],
    sections: [
      {
        id: 'verificacion-esal',
        numeral: '1.',
        title: 'Verificación de Entidades Sin Ánimo de Lucro (ESAL)',
        paragraphs: [
          `Las organizaciones que deseen recibir donaciones de ropa a través de Style Radar deben demostrar su constitución legal como Entidad Sin Ánimo de Lucro (Fundación, Asociación o Corporación) con personería jurídica vigente ante la Cámara de Comercio o entidad gubernamental competente, y RUT con régimen tributario especial o no contribuyente.`,
        ],
      },
      {
        id: 'prohibicion-reventa',
        numeral: '2.',
        title: 'Prohibición Estricta de Reventa Comercial',
        paragraphs: [
          `Las prendas recolectadas mediante el módulo de donaciones de Style Radar tienen un propósito exclusivamente social y humanitario. Queda expresamente prohibida la reventa lucrativa de la ropa donada en mercados secundarios o tiendas físicas con fines de lucro personal o corporativo.`,
        ],
      },
      {
        id: 'certificados-donacion',
        numeral: '3.',
        title: 'Trazabilidad y Certificados de Donación',
        paragraphs: [
          `Las fundaciones aliadas deberán reportar en la plataforma la confirmación de recepción y el destino final de los lotes de ropa donados por la comunidad. Así mismo, expedirán los certificados de donación previstos en el Estatuto Tributario colombiano para los donantes que lo requieran y califiquen conforme a la ley.`,
        ],
      },
    ],
  },

  // 11. REGLAS DE SEGUNDA VIDA
  'segunda-vida': {
    ...LEGAL_DOCS_REGISTRY['segunda-vida'],
    sections: [
      {
        id: 'descripcion-honesta',
        numeral: '1.',
        title: 'Descripción Honesta y Clasificación del Estado de la Prenda',
        paragraphs: [
          `El programa de «Segunda Vida» promueve la moda circular y el reúso de ropa usada en Bogotá. Quien publique una prenda usada tiene la obligación legal de describir con absoluta veracidad su estado real, clasificándola estrictamente según los siguientes estándares:`,
        ],
        bullets: [
          `Como nuevo: Prenda sin uso evidente, sin manchas, olores ni desgaste, con o sin etiqueta original.`,
          `Muy bueno: Prenda con uso moderado pero perfectamente cuidada, sin roturas, motas pronunciadas ni decoloraciones.`,
          `Con detalles: Prenda funcional pero con signos visibles de uso (pequeña costura arreglada, botón reemplazado o ligero desteñido), los cuales DEBEN ser fotografiados en primer plano y explicados detalladamente.`,
        ],
      },
      {
        id: 'fotos-reales',
        numeral: '2.',
        title: 'Fotografías Reales sin Filtros Engañosos',
        paragraphs: [
          `Las publicaciones de ropa usada deben incluir fotografías propias y reales tomadas con luz natural o clara. Queda estrictamente prohibido usar imágenes de catálogo oficial de marcas comerciales o aplicar filtros que alteren el color real o disimulen defectos de la tela.`,
        ],
      },
      {
        id: 'higiene-prohibiciones',
        numeral: '3.',
        title: 'Normas de Higiene y Prendas Excluidas',
        paragraphs: [
          `Toda prenda de segunda vida debe ser entregada debidamente lavada e higienizada. Por razones de salubridad pública y bioseguridad, está prohibida la venta de ropa interior usada, vestidos de baño usados o prendas contaminadas con sustancias peligrosas.`,
        ],
      },
    ],
  },

  // 12. NORMAS DE COMUNIDAD
  'normas-comunidad': {
    ...LEGAL_DOCS_REGISTRY['normas-comunidad'],
    sections: [
      {
        id: 'convivencia',
        numeral: '1.',
        title: 'Principios de Respeto y Convivencia en la Moda Urbana',
        paragraphs: [
          `Style Radar es un punto de encuentro para amantes de la moda, diseñadores y tiendas de Bogotá. Fomentamos la creatividad, el diálogo constructivo y la diversidad cultural. No toleramos el acoso, los discursos de odio, la discriminación por motivos de género, raza, orientación sexual, religión o estrato socioeconómico en ninguna reseña, comentario o playlist.`,
        ],
      },
      {
        id: 'moderacion-denuncias',
        numeral: '2.',
        title: 'Moderación de Contenidos y Mecanismo de Denuncia',
        paragraphs: [
          `Los usuarios pueden denunciar cualquier contenido, playlist o fotografía sospechosa mediante el botón de reporte o escribiendo al canal de soporte. Nuestro equipo de moderación revisará la denuncia en un plazo de 24 a 48 horas y tomará las medidas oportunas (advertencia, eliminación del contenido o veto de la cuenta).`,
        ],
      },
    ],
  },

  // 13. PROBADOR VIRTUAL Y DATOS DE IMAGEN
  'probador-virtual-datos': {
    ...LEGAL_DOCS_REGISTRY['probador-virtual-datos'],
    sections: [
      {
        id: 'caracter-opcional',
        numeral: '1.',
        title: 'Carácter 100% Voluntario y Consentimiento Expreso',
        paragraphs: [
          `El uso del Probador Virtual de prendas de Style Radar es completamente OPCIONAL. Ningún usuario está obligado a subir su fotografía o registrar sus medidas corporales para poder explorar el catálogo, localizar tiendas en el mapa o comprar productos en la plataforma.`,
          `Al hacer uso voluntario del probador y cargar una imagen personal, otorgas tu autorización previa, expresa e informada de manera separada e independiente para que dicha imagen sea procesada con el exclusivo fin de simular el ajuste visual de la prenda sobre tu figura.`,
        ],
      },
      {
        id: 'datos-sensibles-tratamiento',
        numeral: '2.',
        title: 'Régimen de Datos Sensibles y Datos Biométricos',
        paragraphs: [
          `De conformidad con el artículo 6 de la Ley 1581 de 2012, las imágenes faciales o corporales pueden ser catalogadas como datos sensibles. Por tal motivo, Style Radar garantiza que:`,
        ],
        bullets: [
          `Las imágenes se utilizan únicamente para generar la previsualización del atuendo durante tu sesión.`,
          `NUNCA utilizaremos tu fotografía personal con fines comerciales, de marketing, ni la cederemos a terceros anunciantes sin tu permiso explícito.`,
          `Las imágenes cargadas son procesadas en entornos aislados y se programan para su eliminación automática o cuando tú decidas pulsar el botón de borrar foto en tu perfil.`,
        ],
      },
      {
        id: 'derecho-borrado',
        numeral: '3.',
        title: 'Derecho de Eliminación Inmediata de Imágenes',
        paragraphs: [
          `Puedes suprimir tus fotos o siluetas corporales en cualquier momento desde tu panel de usuario o enviando una solicitud a ${PROVIDER_INFO.correoDatos}. Una vez recibida la orden, los archivos serán eliminados definitivamente de nuestros servidores de almacenamiento temporal.`,
        ],
      },
    ],
  },

  // 14. PROPIEDAD INTELECTUAL
  'propiedad-intelectual': {
    ...LEGAL_DOCS_REGISTRY['propiedad-intelectual'],
    sections: [
      {
        id: 'derechos-marca',
        numeral: '1.',
        title: 'Titularidad de Marcas, Diseños y Código Fuente',
        paragraphs: [
          `La marca Style Radar, logotipos, elementos gráficos, arquitectura de software, código fuente, interfaces visuales y bases de datos son propiedad exclusiva de ${PROVIDER_INFO.razonSocial} o se encuentran licenciados a esta, protegidos por la Decisión Andina 486 (Régimen Común sobre Propiedad Industrial) y la Ley 23 de 1982 sobre Derechos de Autor.`,
          `Las marcas registradas, nombres comerciales, logos y fotografías de prendas exhibidas por tiendas aliadas pertenecen a sus respectivos titulares, quienes autorizan a Style Radar una licencia no exclusiva para su difusión en la plataforma.`,
        ],
      },
      {
        id: 'imagenes-digitales',
        numeral: '2.',
        title: 'Aviso sobre Imágenes Digitalmente Generadas o Editadas',
        paragraphs: [
          `En cumplimiento del deber de transparencia, informamos que ciertas imágenes de apoyo gráfico, banners conceptuales o modelos visuales en la plataforma han sido generados o intervenidos con herramientas de diseño digital e inteligencia artificial, o corresponden a personas que han otorgado su consentimiento expreso de cesión de imagen con fines editoriales.`,
        ],
      },
    ],
  },

  // 15. USO ACEPTABLE Y SEGURIDAD
  'uso-aceptable': {
    ...LEGAL_DOCS_REGISTRY['uso-aceptable'],
    sections: [
      {
        id: 'conductas-prohibidas',
        numeral: '1.',
        title: 'Conductas Prohibidas en la Plataforma',
        paragraphs: [
          `El usuario se compromete a hacer uso de Style Radar de conformidad con la ley y las buenas costumbres. Queda terminantemente prohibido:`,
        ],
        bullets: [
          `Vulnerar medidas de seguridad o intentar acceder sin autorización a servidores, bases de datos o cuentas de terceros.`,
          `Realizar minería de datos, scraping automático, rastreo con bots o recolección masiva de catálogos y precios.`,
          `Distribuir virus, malware o cualquier código informático dañino.`,
          `Publicar contenido falso, difamatorio, fraudulento o engañoso.`,
        ],
      },
      {
        id: 'custodia-claves',
        numeral: '2.',
        title: 'Custodia de Claves de Acceso y Verificación OTP',
        paragraphs: [
          `El usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso. Cualquier operación realizada con sus credenciales se presumirá efectuada por el titular de la cuenta, salvo que hubiere notificado oportunamente a Style Radar sobre la pérdida o sospecha de sustracción de su clave.`,
        ],
      },
    ],
  },

  // 16. PROMOCIONES Y DESCUENTOS
  'promociones-descuentos': {
    ...LEGAL_DOCS_REGISTRY['promociones-descuentos'],
    sections: [
      {
        id: 'reglas-promocionales',
        numeral: '1.',
        title: 'Condiciones Generales de Promociones, Rebajas y Cupones',
        paragraphs: [
          `Toda actividad promocional, cupón de descuento, liquidación o rebaja comercial publicada en Style Radar se rige por las disposiciones del Estatuto del Consumidor (Ley 1480 de 2011) y las instrucciones de la Circular Única de la SIC.`,
          `Las promociones tienen una vigencia temporal determinada o hasta agotar el inventario destinado a la campaña. En caso de agotarse las unidades disponibles antes del vencimiento del plazo, la oferta cesará automáticamente.`,
        ],
      },
      {
        id: 'letra-pequena-plantilla',
        numeral: '2.',
        title: 'Plantilla Estandarizada de Términos Legales (Letra Pequeña)',
        paragraphs: [
          `Para garantizar transparencia absoluta con el consumidor, todas las piezas publicitarias y banners con descuentos en Style Radar incluyen la siguiente leyenda legal aplicable:`,
        ],
        alertNote:
          'PROMOCIÓN VÁLIDA DEL [FECHA_INICIO] AL [FECHA_FIN] O HASTA AGOTAR EXISTENCIAS EN TIENDAS PARTICIPANTES DE BOGOTÁ. MÍNIMO [CANTIDAD_UNIDADES] UNIDADES DISPONIBLES POR REFERENCIA. APLICA EXCLUSIVAMENTE PARA COMPRAS REALIZADAS A TRAVÉS DE STYLERADAR O EN TIENDAS FÍSICAS ALIADAS IDENTIFICADAS CON EL DISTINTIVO DE LA CAMPAÑA. NO ACUMULABLE CON OTROS DESCUENTOS, CUPONES O PROMOCIONES VIGENTES. IMÁGENES DE REFERENCIA. CONSULTA TÉRMINOS Y CONDICIONES COMPLETOS EN WWW.STYLERADAR.CO/LEGAL/PROMOCIONES-DESCUENTOS.',
      },
    ],
  },

  // 17. CENTRO DE AYUDA Y ACCESIBILIDAD
  'centro-ayuda': {
    ...LEGAL_DOCS_REGISTRY['centro-ayuda'],
    sections: [
      {
        id: 'faq-compradores',
        numeral: '1.',
        title: 'Preguntas Frecuentes de Compradores',
        paragraphs: [
          `¿Cómo se pagan los planes y suscripciones? El pago se hace con Mercado Pago`,
          `¿Cómo funciona el probador virtual? Puedes probar prendas sobre un maniquí base predefinido, o subir de forma 100% voluntaria tu propia foto para una experiencia personalizada protegida por nuestra Política de Privacidad.`,
          `¿Puedo devolver una prenda si no me queda? Sí. Cuentas con 5 días hábiles desde la entrega para ejercer el Derecho de Retracto, siempre que la prenda esté nueva y no sea ropa interior o de uso íntimo.`,
        ],
      },
      {
        id: 'faq-tiendas-fundaciones',
        numeral: '2.',
        title: 'Preguntas Frecuentes de Tiendas y Fundaciones',
        paragraphs: [
          `¿Cómo vinculo mi tienda local? Consulta nuestros planes para comercios, completa el registro con tu RUT y datos de Cámara de Comercio. Nuestro equipo validará tu cuenta en menos de 48 horas hábiles.`,
          `¿Cómo dona la gente ropa a fundaciones? Los usuarios pueden agendar entregas en puntos aliados o coordinar recolecciones de prendas en buen estado, las cuales son verificadas y certificadas por las fundaciones aliadas.`,
        ],
      },
      {
        id: 'accesibilidad-wcag',
        numeral: '3.',
        title: 'Compromiso de Accesibilidad Web (WCAG 2.1 AA)',
        paragraphs: [
          `Style Radar está comprometido con la accesibilidad digital para personas con discapacidad visual, motriz o cognitiva. Diseñamos nuestras interfaces con contrastes conformes al nivel AA, compatibilidad con lectores de pantalla, navegación por teclado y diseño adaptable a dispositivos móviles.`,
        ],
      },
    ],
  },

  // 18. MAPA LEGAL
  'mapa-legal': {
    ...LEGAL_DOCS_REGISTRY['mapa-legal'],
    sections: [
      {
        id: 'directorio',
        numeral: '1.',
        title: 'Directorio Maestro de Cumplimiento Legal y Normativo',
        paragraphs: [
          `En este espacio centralizado encontrarás todos los documentos legales, reglamentos, contratos y políticas que rigen el ecosistema digital de Style Radar en Colombia. Te invitamos a consultar cada sección según tu rol e interés.`,
        ],
      },
    ],
  },
}
