export type MoreSectionId = 'preguntas-frecuentes' | 'contacto' | 'empresa' | 'privacidad' | 'terminos';

export interface MoreDocument {
  readonly id: 'privacidad' | 'terminos';
  readonly title: string;
  readonly updatedAt: string;
  readonly statusLabel: string;
  readonly sections: readonly { readonly title: string; readonly paragraphs: readonly string[] }[];
}

export interface MoreContent {
  readonly faqs: readonly { readonly id: string; readonly question: string; readonly answer: string }[];
  readonly contact: { readonly email: string; readonly phone: string; readonly phoneUri: string; readonly address: string };
  readonly company: {
    readonly name: string;
    readonly description: string;
    readonly mission: string;
    readonly vision: string;
    readonly values: readonly { readonly title: string; readonly body: string }[];
  };
  readonly documents: readonly MoreDocument[];
}
