import type { MoreContent } from '../../domain/models/MoreContent';
import { legalDrafts } from './legalDrafts';

// FAQ adapted from the original web system; provenance and wording decisions in docs/DISENO-MAS-CUENTA.md.
export const moreContent: MoreContent = {
  contact: {
    email: 'danielcruzhernandezinhalex@gmail.com',
    phone: '+52 771 203 4573',
    phoneUri: 'tel:+527712034573',
    address: 'Palo de Rosa núm. 20, colonia Fovissste, Huejutla de Reyes, Hidalgo, C. P. 43000, México.',
  },
  company: {
    name: 'INHALEX S.A.S. de C.V.',
    description: 'Somos una empresa mexicana de productos aromáticos de uso personal, con sede en Huejutla de Reyes, Hidalgo. Unimos aromas, bienestar cotidiano y tecnología para estar más cerca de ti.',
    activity: 'Nos dedicamos al desarrollo y la comercialización de inhaladores aromáticos de uso personal. Nuestra colección reúne distintas líneas y aromas en un formato práctico y portátil. A través de nuestro sitio web y nuestra app, facilitamos la elección de productos y el seguimiento de cada pedido.',
    mission: 'Acompañar el bienestar cotidiano de las personas con productos aromáticos de uso personal, información clara y atención cercana. Integramos la innovación en nuestros productos y servicios digitales para que elegir un aroma, realizar un pedido y consultar su progreso sea una experiencia sencilla y confiable.',
    vision: 'Consolidarnos como una marca mexicana de referencia en productos aromáticos de uso personal, reconocida por su calidad, innovación y compromiso con las personas. Aspiramos a crecer en México y llegar a nuevas comunidades mediante una experiencia que combine cercanía, confianza y tecnología accesible.',
    innovation: {
      description: 'La innovación también está en cómo te acompañamos. Nuestro sitio web y nuestra app reúnen herramientas para elegir, organizar tus compras y mantenerte informado.',
      benefits: [
        { title: 'Encuentra tu aroma', body: 'Explora el catálogo por líneas, busca productos, consulta sus características y guarda tus favoritos.' },
        { title: 'Sigue tu pedido', body: 'Organiza tu bolsa y tus direcciones, consulta el historial, sigue el estado del pedido y confirma su recepción.' },
        { title: 'Tu experiencia cuenta', body: 'Consulta avisos y reseñas, y comparte tu opinión sobre productos de compras completadas. Escuchar a nuestra comunidad guía la mejora continua.' },
      ],
    },
    values: [
      { title: 'Innovación', body: 'Buscamos mejorar nuestros productos y servicios con ideas y herramientas tecnológicas que aporten utilidad a la vida cotidiana.' },
      { title: 'Calidad', body: 'Cuidamos la presentación de nuestros productos, la claridad de su información y la atención que recibe cada cliente.' },
      { title: 'Salud y bienestar', body: 'Promovemos el autocuidado y una elección informada de productos aromáticos. Su uso no sustituye la atención médica profesional.' },
      { title: 'Confianza y credibilidad', body: 'Construimos relaciones con comunicación honesta, atención responsable y respeto por las personas y sus datos.' },
    ],
  },
  faqs: [
    { id: 'linea', question: '¿Cómo elijo la línea adecuada?', answer: 'Explora las líneas del Catálogo. Cada una reúne aromas para que compares sus características y encuentres el que prefieras.' },
    { id: 'imagenes', question: '¿Qué muestran las imágenes del catálogo?', answer: 'Las imágenes sirven como referencia visual de cada aroma. En el detalle puedes consultar la presentación y la información del producto.' },
    { id: 'atencion-medica', question: '¿Los productos sustituyen la atención médica?', answer: 'No. Son productos aromáticos de uso personal y no sustituyen la atención médica. Si tienes una condición de salud, consulta a un profesional.' },
    { id: 'politicas', question: '¿Dónde consulto las políticas y los términos?', answer: 'En Más encontrarás la Política de privacidad y los Términos y condiciones.' },
    { id: 'contactar', question: '¿Puedo contactar a alguien antes de comprar?', answer: 'Sí. En Más → Contacto puedes escribir por correo o llamar para consultar sobre líneas, aromas y pedidos.' },
    { id: 'otra-consulta', question: '¿Qué hago si no encuentro mi respuesta?', answer: 'Escríbenos a danielcruzhernandezinhalex@gmail.com o abre Contacto desde Más.' },
  ],
  documents: legalDrafts,
};
