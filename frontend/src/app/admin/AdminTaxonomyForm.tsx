'use client';

import { useState, type FormEvent } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import {
  useCreateAdminCategoryMutation,
  useCreateAdminSubcategoryMutation,
  useGetAdminCategoryByIdQuery,
  useGetAdminSubcategoryByIdQuery,
  usePatchAdminCategoryMutation,
  usePatchAdminSubcategoryMutation,
} from '@/store/endpoints/adminEndpoints';
import type { Category, Subcategory } from '@/store/types';

import { adminButton, adminButtonSecondary } from './adminClasses';
import { formErrorText } from './formError';

const fieldClass =
  'h-11 w-full rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4 text-sm outline-none focus:border-black focus:bg-white';

type TaxonomyKind = 'category' | 'subcategory';

type AdminTaxonomyFormProps = {
  kind: TaxonomyKind;
  item?: Category | Subcategory;
  categories?: Category[];
  onSaved: () => void;
  onCancel: () => void;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminTaxonomyForm(props: AdminTaxonomyFormProps) {
  const { t } = useTranslation();
  const { kind, item } = props;
  const id = item?.id;
  const categoryQuery = useGetAdminCategoryByIdQuery(id ?? 0, {
    skip: kind !== 'category' || id === undefined,
  });
  const subcategoryQuery = useGetAdminSubcategoryByIdQuery(id ?? 0, {
    skip: kind !== 'subcategory' || id === undefined,
  });
  const loading = id !== undefined && (categoryQuery.isLoading || subcategoryQuery.isLoading);
  const detail = kind === 'category' ? categoryQuery.data : subcategoryQuery.data;

  if (loading) {
    return (
      <p className="m-0 rounded-2xl bg-white p-5 text-sm text-[#6b7280]">{t.common.loading}</p>
    );
  }
  if (id !== undefined && (!detail || categoryQuery.isError || subcategoryQuery.isError)) {
    return (
      <p role="alert" className="m-0 rounded-2xl bg-white p-5 text-sm text-[#ef4444]">
        {t.admin.loadError}
      </p>
    );
  }

  return <TaxonomyFields key={`${kind}-${detail?.id ?? 'new'}`} {...props} item={detail} />;
}

function TaxonomyFields({
  kind,
  item,
  categories = [],
  onSaved,
  onCancel,
}: AdminTaxonomyFormProps) {
  const { t, locale } = useTranslation();
  const [createCategory, createCategoryState] = useCreateAdminCategoryMutation();
  const [patchCategory, patchCategoryState] = usePatchAdminCategoryMutation();
  const [createSubcategory, createSubcategoryState] = useCreateAdminSubcategoryMutation();
  const [patchSubcategory, patchSubcategoryState] = usePatchAdminSubcategoryMutation();
  const [nameUk, setNameUk] = useState(item?.name_uk ?? item?.name ?? '');
  const [nameEn, setNameEn] = useState(item?.name_en ?? item?.name ?? '');
  const [slug, setSlug] = useState(item?.slug ?? '');
  const [categoryId, setCategoryId] = useState(
    item && 'category' in item && item.category ? String(item.category) : '',
  );
  const [isActive, setIsActive] = useState(item?.is_active !== false);
  const [isHidden, setIsHidden] = useState(Boolean(item?.is_hidden));
  const [slugEdited, setSlugEdited] = useState(Boolean(item));
  const [error, setError] = useState('');
  const id = item?.id;
  const saving =
    createCategoryState.isLoading ||
    patchCategoryState.isLoading ||
    createSubcategoryState.isLoading ||
    patchSubcategoryState.isLoading;
  const heading = kind === 'category' ? t.admin.categories : t.admin.subcategories;

  function updateName(language: 'uk' | 'en', value: string) {
    if (language === 'uk') setNameUk(value);
    else setNameEn(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (
      !nameUk.trim() ||
      !nameEn.trim() ||
      !slug.trim() ||
      (kind === 'subcategory' && !categoryId)
    ) {
      setError(t.admin.saveError);
      return;
    }

    const shared = {
      name: nameUk.trim(),
      name_uk: nameUk.trim(),
      name_en: nameEn.trim(),
      slug: slug.trim(),
      is_active: isActive,
      is_hidden: isHidden,
    };

    try {
      if (kind === 'category') {
        if (id !== undefined) await patchCategory({ id, body: shared }).unwrap();
        else await createCategory(shared).unwrap();
      } else {
        const body = { ...shared, category: Number(categoryId) };
        if (id !== undefined) await patchSubcategory({ id, body }).unwrap();
        else await createSubcategory(body).unwrap();
      }
      onSaved();
    } catch (submitError) {
      setError(formErrorText(submitError, t.admin.saveError));
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgb(30_41_59/6%)]"
    >
      <h2 className="m-0 text-lg font-bold">
        {id === undefined ? t.admin.create : t.admin.edit} — {heading}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold tracking-wide text-[#8b93a1] uppercase">
          {t.admin.name} — Українська
          <input
            className={`${fieldClass} mt-1.5 normal-case`}
            value={nameUk}
            onChange={(event) => updateName('uk', event.target.value)}
            required
          />
        </label>
        <label className="text-xs font-semibold tracking-wide text-[#8b93a1] uppercase">
          {t.admin.name} — English
          <input
            className={`${fieldClass} mt-1.5 normal-case`}
            value={nameEn}
            onChange={(event) => updateName('en', event.target.value)}
            required
          />
        </label>
        <label className="text-xs font-semibold tracking-wide text-[#8b93a1] uppercase">
          {t.admin.slug}
          <input
            className={`${fieldClass} mt-1.5 normal-case`}
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value);
            }}
            required
          />
        </label>
        {kind === 'subcategory' ? (
          <label className="text-xs font-semibold tracking-wide text-[#8b93a1] uppercase">
            {t.admin.parentCategory}
            <select
              className={`${fieldClass} mt-1.5 normal-case`}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            >
              <option value="">{t.admin.choose}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === 'uk'
                    ? category.name_uk || category.name
                    : category.name_en || category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          {t.admin.active}
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(event) => setIsHidden(event.target.checked)}
          />
          {t.admin.hidden}
        </label>
      </div>
      {error ? (
        <p role="alert" className="m-0 text-sm text-[#ef4444]">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className={adminButton}
        >
          {saving ? t.common.saving : t.admin.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={adminButtonSecondary}
        >
          {t.admin.cancel}
        </button>
      </div>
    </form>
  );
}
