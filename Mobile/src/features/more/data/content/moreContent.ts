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
    description: 'Aromas para acompañar tus momentos cotidianos. Conoce nuestra colección de productos aromáticos de uso personal y encuentra tu próxima pausa.',
    mission: 'Ofrecer productos aromáticos de uso personal con información clara, una experiencia de compra sencilla y atención responsable, para que cada persona elija de manera informada.',
    vision: 'Construir una marca reconocida por el cuidado de sus productos, la claridad de su información y la confianza de su comunidad, con un servicio cada vez más accesible.',
    values: [
      { title: 'Transparencia', body: 'Información clara para elegir con confianza.' },
      { title: 'Responsabilidad', body: 'Atención cuidadosa a cada consulta y pedido.' },
      { title: 'Cuidado', body: 'Respeto por las personas y sus datos.' },
      { title: 'Mejora continua', body: 'Escuchamos para mejorar productos y servicio.' },
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
