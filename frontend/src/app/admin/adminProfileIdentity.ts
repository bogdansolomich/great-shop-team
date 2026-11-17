import { toImageUrl } from '@/store/api/mappers/products.mapper';
import type { Profile } from '@/store/types';

export const ADMIN_PROFILE_NAME_EVENT = 'admin-profile-name';
export const ADMIN_PROFILE_PHOTO_EVENT = 'admin-profile-photo';

const photoKey = (profileId: number) => `admin-profile-photo:${profileId}`;

export function profileDisplayName(profile: Profile | null | undefined) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
}

export function profileImageSrc(profile: Profile | null | undefined) {
  if (!profile) return '';
  const extra = profile as Profile & {
    photo?: unknown;
    avatar?: unknown;
    image?: unknown;
  };
  return imageAddress(extra.photo) || imageAddress(extra.avatar) || imageAddress(extra.image);
}

function imageAddress(value: unknown) {
  if (typeof value === 'string') return toImageUrl(value);
  if (value && typeof value === 'object' && 'url' in value) {
    const url = (value as { url?: unknown }).url;
    if (typeof url === 'string') return toImageUrl(url);
  }
  return '';
}

export function readStoredProfilePhoto(profileId: number | null) {
  if (!profileId || typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(photoKey(profileId)) ?? '';
  } catch {
    return '';
  }
}

export function publishAdminProfileName(name: string | null) {
  window.dispatchEvent(new CustomEvent(ADMIN_PROFILE_NAME_EVENT, { detail: name }));
}

export function publishAdminProfilePhoto(src: string | null) {
  window.dispatchEvent(new CustomEvent(ADMIN_PROFILE_PHOTO_EVENT, { detail: src }));
}

export function rememberProfilePhoto(profileId: number, file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('photo'));
      image.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('photo'));
          return;
        }
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        try {
          localStorage.setItem(photoKey(profileId), dataUrl);
        } catch {
          // The sidebar can still use the in-memory preview.
        }
        publishAdminProfilePhoto(dataUrl);
        resolve(dataUrl);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
