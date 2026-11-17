'use client';

import { useRef } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

export type AdminPhoto = {
  key: string;
  src: string;
  file?: File;
  remoteId?: number;
  variantId?: number;
  colorId?: number;
};

export type AdminPhotoColorOption = {
  id: number;
  name: string;
};

type AdminPhotoEditorProps = {
  photos: AdminPhoto[];
  onChange: (photos: AdminPhoto[]) => void;
  colorOptions?: AdminPhotoColorOption[];
  defaultColorId?: number;
  multiple?: boolean;
  label?: string;
  hint?: string;
  shape?: 'tile' | 'avatar';
};

function photoFromFile(file: File): AdminPhoto {
  return {
    key: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    src: URL.createObjectURL(file),
    file,
  };
}

export default function AdminPhotoEditor({
  photos,
  onChange,
  colorOptions = [],
  defaultColorId,
  multiple = true,
  label,
  hint,
  shape = 'tile',
}: AdminPhotoEditorProps) {
  const { t } = useTranslation();
  const addRef = useRef<HTMLInputElement>(null);
  const title = label ?? t.admin.photo;
  const frame = shape === 'avatar' ? 'size-32 rounded-full' : 'h-44 w-32 rounded-2xl';

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...list].map((file) => ({ ...photoFromFile(file), colorId: defaultColorId }));
    onChange(multiple ? [...photos, ...next] : [next[0]]);
  }

  function replaceFile(key: string, list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    onChange(
      photos.map((photo) =>
        photo.key === key ? { ...photo, src: URL.createObjectURL(file), file } : photo,
      ),
    );
  }

  function makeMain(key: string) {
    const picked = photos.find((photo) => photo.key === key);
    if (!picked) return;
    onChange([picked, ...photos.filter((photo) => photo.key !== key)]);
  }

  return (
    <div>
      {title ? (
        <span className="mb-1 block text-sm font-semibold text-[#1d2433]">{title}</span>
      ) : null}
      {hint ? <p className="m-0 mb-4 max-w-xl text-sm leading-5 text-[#9aa1ad]">{hint}</p> : null}
      <div className="flex flex-wrap items-start gap-4">
        {photos.map((photo, index) => (
          <div key={photo.key} className={`relative ${frame}`}>
            <label
              className={`block size-full cursor-pointer overflow-hidden bg-[#f4f6fa] shadow-[0_8px_20px_rgb(30_41_59/8%)] ${frame}`}
            >
              <img src={photo.src} alt="" className="size-full object-cover" />
              <span
                className={`absolute inset-x-0 ${
                  colorOptions.length > 0 ? 'bottom-9 pt-2' : 'bottom-0 pt-6'
                } bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 text-center text-[11px] font-medium text-white`}
              >
                {t.admin.replacePhoto}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={t.admin.replacePhoto}
                onChange={(event) => {
                  replaceFile(photo.key, event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {multiple && index === 0 ? (
              <span className="absolute top-2 left-2 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                {t.admin.mainPhoto}
              </span>
            ) : null}
            {multiple && index > 0 ? (
              <button
                type="button"
                onClick={() => makeMain(photo.key)}
                className="absolute top-2 left-2 cursor-pointer rounded-full border-0 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1d2433] shadow-sm"
              >
                {t.admin.mainPhoto}
              </button>
            ) : null}
            {multiple ? (
              <button
                type="button"
                aria-label={t.admin.removePhoto}
                onClick={() => onChange(photos.filter((item) => item.key !== photo.key))}
                className="absolute -top-1.5 -right-1.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-sm text-[#1d2433] shadow-[0_4px_12px_rgb(30_41_59/16%)]"
              >
                ×
              </button>
            ) : null}
            {colorOptions.length > 0 ? (
              <select
                className="absolute right-1 bottom-1 left-1 h-8 rounded-lg border-0 bg-white/95 px-2 text-xs text-[#1d2433] shadow-sm disabled:opacity-80"
                aria-label={t.admin.color}
                value={photo.colorId ?? ''}
                onChange={(event) =>
                  onChange(
                    photos.map((item) =>
                      item.key === photo.key
                        ? { ...item, colorId: Number(event.target.value) || undefined }
                        : item,
                    ),
                  )
                }
              >
                <option value="">{t.admin.choose}</option>
                {colorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ))}
        {multiple || photos.length === 0 ? (
          <button
            type="button"
            onClick={() => addRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[#c9d0dc] bg-[#f7f8fb] text-xs font-medium text-[#6b7280] ${frame}`}
          >
            <span className="text-2xl leading-none font-light text-black">+</span>
            {t.admin.addPhoto}
          </button>
        ) : null}
      </div>
      <input
        ref={addRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        aria-label={t.admin.addPhoto}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
