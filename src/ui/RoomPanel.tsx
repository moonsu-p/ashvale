/**
 * 실내 목적 자리 (§10).
 *
 * 여기서 규칙을 계산하지 않는다. 상태를 읽어 보여주고, 누르면 스토어 액션을 부른다.
 * 다섯 방이 하나의 껍데기를 나눠 쓴다 — 제목과 안쪽만 다르다.
 */

import type { CompanionRecord, GameState, StatId } from '@/types/game';
import type { RoomId } from '@/types/map';
import { useGameStore } from '@/store/useGameStore';
import { getRoom, OFFERING } from '@/data/rooms';
import { ROOM_EMPTY, ROOM_INTRO } from '@/data/content/room-text';
import { REGIONS, regionName, type LootRange } from '@/data/regions';
import { RELICS } from '@/data/content/world-content';
import { SKILLS } from '@/data/skills';
import { ERAS, eraName } from '@/data/eras';
import { getArchetype } from '@/data/archetypes';
import { stageFor } from '@/systems/relationships';
import { ESCORT_MIN_AFFINITY } from '@/data/relationships';
import { xpToNext } from '@/data/levels';
import { TOUCH_MIN } from '@/data/layout';

const STAT_LABEL: Record<StatId, string> = {
  might: '힘',
  agility: '민첩',
  insight: '통찰',
  will: '의지',
};

const STAT_ORDER: StatId[] = ['might', 'agility', 'insight', 'will'];

/** 지역마다 나오는 자원이 다르다. 없는 자원은 적지 않는다 */
function lootText(loot: LootRange): string {
  const parts: string[] = [];
  for (const [id, label] of [
    ['wood', '목재'],
    ['stone', '석재'],
    ['food', '식량'],
    ['gold', '금화'],
  ] as const) {
    const range = loot[id];
    if (range === undefined) continue;
    parts.push(`${label} ${range[0]}–${range[1]}`);
  }
  return parts.join(' · ');
}

function Empty({ id }: { id: RoomId }) {
  return <p className="text-[12px] text-inkSoft">{ROOM_EMPTY[id]}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-stoneDark/20 py-1">
      <span className="text-[12px]">{label}</span>
      <span className="text-[11px] tabular-nums text-inkSoft">{value}</span>
    </div>
  );
}

/** 서고 — 나가기 전에 어디가 얼마나 험한지 본다 */
function Study({ state }: { state: GameState }) {
  const open = REGIONS.filter((r) => state.world.eraIndex >= r.unlockEra);
  if (open.length === 0) return <Empty id="study" />;

  return (
    <div>
      {open.map((region) => (
        <div key={region.id} className="border-b border-stoneDark/20 py-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium">{regionName(region.id)}</span>
            <span className="text-[11px] tabular-nums text-inkSoft">
              난이도 {region.difficulty} · {STAT_LABEL[region.stat]} · 위험도 {region.risk}
            </span>
          </div>
          <div className="text-[11px] tabular-nums text-inkSoft">
            전리품 {lootText(region.loot)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 신전 — 금화를 기력으로 바꾼다. 주를 쓰지 않는다 */
function Altar({ state }: { state: GameState }) {
  const offer = useGameStore((s) => s.offer);
  const level = state.town.buildings['shrine'] ?? 0;
  const missing = state.hero.maxHp - state.hero.hp;

  if (missing <= 0) return <Empty id="altar" />;

  const cap = Math.min(missing, level * OFFERING.hpPerLevel);
  const cost = cap * OFFERING.goldPerHp;
  const enough = state.resources.gold >= OFFERING.goldPerHp;

  return (
    <div className="space-y-2">
      <Row label="기력" value={`${state.hero.hp} / ${state.hero.maxHp}`} />
      <Row label="한 번에 회복" value={`${cap} (신전 ${level}단계)`} />
      <Row label="드는 금화" value={`${cost} · 가진 것 ${state.resources.gold}`} />

      <button
        type="button"
        onClick={offer}
        disabled={!enough}
        style={{ minHeight: TOUCH_MIN }}
        className="w-full rounded border border-stoneDark bg-paperDim text-[13px] disabled:opacity-50"
      >
        봉납
      </button>
      <p className="text-[11px] text-inkSoft">
        한 주를 쉬는 것과 달리 시간이 지나지 않는다. 대신 금화가 든다.
      </p>
    </div>
  );
}

/**
 * 이 사람의 호감을 지금 올릴 수 있는 길.
 *
 * 규칙(CLAUDE.md · §7.3)은 **동행 탐사 · 고향 지역 탐사 · 선물 · 대화 사건**
 * 넷뿐이다. 그런데 셋이 다 문턱을 갖고 있다 —
 * 동행은 호감 40, 대화 사건은 20, 선물은 시장이 필요하다.
 * 고향 지역은 그 지역이 열려야 한다.
 *
 * 그래서 갓 들어온 사람은 **막힌 것처럼 보인다.** 어디가 막혔는지 알려 준다.
 */
function affinityPath(state: GameState, who: CompanionRecord): string {
  if (who.injuredUntilTurn > state.world.turn) return '다친 동안에는 오르지 않는다';

  const paths: string[] = [];

  if (who.affinity >= ESCORT_MIN_AFFINITY) paths.push('동행');

  const home = REGIONS.find((r) => r.id === who.homeRegion);
  if (home !== undefined && state.world.eraIndex >= home.unlockEra) {
    paths.push(`고향 ${regionName(home.id)} 탐사`);
  }

  if ((state.town.buildings['market'] ?? 0) > 0) paths.push('선물');

  if (paths.length > 0) return `올리는 길 — ${paths.join(' · ')}`;

  // 하나도 없으면 무엇을 기다려야 하는지 말한다
  if (home !== undefined) {
    return `아직 길이 없다 — 시장을 지으면 선물, ${eraName(home.unlockEra, 0)}에 고향 ${regionName(home.id)}`;
  }
  return '아직 길이 없다 — 시장을 지으면 선물을 줄 수 있다';
}

/** 길드관 — 누구와 얼마나 가까운지 한자리에서 본다 */
function Roster({ state }: { state: GameState }) {
  const list = Object.values(state.companions).filter((c) => c.departedTurn === null);
  if (list.length === 0) return <Empty id="roster" />;

  return (
    <div>
      {list.map((who) => {
        const stage = stageFor(who.affinity);
        const track = who.track === 'romance' ? '연심' : who.track === 'bond' ? '우애' : '—';
        const archetype = getArchetype(who.archetypeId);
        const injured = who.injuredUntilTurn > state.world.turn;
        return (
          <div key={who.id} className="border-b border-stoneDark/20 py-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium">
                {who.name === '' ? (archetype?.label ?? '이름 없음') : who.name}
              </span>
              <span className="text-[11px] tabular-nums text-inkSoft">
                {stage.name} {who.affinity} · {track}
              </span>
            </div>
            <div className="text-[11px] text-inkSoft">
              고향 {regionName(who.homeRegion)}
              {injured ? ` · 다쳤다 (${who.injuredUntilTurn - state.world.turn}주)` : ''}
            </div>
            {/* 이 사람에게 지금 무엇을 할 수 있는지. 수치만 보여 주면 막힌 이유를 알 수 없다 */}
            <div className="text-[11px] text-grassDark">{affinityPath(state, who)}</div>
          </div>
        );
      })}
      <p className="mt-2 text-[11px] text-inkSoft">
        호감은 동행 탐사 · 고향 지역 탐사 · 선물 · 대화 사건에서만 오른다.
        찾아가 말을 거는 것만으로는 오르지 않는다.
      </p>
    </div>
  );
}

/** 학당 — 쌓이기만 하던 점수를 여기서 쓴다 */
function Training({ state }: { state: GameState }) {
  const spendStat = useGameStore((s) => s.spendStat);
  const spendSkill = useGameStore((s) => s.spendSkill);

  const { statPoints, skillPoints } = state.hero;
  if (statPoints <= 0 && skillPoints <= 0) {
    return (
      <div className="space-y-2">
        <Empty id="training" />
        <Row
          label="다음 단계까지"
          value={`${state.hero.xp} / ${xpToNext(state.hero.level)} 경험`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[12px] font-medium">능력치</span>
          <span className="text-[11px] tabular-nums text-inkSoft">남은 점수 {statPoints}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {STAT_ORDER.map((stat) => (
            <button
              key={stat}
              type="button"
              onClick={() => spendStat(stat)}
              disabled={statPoints <= 0}
              style={{ minHeight: TOUCH_MIN }}
              className="flex items-baseline justify-between rounded border border-stoneDark bg-paperDim px-2 text-[12px] disabled:opacity-50"
            >
              <span>{STAT_LABEL[stat]}</span>
              <span className="tabular-nums">{state.hero.stats[stat]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[12px] font-medium">기술</span>
          <span className="text-[11px] tabular-nums text-inkSoft">남은 점수 {skillPoints}</span>
        </div>
        {SKILLS.map((skill) => {
          const rank = state.hero.skills[skill.id] ?? 0;
          const maxed = rank >= skill.maxRank;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => spendSkill(skill.id)}
              disabled={maxed || skillPoints < skill.cost}
              style={{ minHeight: TOUCH_MIN }}
              className="w-full rounded border border-stoneDark bg-paperDim px-2 text-left disabled:opacity-50"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[12px]">{skill.name}</span>
                <span className="text-[11px] tabular-nums text-inkSoft">
                  {rank} / {skill.maxRank}
                </span>
              </div>
              <div className="text-[11px] text-inkSoft">{skill.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 첨탑 — 거둔 유물과 다음 시대까지 남은 거리 */
function Observatory({ state }: { state: GameState }) {
  const power = Object.values(state.town.buildings).reduce((sum, level) => sum + level, 0);
  const next = ERAS.find((era) => era.power > power);
  const held = RELICS.filter((relic) => state.hero.relics.includes(relic.id));

  return (
    <div className="space-y-3">
      <div>
        <Row label="마을 지수" value={`${power}`} />
        <Row
          label="다음 시대"
          value={
            next === undefined
              ? '신화기 너머'
              : `${eraName(next.index, 0)}까지 ${next.power - power}`
          }
        />
      </div>

      <div>
        <div className="mb-1 text-[12px] font-medium">거둔 유물 {held.length}</div>
        {held.length === 0 ? (
          <Empty id="observatory" />
        ) : (
          held.map((relic) => (
            <div key={relic.id} className="border-b border-stoneDark/20 py-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px]">{relic.name}</span>
                <span className="text-[11px] text-inkSoft">{relic.desc}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function RoomPanel() {
  const id = useGameStore((s) => s.room);
  const state = useGameStore((s) => s.state);
  const close = useGameStore((s) => s.closeRoom);
  const error = useGameStore((s) => s.error);

  if (id === null || state === null) return null;
  const def = getRoom(id);
  if (def === undefined) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-ink/80 p-3">
      <div className="flex min-h-0 flex-1 flex-col rounded border border-stoneDark bg-paper p-3 text-ink">
        <h2 className="text-[15px] font-medium">{def.title}</h2>
        {/* 방 서술은 무주어 문어체다 (§15) */}
        <p className="mb-2 font-serif text-[11px] leading-snug text-inkSoft">{ROOM_INTRO[id]}</p>

        {error !== null && (
          <p className="mb-2 rounded border border-blood bg-paperDim px-2 py-1 text-[11px] text-blood">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {id === 'study' && <Study state={state} />}
          {id === 'altar' && <Altar state={state} />}
          {id === 'roster' && <Roster state={state} />}
          {id === 'training' && <Training state={state} />}
          {id === 'observatory' && <Observatory state={state} />}
        </div>

        <button
          type="button"
          onClick={close}
          style={{ minHeight: TOUCH_MIN }}
          className="mt-2 rounded border border-stoneDark bg-paperDim text-[13px]"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}
