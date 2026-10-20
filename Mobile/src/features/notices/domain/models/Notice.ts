export type NoticeType = 'order' | 'review' | 'promotion' | 'system' | 'report';
export type NoticeSeverity = 'info' | 'success' | 'warning';

export type Notice = Readonly<{
  id: string;
  title: string;
  message: string;
  type: NoticeType;
  severity: NoticeSeverity;
  createdAt: string | null;
  readAt: string | null;
}>;

/** unread belongs to the complete mailbox, while items contains only the latest twelve. */
export type NoticeInbox = Readonly<{
  items: readonly Notice[];
  unread: number;
}>;
