'use client';

import { adminButton } from './adminClasses';
import AdminDirectory from './AdminDirectory';
import AdminTaxonomyForm from './AdminTaxonomyForm';
import { useTranslation } from '@/i18n/useTranslation';
import {
  useGetAdminCategoriesQuery,
  useGetAdminSubcategoriesQuery,
} from '@/store/endpoints/adminEndpoints';
import type { Category, Subcategory } from '@/store/types';
import { useState } from 'react';

export default function AdminCategories() {
  const { t } = useTranslation();
  const categories = useGetAdminCategoriesQuery();
  const subcategories = useGetAdminSubcategoriesQuery();
  const [editing, setEditing] = useState<
    { kind: 'category'; item?: Category } | { kind: 'subcategory'; item?: Subcategory } | null
  >(null);
  const categoryOptions = (categories.data ?? []).map((category) => ({
    id: category.id,
    name: category.name_uk || category.name,
    name_uk: category.name_uk,
    name_en: category.name_en,
  }));

  return (
    <div className="flex flex-col gap-8">
      {editing ? (
        <AdminTaxonomyForm
          kind={editing.kind}
          item={editing.item}
          categories={categories.data}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      ) : null}
      <AdminDirectory
        title={t.admin.categories}
        items={categories.data}
        isLoading={categories.isLoading}
        isError={categories.isError}
        onEdit={(item) => {
          const category = categories.data?.find((entry) => entry.id === item.id);
          if (category) setEditing({ kind: 'category', item: category });
        }}
      />
      <AdminDirectory
        title={t.admin.subcategories}
        items={subcategories.data}
        isLoading={subcategories.isLoading}
        isError={subcategories.isError}
        categories={categoryOptions}
        showCategory
        onEdit={(item) => {
          const subcategory = subcategories.data?.find((entry) => entry.id === item.id);
          if (subcategory) setEditing({ kind: 'subcategory', item: subcategory });
        }}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEditing({ kind: 'category' })}
          className={adminButton}
        >
          + {t.admin.create} {t.admin.categories}
        </button>
        <button
          type="button"
          onClick={() => setEditing({ kind: 'subcategory' })}
          className={adminButton}
        >
          + {t.admin.create} {t.admin.subcategories}
        </button>
      </div>
    </div>
  );
}
