export type NoticesPreviewScene = 'inbox' | 'empty' | 'error';
export type NoticesPreviewFilter = 'all' | 'unread';

export type NoticePreview = Readonly<{
  id: string;
  title: string;
  message: string;
  dateLabel: string;
  kind: 'order' | 'account';
  read: boolean;
  reference?: string;
}>;

export type NoticesPreview =
  | Readonly<{ status: 'ready'; items: readonly NoticePreview[] }>
  | Readonly<{ status: 'error'; message: string }>;
