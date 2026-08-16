/**
 * 한국어 조사 처리.
 *
 * 이름과 거점 이름은 플레이어가 붙인다. 콘텐츠와 연대기는 `{이름}이` 처럼
 * 받침 있는 말을 전제로 쓰여 있어서, 그대로 끼우면 "기사이 혼자" 가 나온다.
 * 앞말의 받침을 보고 맞는 형태를 고른다.
 */

/**
 * 숫자를 읽었을 때 받침이 있는가.
 * 영·일·삼·육·칠·팔 은 받침이 있고, 이·사·오·구 는 없다.
 * 10·20 처럼 0으로 끝나면 십·이십 이라 받침이 있다.
 */
const DIGIT_HAS_FINAL: Record<string, boolean> = {
  '0': true, // 영 (열·십으로 읽어도 받침)
  '1': true, // 일
  '2': false, // 이
  '3': true, // 삼
  '4': false, // 사
  '5': false, // 오
  '6': true, // 육
  '7': true, // 칠
  '8': true, // 팔
  '9': false, // 구
};

/** 받침이 있는가. 한글도 숫자도 아니면 없는 것으로 친다 */
export function hasFinal(word: string): boolean {
  const ch = word.at(-1);
  if (ch === undefined) return false;

  const digit = DIGIT_HAS_FINAL[ch];
  if (digit !== undefined) return digit;

  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 종성이 ㄹ 인가. '으로/로' 만 이걸 따로 본다 */
export function endsWithRieul(word: string): boolean {
  const ch = word.at(-1);
  if (ch === undefined) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 === 8;
}

/** 앞말에 맞는 조사 형태 */
export function agree(word: string, particle: string): string {
  const final = hasFinal(word);
  switch (particle) {
    case '이':
    case '가':
      return final ? '이' : '가';
    case '은':
    case '는':
      return final ? '은' : '는';
    case '을':
    case '를':
      return final ? '을' : '를';
    case '과':
    case '와':
      return final ? '과' : '와';
    case '아':
    case '야':
      return final ? '아' : '야';
    case '으로':
    case '로':
      return final && !endsWithRieul(word) ? '으로' : '로';
    default:
      return particle;
  }
}

/** 낱말에 조사를 붙여 돌려준다. `josa('회관', '을')` -> '회관을' */
export function josa(word: string, particle: string): string {
  return word + agree(word, particle);
}

const PARTICLE = '으로|로|이|가|은|는|을|를|과|와|아|야';
/** 조사 뒤가 낱말 경계여야 한다. '{이름}이랑' 의 '이' 를 조사로 오해하지 않으려고 */
const BOUNDARY = '[\\s,.!?"\'”’…」』)\\]]|$';

/** 토큰 하나를 채우면서 뒤따르는 조사를 앞말에 맞춘다 */
export function applyToken(text: string, token: string, value: string): string {
  const esc = token.replace(/[{}]/g, '\\$&');
  const withParticle = new RegExp(`${esc}(${PARTICLE})(?=${BOUNDARY})`, 'g');
  return text
    .replace(withParticle, (_match, particle: string) => value + agree(value, particle))
    .replaceAll(token, value);
}
