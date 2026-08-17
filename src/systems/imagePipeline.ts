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
import {
  ACCEPTED_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_SOURCE_BYTES,
  MAX_VIDEO_BYTES,
  WEBP_QUALITY,
  isVideoType,
  targetSize,
} from '@/data/images';

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
  // 영상은 다시 구울 수 없다. 따로 간다
  if (isVideoType(file.type)) return copyVideo(file);

  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageError(
      'type',
      'PNG, JPEG, WebP, MP4 만 넣을 수 있습니다. 다른 파일을 골라 주세요.',
    );
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

/**
 * 영상을 슬롯에 넣는다 (§9.1).
 *
 * **다시 굽지 않는다.** 브라우저에는 영상을 줄여 다시 인코딩할 방법이
 * 마땅치 않다 — WebCodecs 로 하려면 코덱 지원을 따져야 하고, 실패하면
 * 아무것도 못 넣는 쪽이 된다. 그래서 바이트를 **복사만** 한다.
 *
 * 복사는 §9.1 을 지키는 데 꼭 필요하다. File 을 그대로 넣으면 원본 파일을
 * 가리키게 되고, 사진첩에서 지우면 게임 안 영상도 깨진다.
 * ArrayBuffer 로 읽어 새 Blob 을 만들면 그 참조가 끊긴다.
 *
 * 다시 굽지 않으니 EXIF 같은 메타데이터도 그대로 남는다. 위치 정보가 붙어
 * 있을 수 있지만 이 앱은 아무것도 밖으로 보내지 않으므로(§14 비통신)
 * 기기 밖으로 나가지 않는다. 꾸러미로 내보낼 때만 따라 나간다.
 */
async function copyVideo(file: File): Promise<EncodedImage> {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    throw new ImageError('type', 'MP4 만 넣을 수 있습니다. 다른 영상을 골라 주세요.');
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));
    throw new ImageError(
      'too-big',
      `영상이 ${mb}MB 를 넘습니다. 더 짧게 자르거나 화질을 낮춰 주세요.`,
    );
  }

  // 여기서 원본과의 끈이 끊긴다
  const bytes = await file.arrayBuffer();
  const blob = new Blob([bytes], { type: file.type });

  // 정말 재생되는지 본다. 확장자만 바꾼 파일을 조용히 받아들이지 않는다
  const size = await videoSize(blob);
  return { blob, width: size.width, height: size.height, bytes: blob.size };
}

/** 영상의 크기를 읽는다. 메타데이터까지만 읽고 끝낸다 */
function videoSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const done = (fn: () => void) => {
      video.removeAttribute('src');
      URL.revokeObjectURL(url);
      fn();
    };

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      done(() =>
        width > 0 && height > 0
          ? resolve({ width, height })
          : reject(new ImageError('decode', '영상을 읽지 못했습니다. 다른 파일을 골라 주세요.')),
      );
    };
    video.onerror = () => {
      done(() =>
        reject(new ImageError('decode', '영상을 읽지 못했습니다. 다른 파일을 골라 주세요.')),
      );
    };

    video.src = url;
  });
}
