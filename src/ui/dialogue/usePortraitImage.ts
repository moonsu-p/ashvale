/**
 * 대화에 쓸 초상 이미지를 꺼내 온다 (§8.2).
 *
 * 슬롯 폴백은 systems/portrait.ts 가 정하고, 실제 바이트는 StorageAdapter 뒤에서 나온다.
 * 인물 이미지는 플레이어가 넣는 것이라 아직 하나도 없다 — 그러면 null 을 돌려주고
 * 부르는 쪽이 원형 실루엣을 세운다. **조용히 넘어간다.**
 */

import { useEffect, useState } from 'react';
import type { PortraitRef } from '@/types/dialogue';
import type { CompanionRecord } from '@/types/game';
import { resolveImageKey } from '@/systems/portrait';
import { getStorage } from '@/storage';
import { isVideoType } from '@/data/images';
import { useGameStore } from '@/store/useGameStore';

/** 명단에서 그 원형의 인물을 찾는다. 아직 명단이 비어 있으면 undefined */
function findCompanion(
  companions: Record<string, CompanionRecord> | undefined,
  archetypeId: string,
): CompanionRecord | undefined {
  if (companions === undefined) return undefined;
  return Object.values(companions).find((c) => c.archetypeId === archetypeId);
}

/**
 * 슬롯에 담긴 것. 그림일 수도 영상일 수도 있다 (§9.1).
 * 종류는 Blob 이 들고 있다 — 세이브에 따로 적지 않는다.
 */
export type PortraitMedia = { url: string; video: boolean } | null;

export function usePortraitImage(portrait: PortraitRef): PortraitMedia {
  const companions = useGameStore((s) => s.state?.companions);
  const [media, setMedia] = useState<PortraitMedia>(null);

  useEffect(() => {
    // 의뢰인은 초상을 올리지 않는다. 관계 대상만 슬롯을 가진다 (§9)
    const record =
      portrait.speaker.kind === 'companion'
        ? findCompanion(companions, portrait.speaker.id)
        : undefined;

    const key = resolveImageKey(record?.images, portrait.wantSlot, record?.pickedSlot);
    if (key === null) {
      setMedia(null);
      return;
    }

    let objectUrl: string | null = null;
    let alive = true;

    void getStorage()
      .getImage(key)
      .then((blob) => {
        if (!alive || blob === null) return;
        objectUrl = URL.createObjectURL(blob);
        setMedia({ url: objectUrl, video: isVideoType(blob.type) });
      })
      // 못 읽으면 실루엣으로 간다. 대화 중에 오류를 띄우지 않는다
      .catch(() => setMedia(null));

    return () => {
      alive = false;
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
    };
  }, [companions, portrait.speaker.kind, portrait.speaker.id, portrait.wantSlot]);

  return media;
}
