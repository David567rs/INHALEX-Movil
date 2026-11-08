import { useCallback, useEffect, useRef, useState } from 'react';
import type { MoreContent } from '../../domain/models/MoreContent';
import type { LoadMoreContent } from '../../domain/useCases/loadMoreContent';

export function useMoreViewModel(loadContent: LoadMoreContent) {
  const [content, setContent] = useState<MoreContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const mounted = useRef(false);
  const request = useRef(0);

  const requestContent = useCallback(() => {
    const currentRequest = ++request.current;
    return Promise.resolve().then(loadContent).then((nextContent) => {
      if (!mounted.current || currentRequest !== request.current) return;
      setContent(nextContent.content);
      setMessage(nextContent.warning);
    }, () => {
      if (!mounted.current || currentRequest !== request.current) return;
      setMessage('No pudimos abrir esta información. Inténtalo de nuevo.');
    }).finally(() => {
      if (mounted.current && currentRequest === request.current) setIsLoading(false);
    });
  }, [loadContent]);

  useEffect(() => {
    mounted.current = true;
    void requestContent();
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, [requestContent]);

  function reload() {
    if (isLoading) return;
    setIsLoading(true);
    setMessage(null);
    void requestContent();
  }

  function toggleFaq(id: string) {
    setOpenFaqId((current) => current === id ? null : id);
  }

  return { content, isLoading, message, openFaqId, reload, toggleFaq };
}
