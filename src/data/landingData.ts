export interface SlideItem {
  id: number
  src: string
  alt: string
  position?: string
}

export interface ProblemItem {
  number: string
  title: string
  description: string
}

export interface StepItem {
  number: string
  title: string
  description: string
}

export interface CategoryItem {
  name: string
  note: string
  image: string
}

export interface VideoStep {
  t: number
  label: string
}

export interface FilmItem {
  id: string
  tag: string
  label: string
  title: string
  dur: number
  description: string
  src: string
  poster: string
  steps: VideoStep[]
}

export interface ClothingCycleItem {
  label: string
  sub: string
  eyebrow: string
  title: string
  text: string
  image: string
  action: string
  to: string
  stat: string
  statLabel: string
}

export interface PlanItem {
  audience: string
  name: string
  price: string
  cadence: string
  items: string[]
  action: string
  to: string
  featured?: boolean
}

export interface NavCapsuleItem {
  label: string
  targetId: string
}

export const navCapsules: NavCapsuleItem[] = [
  { label: 'Categorías', targetId: 'categorias' },
  { label: 'Videos', targetId: 'videos' },
  { label: 'Ciclo de la ropa', targetId: 'ciclo' },
  { label: 'Planes', targetId: 'planes' },
  { label: 'Mapa', targetId: 'mapa' },
  { label: 'Quiénes somos', targetId: 'quienes-somos' },
]

export const heroSlides: SlideItem[] = [
  {
    id: 1,
    src: '/img/representantes/H1.png',
    alt: 'Representantes de StyleRadar en una calle de Bogotá al anochecer',
    position: '50% 35%',
  },
  {
    id: 2,
    src: '/img/representantes/H1.3.png',
    alt: 'Representantes de StyleRadar en el centro de Bogotá',
    position: '50% 35%',
  },
  {
    id: 3,
    src: '/img/representantes/H1.4.png',
    alt: 'Representantes de StyleRadar con capas y arquitectura urbana',
    position: '50% 35%',
  },
  {
    id: 4,
    src: '/img/representantes/H1.5.png',
    alt: 'Representantes de StyleRadar con moda urbana en Bogotá',
    position: '50% 35%',
  },
  {
    id: 5,
    src: '/img/landing/slide-2.jpg',
    alt: 'Mujer con gabardina beige cruzando la calle',
    position: '50% 25%',
  },
]

export const urbanProblems: ProblemItem[] = [
  {
    number: '01',
    title: 'Disponibilidad incierta',
    description: 'No sabes qué almacén tiene la prenda ni si todavía queda tu talla.',
  },
  {
    number: '02',
    title: 'Comercio local invisible',
    description: 'Las tiendas pequeñas casi no tienen presencia digital propia.',
  },
  {
    number: '03',
    title: 'Comprar sin probar',
    description: 'Comprar sin probarse aumenta las devoluciones y las compras por impulso.',
  },
  {
    number: '04',
    title: 'Ropa usada sin salida',
    description: 'La ropa en buen estado se acumula sin un canal simple para venderla o donarla.',
  },
]

export const howItWorksSteps: StepItem[] = [
  {
    number: '01',
    title: 'Elige tu estilo',
    description: 'Explora categorías y encuentra prendas que van contigo.',
  },
  {
    number: '02',
    title: 'Busca tu talla',
    description: 'Consulta inventario de tiendas locales y disponibilidad.',
  },
  {
    number: '03',
    title: 'Pruébatela',
    description: 'Mira la prenda en el maniquí o sobre tu propia foto.',
  },
  {
    number: '04',
    title: 'Sal con un plan',
    description: 'Guarda tu look y abre el mapa para encontrarla cerca.',
  },
]

export const categories: CategoryItem[] = [
  {
    name: 'Streetwear',
    note: 'Capas relajadas, tenis y prendas con carácter.',
    image: '/img/representantes/C2.png',
  },
  {
    name: 'Elegante',
    note: 'Sastrería contemporánea para moverte por la ciudad.',
    image: '/img/representantes/C1.png',
  },
  {
    name: 'Vintage',
    note: 'Texturas y piezas únicas que merecen otra historia.',
    image: '/img/representantes/C4.png',
  },
  {
    name: 'Techwear',
    note: 'Prendas utilitarias para acompañar tu ritmo.',
    image: '/img/representantes/C3.png',
  },
  {
    name: 'Esencial',
    note: 'Básicos bien elegidos, fáciles de combinar.',
    image: '/img/representantes/C5.png',
  },
]

export const videoFilms: FilmItem[] = [
  {
    id: 'playlists',
    tag: 'Playlists',
    label: 'Playlists',
    title: 'Arma tu playlist de estilo',
    dur: 63,
    description: 'Junta prendas de distintas tiendas en un solo look y guárdalo para después.',
    src: '/video/landing/video-1.mp4',
    poster: '/prototipo/assets/img/general/lk1.jpg',
    steps: [
      { t: 0, label: 'Abre Playlists desde el menú' },
      { t: 10, label: 'Mira los looks que arma la comunidad' },
      { t: 18, label: 'Agrega prendas de varias tiendas' },
      { t: 43, label: 'Guarda y comparte tu playlist' },
      { t: 52, label: 'Mira en el mapa dónde está cada prenda' },
    ],
  },
  {
    id: 'probador',
    tag: 'Probador',
    label: 'Probador',
    title: 'Pruébate la prenda antes de salir',
    dur: 63,
    description: 'Combina prendas del radar con el maniquí o prueba una visualización sobre tu foto.',
    src: '/video/landing/video-2.mp4',
    poster: '/prototipo/assets/img/general/ref.jpg',
    steps: [
      { t: 0, label: 'Elige una prenda del catálogo' },
      { t: 15, label: 'Sube tu foto o usa el maniquí' },
      { t: 29, label: 'Arma el look por capas' },
      { t: 45, label: 'Guarda el look o ve a la tienda' },
    ],
  },
  {
    id: 'nosotros',
    tag: 'Quiénes somos',
    label: 'Quiénes somos',
    title: 'Quiénes somos y por qué StyleRadar',
    dur: 59,
    description: 'Descubre tiendas bogotanas, encuentra tu talla y dale más vida a lo que ya tienes.',
    src: '/video/landing/video-3.mp4',
    poster: '/prototipo/assets/img/general/about.jpg',
    steps: [
      { t: 0, label: 'El problema de comprar moda en Bogotá' },
      { t: 15, label: 'Qué es StyleRadar' },
      { t: 30, label: 'El equipo detrás del proyecto' },
      { t: 44, label: 'Tiendas y fundaciones aliadas' },
    ],
  },
]

export const clothingCycle: ClothingCycleItem[] = [
  {
    label: 'Comprar local',
    sub: 'Boutiques y almacenes',
    eyebrow: 'Comprar · Tiendas locales',
    title: 'Moda independiente en los barrios de Bogotá',
    text: 'Conectamos boutiques y marcas emergentes. Consulta su inventario y encuentra prendas en tu talla antes de desplazarte.',
    image: '/img/representantes/Q2.png',
    action: 'Ver tiendas',
    to: '/catalogo',
    stat: '40+',
    statLabel: 'tiendas en el radar',
  },
  {
    label: 'Segunda vida',
    sub: 'Moda circular entre personas',
    eyebrow: 'Circular · Segunda vida',
    title: 'Tu ropa merece seguir viviendo nuevas historias',
    text: 'Publica prendas que ya no usas, ponles precio y acuerda la entrega directamente con compradores de tu ciudad.',
    image: '/img/representantes/Q1.png',
    action: 'Explorar prendas',
    to: '/segunda-mano',
    stat: '0%',
    statLabel: 'comisiones ocultas',
  },
  {
    label: 'Donar con propósito',
    sub: 'Fundaciones aliadas',
    eyebrow: 'Donar · Impacto social',
    title: 'Impacto social directo, con fundaciones de Bogotá',
    text: 'Consulta qué categorías necesitan y programa la recogida o entrega de tu donación.',
    image: '/img/representantes/Q3.png',
    action: 'Donar una prenda',
    to: '/donar',
    stat: '3',
    statLabel: 'fundaciones aliadas',
  },
]

export const pricingPlans: PlanItem[] = [
  {
    audience: 'Personas',
    name: 'Radar',
    price: '$0',
    cadence: 'gratis',
    items: [
      'Tiendas, mapa y playlists sin límite',
      'Wishlist de hasta 20 prendas',
      'Hasta 3 alertas de disponibilidad',
      'Probador con el maniquí',
      'Vender y donar en Segunda vida',
    ],
    action: 'Crear cuenta gratis',
    to: '/registro',
  },
  {
    audience: 'Personas',
    name: 'Radar+',
    price: '$14.900',
    cadence: 'al mes',
    items: [
      'Todo lo del plan Radar',
      'Probador con tu propia foto',
      'Alertas de disponibilidad sin límite',
      'Wishlist sin límite',
      'Cancela cuando quieras',
    ],
    action: 'Ver planes',
    to: '/planes',
    featured: true,
  },
  {
    audience: 'Tiendas',
    name: 'Tienda aliada',
    price: '$89.000',
    cadence: 'al mes',
    items: [
      'Primeros 30 días gratis',
      'Catálogo visible en radar y mapa',
      'Inventario por talla',
      'Estadísticas de visitas y guardados',
      'Colecciones propias',
    ],
    action: 'Registrar mi tienda',
    to: '/registro',
  },
  {
    audience: 'Fundaciones',
    name: 'Fundación aliada',
    price: '$0',
    cadence: 'siempre',
    items: [
      'Sin costo para fundaciones verificadas',
      'Recibe solicitudes de donación',
      'Coordina entregas por mensajes',
      'Publica misión y necesidades',
      'Estadísticas mensuales',
    ],
    action: 'Registrar mi fundación',
    to: '/registro',
  },
]

