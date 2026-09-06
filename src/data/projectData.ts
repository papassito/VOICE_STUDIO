import { ProjectConfig, VoiceProfile } from '../types';

export const PROJECTS: Record<string, ProjectConfig> = {
  'nuestraparroquia': {
    id: 'nuestraparroquia',
    name: 'NuestraParroquia.online',
    type: 'cliente',
    domain: 'nuestraparroquia.online',
    tagline: 'Cliente de la Agencia • Plataforma Pastoral y Comunitaria',
    description: 'Aislamiento de contenidos religiosos, homilías, lecturas bíblicas y avisos parroquiales con perfil autorizado del Padre X y lectores parroquiales.',
    themeColor: '#7c3aed', // Purple liturgical
    accentColor: '#a855f7',
    iconName: 'Church',
    isolationToken: 'TENANT-NUESTRAPARROQUIA-SEC-7782',
    allowedRoles: ['Párroco & Guía Espiritual', 'Lectora Litúrgica', 'Animador Comunitario'],
    defaultFormat: 'WAV',
    presets: [
      {
        title: 'Reflexión del Evangelio Dominical',
        text: 'Hermanos y hermanas, que la paz esté con todos ustedes. En este domingo abrimos el corazón a la escucha de la palabra que renueva nuestra esperanza y fortalece a nuestras familias.',
        suggestedVoice: 'Padre X',
        category: 'Homilía'
      },
      {
        title: 'Aviso Parroquial: Encuentro Comunitario',
        text: 'Les recordamos que este sábado a las seis de la tarde tendremos nuestra asamblea de pastoral en el salón principal. Los esperamos con alegría para compartir este momento fraterno.',
        suggestedVoice: 'Lectora Parroquial',
        category: 'Aviso'
      },
      {
        title: 'Bendición de la Jornada',
        text: 'Que el Señor ilumine cada uno de sus pasos, bendiga su trabajo y cuide a sus hogares durante este día. Que su gracia permanezca siempre con ustedes.',
        suggestedVoice: 'Padre X',
        category: 'Bendición'
      }
    ]
  },
  'comunidad-radio': {
    id: 'comunidad-radio',
    name: 'Comunidad de Radio',
    type: 'cliente',
    domain: 'comunidaderadio.com',
    tagline: 'Cliente de la Agencia • Cadena Radial y Streaming 24/7',
    description: 'Aislamiento de señal radial, noticieros, identificación horaria de cabina, avances y magacines con Voz B y equipo de conducción.',
    themeColor: '#0284c7', // Sky broadcast
    accentColor: '#38bdf8',
    iconName: 'Radio',
    isolationToken: 'TENANT-COMUNIDADRADIO-SEC-9901',
    allowedRoles: ['Locutor Master de Cadena', 'Conductora FM Nocturna', 'Cronista de Noticias'],
    defaultFormat: 'STREAM',
    presets: [
      {
        title: 'Top of the Hour: Identificador Central',
        text: 'Transmitiendo en simultáneo para toda la red de repetidoras y plataforma digital. Señal satelital activa. Son las doce en punto.',
        suggestedVoice: 'Voz B (Máster Cadena)',
        category: 'Identificador'
      },
      {
        title: 'Boletín de Emergencia y Tráfico',
        text: 'Alerta vial en el corredor principal. Tráfico desviado por trabajos en calzada. Recomendamos tomar vías perimetrales. Actualizamos en cinco minutos.',
        suggestedVoice: 'Cronista Informativo',
        category: 'Informativo'
      },
      {
        title: 'Presentación de Magacín Nocturno',
        text: 'Bienvenidos a la sintonía de medianoche en Comunidad de Radio. Luces bajas, buen sonido y las mejores historias antes de terminar el día.',
        suggestedVoice: 'Conductora FM Nocturna',
        category: 'Magacín'
      }
    ]
  },
  'locucion': {
    id: 'locucion',
    name: 'Locución',
    type: 'vertical',
    domain: 'locucion.agency.klik',
    tagline: 'Vertical de Agencia • Locución Comercial e Institucional',
    description: 'Servicio de locución profesional para marcas, doblajes institucionales y manifiestos corporativos con Voz C y elenco comercial.',
    themeColor: '#4f46e5', // Indigo
    accentColor: '#818cf8',
    iconName: 'Mic2',
    isolationToken: 'TENANT-LOCUCION-SEC-4412',
    allowedRoles: ['Voz Institucional & Corporativa', 'Locutor Comercial Versátil', 'Doblaje'],
    defaultFormat: 'WAV',
    presets: [
      {
        title: 'Manifiesto Corporativo de Marca',
        text: 'Creemos en las ideas que transforman realidades. En el poder de innovar con propósito y avanzar con visión hacia el futuro.',
        suggestedVoice: 'Voz C (Locutor Institucional)',
        category: 'Institucional'
      },
      {
        title: 'Mención Comercial de Prestigio',
        text: 'Calidad inalterable, respaldo que perdura en el tiempo. La elección indiscutible para quienes exigen lo mejor en cada detalle.',
        suggestedVoice: 'Locutor Comercial Versátil',
        category: 'Comercial'
      }
    ]
  },
  'publicidad': {
    id: 'publicidad',
    name: 'Publicidad',
    type: 'vertical',
    domain: 'publicidad.agency.klik',
    tagline: 'Vertical de Agencia • Cuñas, Promos y Jingles Hablados',
    description: 'Producción de cuñas de alto impacto radial de 15s y 30s, promociones de alta energía y llamados a la acción de gran pegada (punch).',
    themeColor: '#ea580c', // Orange punch
    accentColor: '#fb923c',
    iconName: 'Megaphone',
    isolationToken: 'TENANT-PUBLICIDAD-SEC-5531',
    allowedRoles: ['Voz Comercial Impacto', 'Voz Promocional FM', 'Voz Ofertas'],
    defaultFormat: 'MP3',
    presets: [
      {
        title: 'Spot Comercial de Impacto (20s)',
        text: '¡Solo por este fin de semana! Descuentos irrepetibles en todas las sucursales. No dejes pasar esta oportunidad única. ¡Visítanos ya!',
        suggestedVoice: 'Voz Comercial de Impacto',
        category: 'Oferta'
      },
      {
        title: 'Promo Radial de Temporada',
        text: 'Siente el ritmo de las vacaciones con la mejor selección musical y los premios que solo nosotros tenemos para ti.',
        suggestedVoice: 'Voz Promocional FM',
        category: 'Promo'
      }
    ]
  },
  'narracion': {
    id: 'narracion',
    name: 'Narración',
    type: 'vertical',
    domain: 'narracion.agency.klik',
    tagline: 'Vertical de Agencia • Audiolibros, Documentales y Relatos',
    description: 'Lecturas prolongadas, modulación literaria, relatos inmersivos y divulgación científica con cadencia pausada e inteligibilidad perfecta.',
    themeColor: '#059669', // Emerald
    accentColor: '#34d399',
    iconName: 'BookOpen',
    isolationToken: 'TENANT-NARRACION-SEC-6624',
    allowedRoles: ['Narrador Documental', 'Narradora de Ficción', 'Relator Histórico'],
    defaultFormat: 'WAV',
    presets: [
      {
        title: 'Prólogo de Novela Histórica',
        text: 'Aquel invierno tardío cubrió de escarcha los valles del norte. El silencio solo era interrumpido por el paso distante de las carretas sobre la tierra endurecida.',
        suggestedVoice: 'Narrador Documental',
        category: 'Ficción'
      },
      {
        title: 'Cápsula de Divulgación Científica',
        text: 'A más de cuatrocientos kilómetros sobre nuestras cabezas, la estación espacial orbita la Tierra a veintiocho mil kilómetros por hora, presenciando dieciséis amaneceres cada día.',
        suggestedVoice: 'Narradora de Ficción',
        category: 'Documental'
      }
    ]
  },
  'podcast': {
    id: 'podcast',
    name: 'Podcast',
    type: 'vertical',
    domain: 'podcast.agency.klik',
    tagline: 'Vertical de Agencia • Cabina de Podcast, Intros y Outros',
    description: 'Voces coloquiales, estilo directo a condensador, intros de episodios y transiciones dinámicas para creadores de audio digital.',
    themeColor: '#db2777', // Pink
    accentColor: '#f472b6',
    iconName: 'Headphones',
    isolationToken: 'TENANT-PODCAST-SEC-1188',
    allowedRoles: ['Host Podcast Prime', 'Co-Host Conversacional', 'Voz de Cortinillas'],
    defaultFormat: 'MP3',
    presets: [
      {
        title: 'Intro de Episodio Semanal',
        text: 'Hola a todos y bienvenidos a un nuevo episodio. Hoy nos acompaña un invitado que nos revelará los secretos detrás de las producciones de audio más escuchadas del año.',
        suggestedVoice: 'Host Podcast Prime',
        category: 'Intro'
      },
      {
        title: 'Cierre y Créditos de Episodio',
        text: 'Gracias por acompañarnos. Recuerda suscribirte en tu plataforma favorita y dejar tus comentarios para el próximo episodio. ¡Hasta la próxima semana!',
        suggestedVoice: 'Voz de Cortinillas',
        category: 'Outro'
      }
    ]
  },
  'otros-proyectos': {
    id: 'otros-proyectos',
    name: 'Otros Proyectos',
    type: 'proyecto',
    domain: 'otros.agency.klik',
    tagline: 'Proyectos y Clientes Adicionales de la Agencia',
    description: 'Arquitectura abierta para aprovisionar nuevos clientes, marcas y proyectos de locución con total aislamiento sin modificar el núcleo.',
    themeColor: '#475569', // Slate
    accentColor: '#94a3b8',
    iconName: 'FolderPlus',
    isolationToken: 'TENANT-OTROS-SEC-8899',
    allowedRoles: ['Voz Neutra Universal', 'Voz Multiuso'],
    defaultFormat: 'WAV',
    presets: [
      {
        title: 'Prueba de Compatibilidad de Voces',
        text: 'Verificando motor de síntesis y enrutamiento aislado para proyecto personalizado en VOICE STUDIO by KLIK.',
        suggestedVoice: 'Voz Neutra Universal',
        category: 'Prueba'
      }
    ]
  }
};

export const INITIAL_VOICES: VoiceProfile[] = [
  // 1. NuestraParroquia.online (Padre X y equipo pastoral)
  {
    id: 'voice-padre-x',
    projectId: 'nuestraparroquia',
    clientName: 'NuestraParroquia.online',
    category: 'clonada',
    name: 'Padre X',
    role: 'Párroco & Guía Espiritual',
    description: 'Voz clonada solemne, pastoral, cercana y profunda para homilías, lecturas de evangelio y bendiciones comunitarias.',
    geminiVoice: 'Charon',
    tone: 'Solemne, pastoral, pausado y sereno',
    pitch: 0.92,
    speed: 0.92,
    similarityScore: 99.4,
    isAuthorized: true,
    tags: ['Clonada', 'Solemne', 'Homilía', 'Pastoral']
  },
  {
    id: 'voice-lectora-parroquia',
    projectId: 'nuestraparroquia',
    clientName: 'NuestraParroquia.online',
    category: 'nueva',
    name: 'Lectora Parroquial',
    role: 'Lecturas y Salmos',
    description: 'Voz sintética nueva con timbre diáfano y respetuoso para salmos, lecturas y avisos comunitarios.',
    geminiVoice: 'Kore',
    tone: 'Cálido, respetuoso y diáfano',
    pitch: 1.0,
    speed: 0.95,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Liturgia', 'Cálida', 'Avisos']
  },

  // 2. Comunidad de Radio (Voz B y equipo de cabina)
  {
    id: 'voice-voz-b-master',
    projectId: 'comunidad-radio',
    clientName: 'Comunidad de Radio',
    category: 'clonada',
    name: 'Voz B (Máster Cadena)',
    role: 'Locutor Master de Cadena',
    description: 'Voz clonada barítono institucional para identificación de red, aperturas horarias y noticiero central.',
    geminiVoice: 'Charon',
    tone: 'Imponente, autoritario y de alto impacto radial',
    pitch: 0.90,
    speed: 0.98,
    similarityScore: 99.5,
    isAuthorized: true,
    tags: ['Clonada', 'Barítono', 'Cadena', 'Master']
  },
  {
    id: 'voice-fm-nocturna',
    projectId: 'comunidad-radio',
    clientName: 'Comunidad de Radio',
    category: 'clonada',
    name: 'Conductora FM Nocturna',
    role: 'Conducción de Magacín Nocturno',
    description: 'Voz aterciopelada y cercana para programas musicales y de reflexión nocturna.',
    geminiVoice: 'Kore',
    tone: 'Aterciopelado, íntimo y empático',
    pitch: 1.02,
    speed: 0.94,
    similarityScore: 98.9,
    isAuthorized: true,
    tags: ['Clonada', 'FM Cálida', 'Nocturno', 'Música']
  },
  {
    id: 'voice-cronista-news',
    projectId: 'comunidad-radio',
    clientName: 'Comunidad de Radio',
    category: 'nueva',
    name: 'Cronista Informativo',
    role: 'Reportero y Flashes Urgentes',
    description: 'Articulación veloz y periodística para despachos de última hora y móviles en vivo.',
    geminiVoice: 'Fenrir',
    tone: 'Ágil, incisivo y directo',
    pitch: 0.98,
    speed: 1.08,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Noticiero', 'Flash', 'Urgente']
  },

  // 3. Locución (Voz C e institucional)
  {
    id: 'voice-voz-c-institucional',
    projectId: 'locucion',
    clientName: 'Locución',
    category: 'nueva',
    name: 'Voz C (Locutor Institucional)',
    role: 'Voz Institucional & Corporativa',
    description: 'Voz neutra de gran prestigio y credibilidad para manifiestos de marca y locución oficial.',
    geminiVoice: 'Zephyr',
    tone: 'Seguro, elegante, prestigioso y articulado',
    pitch: 0.98,
    speed: 1.0,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Institucional', 'Corporativo', 'Prestigio']
  },
  {
    id: 'voice-locutor-versatil',
    projectId: 'locucion',
    clientName: 'Locución',
    category: 'clonada',
    name: 'Locutor Comercial Versátil',
    role: 'Doblaje y Locución Comercial',
    description: 'Capacidad camaleónica para múltiples estilos de locución y menciones corporativas.',
    geminiVoice: 'Puck',
    tone: 'Dinámico, persuasivo y modulado',
    pitch: 1.02,
    speed: 1.02,
    similarityScore: 99.1,
    isAuthorized: true,
    tags: ['Clonada', 'Comercial', 'Doblaje', 'Versátil']
  },

  // 4. Publicidad
  {
    id: 'voice-promo-impacto',
    projectId: 'publicidad',
    clientName: 'Publicidad',
    category: 'nueva',
    name: 'Voz Comercial de Impacto',
    role: 'Cuñas y Promociones Radiales',
    description: 'Voz de alta energía (punch) para spots de 15 a 30 segundos, promociones y barridos.',
    geminiVoice: 'Puck',
    tone: 'Enérgico, comercial, vibrante y contundente',
    pitch: 1.05,
    speed: 1.15,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Punch', 'Spot 20s', 'Alta Energía']
  },
  {
    id: 'voice-promo-elegante',
    projectId: 'publicidad',
    clientName: 'Publicidad',
    category: 'clonada',
    name: 'Voz Comercial Premium',
    role: 'Marcas de Lujo & Gourmet',
    description: 'Estilo sofisticado, pausado y sugerente para campañas publicitarias premium.',
    geminiVoice: 'Kore',
    tone: 'Sofisticado, seductor y elegante',
    pitch: 0.98,
    speed: 0.94,
    similarityScore: 98.7,
    isAuthorized: true,
    tags: ['Clonada', 'Premium', 'Seductor', 'Marcas']
  },

  // 5. Narración
  {
    id: 'voice-narrador-doc',
    projectId: 'narracion',
    clientName: 'Narración',
    category: 'clonada',
    name: 'Narrador Documental',
    role: 'Audiolibros y Crónicas',
    description: 'Voz de gran resonancia, idónea para textos largos, documentales y divulgación.',
    geminiVoice: 'Charon',
    tone: 'Narrativo, pausado, reflexivo y envolvente',
    pitch: 0.94,
    speed: 0.93,
    similarityScore: 99.3,
    isAuthorized: true,
    tags: ['Clonada', 'Audiolibros', 'Documental', 'Profundo']
  },
  {
    id: 'voice-narradora-ficcion',
    projectId: 'narracion',
    clientName: 'Narración',
    category: 'nueva',
    name: 'Narradora de Ficción',
    role: 'Radioteatro y Cuentos',
    description: 'Rica en matices emocionales para caracterización de personajes e historias.',
    geminiVoice: 'Zephyr',
    tone: 'Expresivo, misterioso e inmersivo',
    pitch: 1.03,
    speed: 0.98,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Ficción', 'Cuentos', 'Emocional']
  },

  // 6. Podcast
  {
    id: 'voice-host-podcast',
    projectId: 'podcast',
    clientName: 'Podcast',
    category: 'nueva',
    name: 'Host Podcast Prime',
    role: 'Conductor de Podcast y Conversaciones',
    description: 'Estilo conversacional fresco, directo a micrófono de condensador sin filtro.',
    geminiVoice: 'Zephyr',
    tone: 'Coloquial, cercano, inteligente y relajado',
    pitch: 1.02,
    speed: 1.04,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Podcast', 'Host', 'Conversacional']
  },
  {
    id: 'voice-intro-outro',
    projectId: 'podcast',
    clientName: 'Podcast',
    category: 'clonada',
    name: 'Voz de Cortinillas & Intros',
    role: 'Branding Sonoro de Episodios',
    description: 'Firma sonora para bienvenida, créditos de cierre y avisos de patrocinio.',
    geminiVoice: 'Puck',
    tone: 'Brillante, rítmico y memorable',
    pitch: 1.0,
    speed: 1.05,
    similarityScore: 98.9,
    isAuthorized: true,
    tags: ['Clonada', 'Cortinillas', 'Intro', 'Outro']
  },

  // 7. Otros Proyectos
  {
    id: 'voice-neutra-universal',
    projectId: 'otros-proyectos',
    clientName: 'Otros Proyectos',
    category: 'nueva',
    name: 'Voz Neutra Universal',
    role: 'Proyectos Personalizados',
    description: 'Voz multipropósito de balance fonético exacto para cualquier nuevo cliente o proyecto.',
    geminiVoice: 'Charon',
    tone: 'Equilibrado, transparente y adaptable',
    pitch: 1.0,
    speed: 1.0,
    similarityScore: 100,
    isAuthorized: true,
    tags: ['Nueva', 'Multipropósito', 'Aislada']
  }
];

// Default sample scripts for Scanner and Script Playback per client/vertical
export const DEFAULT_RADIO_SCRIPTS = [
  {
    id: 'script-parroquia',
    title: 'Liturgia Dominical y Mensaje Parroquial',
    genre: 'Pastoral / Parroquial',
    clientId: 'nuestraparroquia',
    text: `[SFX: Campanadas suaves de fondo]
[PADRE X]: Queridos hermanos y hermanas de NuestraParroquia.online, que la paz del Señor reine en sus corazones y en cada uno de sus hogares.
[LECTORA PARROQUIAL]: Compartimos la lectura de hoy: Dichosos los que trabajan por la paz, porque ellos serán llamados hijos de Dios.
[PADRE X]: Que estas palabras alumbren nuestra semana. Les imparto la bendición: En el nombre del Padre, del Hijo y del Espíritu Santo. Amén.`
  },
  {
    id: 'script-comunidad-radio',
    title: 'Avance Informativo y Conexión de Cadena 24/7',
    genre: 'Noticiero de Cabina',
    clientId: 'comunidad-radio',
    text: `[SFX: Ráfaga de urgencia y golpe metálico de estación]
[VOZ B (MÁSTER CADENA)]: Esta es la señal informativa central de Comunidad de Radio. Son las doce en punto.
[CRONISTA INFORMATIVO]: Reportamos desde el centro de control vial. Todos los servicios de transporte operan con total normalidad tras las obras matutinas.
[VOZ B (MÁSTER CADENA)]: Agradecemos el despacho. Continuamos con nuestra transmisión ininterrumpida a través de todas las plataformas.`
  },
  {
    id: 'script-locucion-corporativa',
    title: 'Manifiesto de Marca y Locución Institucional',
    genre: 'Institucional',
    clientId: 'locucion',
    text: `[MÚSICA: Acorde de piano sutil y cuerdas envolventes]
[VOZ C (LOCUTOR INSTITUCIONAL)]: La verdadera innovación no persigue el ruido; construye solidez con cada decisión.
[LOCUTOR COMERCIAL VERSÁTIL]: Por más de dos décadas, hemos acompañado el crecimiento de las industrias que marcan el rumbo.
[VOZ C (LOCUTOR INSTITUCIONAL)]: Excelencia en cada detalle. Confianza que inspira el futuro.`
  },
  {
    id: 'script-publicidad-spot',
    title: 'Cuña de Estación y Oferta Relámpago (20s)',
    genre: 'Cuña Publicitaria',
    clientId: 'publicidad',
    text: `[SFX: Ráfaga sónica y barrido estéreo]
[VOZ COMERCIAL DE IMPACTO]: ¡Atención a esta oportunidad exclusiva de temporada!
[VOZ PROMOCIONAL FM]: Los mejores beneficios para renovar tu experiencia de sonido ya están disponibles.
[VOZ COMERCIAL DE IMPACTO]: No te quedes afuera. Ingresa hoy mismo y vive la diferencia.`
  },
  {
    id: 'script-narracion-doc',
    title: 'Capítulo 1: Los Secretos del Cosmos',
    genre: 'Narración / Audiolibro',
    clientId: 'narracion',
    text: `[SFX: Silencio profundo con tenue reverberación espacial]
[NARRADOR DOCUMENTAL]: En la inmensidad del espacio profundo, las estrellas no solo iluminan la noche; son los crisoles donde se forjan los elementos de la vida misma.
[NARRADORA DE FICCIÓN]: Cada átomo de nuestro cuerpo viajó a través de millones de años luz antes de posarse en esta pequeña esfera azul.`
  },
  {
    id: 'script-podcast-intro',
    title: 'Apertura de Podcast: Conexión Digital',
    genre: 'Podcast de Cabina',
    clientId: 'podcast',
    text: `[MÚSICA: Beat lo-fi de entrada en desvanecimiento]
[HOST PODCAST PRIME]: ¡Muy buenas a todos los que están conectados con nosotros! Hoy abordamos el impacto de la voz sintética y la clonación espectral en los medios contemporáneos.
[VOZ DE CORTINILLAS]: Un podcast original de VOICE STUDIO by KLIK. Comenzamos.`
  }
];
