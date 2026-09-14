import sharp from 'sharp';
import { validationError } from '../../utils/validate';

export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number];

const DISPLAY_MAX = 1920;
const THUMB_MAX = 400;

export function sniffImageType(buf: Buffer): PhotoContentType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function processPhoto(input: Buffer): Promise<{
  original: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
  contentType: 'image/jpeg';
}> {
  let original: Buffer;
  try {
    original = await sharp(input)
      .rotate()
      .resize({
        width: DISPLAY_MAX,
        height: DISPLAY_MAX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    throw validationError('file', 'Is not a valid image');
  }

  const meta = await sharp(original).metadata();
  if (!meta.width || !meta.height) {
    throw validationError('file', 'Is not a valid image');
  }

  const thumbnail = await sharp(original)
    .resize({
      width: THUMB_MAX,
      height: THUMB_MAX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 70, mozjpeg: true })
    .toBuffer();

  return {
    original,
    thumbnail,
    width: meta.width,
    height: meta.height,
    contentType: 'image/jpeg',
  };
}
