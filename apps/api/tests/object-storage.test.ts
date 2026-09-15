import { describe, expect, it } from 'vitest';
import {
  getObjectStorage,
  LocalObjectStorage,
  toCloudinaryPublicId,
} from '../src/modules/media/storage/object-storage.service';

describe('object storage', () => {
  it('uses local storage when Cloudinary is unset', () => {
    expect(getObjectStorage()).toBeInstanceOf(LocalObjectStorage);
  });

  it('maps a storage key to a Cloudinary public id without the extension', () => {
    expect(toCloudinaryPublicId('organizations/a/students/b/photos/c/original.jpg')).toBe(
      'organizations/a/students/b/photos/c/original',
    );
  });
});
