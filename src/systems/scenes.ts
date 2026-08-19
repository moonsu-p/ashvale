/**
 * 여러 마디로 이어지는 장면 (§8.3) — 순수 함수.
 *
 * 기존 대화는 **한 장면에 한 마디**였다. 다가와서 한마디 하고 닫히니
 * 관계가 쌓이는 느낌이 없었다. 여기서 마디를 이어 붙인다.
 *
 * 각 마디를 DialogueScript 하나로 굽고, 스토어가 그것을 줄 세워 튼다.
 * 대화 상태 기계(§8.3)는 건드리지 않는다 — 줄만 세운다.
 */

import type { DialogueScript } from '@/types/dialogue';
import type { CompanionRecord, GameState } from '@/types/game';
import type { Scene } from '@/data/content/romance-events';
import { FIELD_SCENES, ROMANCE_SCENES } from '@/data/content/romance-events';
import { applyToken } from './korean';
import { displayName } from './relationships';
import { voiceOf } from './voice';

/** 이 장면을 이미 봤는가. clearedEvents 에 장면 id 를 박는다 */
export function sceneCleared(who: CompanionRecord, scene: Scene): boolean {
  return who.clearedEvents.includes(scene.id);
}

/**
 * 지금 열 수 있는 장면 하나.
 *
 * 문턱이 높은 것부터 본다 — 뒤늦게 호감이 확 오른 사이에서 옛날 장면부터
 * 하나씩 나오면 흐름이 어긋난다. 지금 사이에 맞는 장면이 먼저다.
 */
export function nextScene(who: CompanionRecord, pool: Scene[]): Scene | null {
  const open = pool
    .filter((scene) => who.affinity >= scene.at)
    .filter((scene) => scene.romanceOnly !== true || who.track === 'romance')
    .filter((scene) => !sceneCleared(who, scene))
    .sort((a, b) => b.at - a.at);
  return open[0] ?? null;
}

export function nextRomanceScene(who: CompanionRecord): Scene | null {
  return nextScene(who, ROMANCE_SCENES);
}

export function nextFieldScene(who: CompanionRecord): Scene | null {
  return nextScene(who, FIELD_SCENES);
}

/**
 * 장면을 대화 대본 여러 개로 굽는다.
 *
 * 마지막 마디에만 `clearedEvent` 를 붙인다 — 중간에 닫혀도 다시 볼 수 있게.
 * 선택지가 있는 마디가 여럿이면 각각 호감이 붙는다.
 */
export function buildSceneScripts(
  state: GameState,
  who: CompanionRecord,
  scene: Scene,
): DialogueScript[] {
  const voice = voiceOf(who.archetypeId);
  if (voice === undefined) return [];

  const name = displayName(who);
  const fill = (text: string) =>
    applyToken(applyToken(text, '{이름}', name), '{거점}', state.town.name);

  const portrait = {
    speaker: { kind: 'companion' as const, id: who.archetypeId },
    wantSlot: 0,
    label: voice.label,
  };

  return scene.beats.map((beat, i) => {
    const last = i === scene.beats.length - 1;
    const script: DialogueScript = {
      speakerName: name,
      portrait: { ...portrait, wantSlot: last ? 3 : 0 },
      lines: beat.lines.map(fill),
    };

    if (beat.choices !== undefined) {
      script.choices = beat.choices.map((choice, ci) => ({
        id: `${scene.id}:${i}:${ci}`,
        text: fill(choice.text),
        reply: fill(choice.reply),
        effect: {
          companionId: who.id,
          affinity: choice.affinity,
          ...(last ? { clearedEvent: scene.id } : {}),
        },
      }));
    } else if (last) {
      // 선택지 없이 끝나는 마디도 본 것으로 친다
      script.choices = [
        {
          id: `${scene.id}:done`,
          text: '…',
          reply: '',
          effect: { companionId: who.id, affinity: 0, clearedEvent: scene.id },
        },
      ];
    }

    return script;
  });
}

export type { Scene };
