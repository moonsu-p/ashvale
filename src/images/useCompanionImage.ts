/**
 * 저장된 이미지 Blob 을 objectURL 로 렌더한다 — §11.4.
 * createObjectURL 결과를 저장하지 않고, 언마운트/키 변경 시 반드시 revokeObjectURL 한다.
 * 참조는 있는데 Blob 이 없으면 null 을 돌려주고(플레이스홀더 폴백), 오류를 띄우지 않는다.
 */

import { useEffect, useState } from 'react';
import { storage } from '@/storage';

export function useCompanionImage(key: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (!key) {
      setUrl(null);
      return;
    }

    storage
      .getImage(key)
      .then((blob) => {
        if (cancelled || !blob) {
          setUrl(null);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key]);

  return url;
}
