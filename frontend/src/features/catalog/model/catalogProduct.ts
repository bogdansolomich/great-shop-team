import type {
  CatalogListingSlug,
  CatalogProductGroup,
} from '@/features/catalog/model/catalogCategory';
import type { ProductColorOption } from '@/entities/product/model/types';
import type { CartItem, ProductVariantGender } from '@/store/types';

/** Color and size of one purchasable variant, kept together so filters can match the same variant. */
export type CatalogVariantOption = {
  colorId?: number;
  colorName?: string;
  sizeId?: number;
  sizeName?: string;
};

/** What a card shows for one specific color of a product. */
export type CatalogColorView = Pick<
  CatalogProduct,
  | 'image'
  | 'price'
  | 'compareAt'
  | 'badge'
  | 'priceValue'
  | 'inStock'
  | 'stockTotal'
  | 'cartLine'
  | 'href'
>;

export type CatalogProduct = {
  id: string;
  title: string;
  price: string;
  image: {
    src: string;
    alt: string;
  };
  href: string;
  slug?: string;
  description: string;
  category?: CatalogListingSlug;
  subcategory?: string;
  type?: string;
  /** Filter sections the product belongs to (see `groupsOfCategory`). */
  groups?: CatalogProductGroup[];
  genders?: ProductVariantGender[];
  stockTotal?: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: ProductColorOption[];
  brandId?: number;
  brandName?: string;
  subcategoryId?: number;
  colorIds?: number[];
  sizeIds?: number[];
  variantOptions?: CatalogVariantOption[];
  /** The card as it looks for each color, by color id. Only set when the product has 2+ colors. */
  colorViews?: Record<number, CatalogColorView>;
  priceValue?: number;
  compareAt?: string;
  badge?: string;
  cartLine?: Omit<CartItem, 'quantity'>;
};
