/**
 * 이미지 재인코딩 (§9.1).
 *
 * 고른 즉시 바이트를 읽어 WebP 로 다시 굽는다. 원본을 가리키는 값은
 * 어디에도 남기지 않는다 — 사진첩에서 원본을 지워도 게임 안 그림은 남아야 한다.
 *
 * EXIF 회전을 반드시 처리한다. 폰 사진은 그대로 그리면 눕는다.
 * 다시 굽는 과정에서 EXIF 와 GPS 는 통째로 사라진다.
 */

import { PALETTE } from '@/data/palette';
import { ACCEPTED_TYPES, MAX_SOURCE_BYTES, WEBP_QUALITY, targetSize } from '@/data/images';

export type EncodeFailure = 'type' | 'too-big' | 'decode' | 'encode';

export class ImageError extends Error {
  readonly failure: EncodeFailure;
  constructor(failure: EncodeFailure, message: string) {
    super(message);
    this.name = 'ImageError';
    this.failure = failure;
  }
}

export interface EncodedImage {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
}

/**
 * 파일 하나를 슬롯 규격의 WebP 로 만든다.
 *
 * 비율이 다르면 **자르지 않고** contain 으로 넣고 남는 자리는 팔레트 색으로 채운다 (§9.1).
 * 얼굴이 잘려 나가는 것보다 여백이 낫다.
 */
export async function encodeForSlot(file: File, slot: number): Promise<EncodedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageError('type', 'PNG, JPEG, WebP 만 넣을 수 있습니다. 다른 사진을 골라 주세요.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    const mb = (MAX_SOURCE_BYTES / 1024 / 1024).toFixed(0);
    throw new ImageError('too-big', `${mb}MB 이하만 넣을 수 있습니다. 더 작은 사진을 골라 주세요.`);
  }

  let bitmap: ImageBitmap;
  try {
    // 폰 사진의 회전 정보를 여기서 적용한다. 빼먹으면 세로 사진이 눕는다
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageError('decode', '이 사진을 읽지 못했습니다. 다른 사진을 골라 주세요.');
  }

  try {
    const { width, height } = targetSize(slot);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new ImageError('encode', '이미지를 처리하지 못했습니다.');

    // 남는 자리는 팔레트 색. 검은 여백은 초상 옆에서 구멍처럼 보인다
    ctx.fillStyle = PALETTE.paperDim;
    ctx.fillRect(0, 0, width, height);

    // contain — 긴 변을 기준으로 줄이고 가운데 정렬
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const drawW = Math.round(bitmap.width * scale);
    const drawH = Math.round(bitmap.height * scale);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, Math.round((width - drawW) / 2), Math.round((height - drawH) / 2), drawW, drawH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (blob === null) throw new ImageError('encode', '이미지를 저장할 형식으로 바꾸지 못했습니다.');

    return { blob, width, height, bytes: blob.size };
  } finally {
    // 비트맵은 GC 를 기다리지 않고 바로 놓는다
    bitmap.close();
  }
}
