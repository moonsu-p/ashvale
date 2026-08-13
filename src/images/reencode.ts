/**
 * 이미지 재인코딩 — §11.4 절대 규칙. 원본을 참조하지 말고 복사한다.
 * 선택 즉시 바이트를 읽어 EXIF 회전을 적용하고 WebP 로 재인코딩한다. 그 Blob 만 저장한다.
 * 이 함수가 반환하는 Blob 은 원본 파일/경로와 어떤 연결도 갖지 않는다.
 */

import { ALLOWED_TYPES, MAX_FILE_BYTES, WEBP_QUALITY } from '@/data/slots';
import { PALETTE } from '@/data/palette';

export class ImageRejected extends Error {}

export async function reencodeToWebp(file: File, longEdge: number): Promise<Blob> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageRejected('PNG · JPEG · WebP 이미지만 넣을 수 있습니다.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageRejected('이미지가 너무 큽니다(8MB 이하). 더 작은 이미지를 고르세요.');
  }

  // EXIF orientation 적용해서 읽는다 (폰 사진첩 이미지 눕는 문제 방지, §11.4)
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageRejected('이미지를 읽을 수 없습니다. 다른 이미지를 고르세요.');
  }

  const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new ImageRejected('이미지를 처리할 수 없습니다.');
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close(); // 원본 비트맵과의 연결을 즉시 끊는다

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY)
  );
  if (!blob) throw new ImageRejected('이미지를 저장할 수 없습니다.');
  return blob; // EXIF·GPS 제거됨(재인코딩 부수효과, 의도된 동작)
}
