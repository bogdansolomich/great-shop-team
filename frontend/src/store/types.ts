export interface Category {
  id: number;
  slug: string;
  name: string;
  name_uk?: string | null;
  name_en?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_hidden: boolean;
}

export interface CategoryCreateInput {
  slug: string;
  name?: string;
  name_uk?: string;
  name_en?: string;
  is_active: boolean;
  is_hidden: boolean;
}

export interface CategoryUpdateInput {
  slug?: string;
  name?: string;
  name_uk?: string;
  name_en?: string;
  is_active?: boolean;
  is_hidden?: boolean;
}

export interface Subcategory {
  id: number;
  slug: string;
  name: string;
  name_uk?: string | null;
  name_en?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_hidden: boolean;
  category?: number;
}

export interface SubcategoryCreateInput {
  slug: string;
  name?: string;
  name_uk?: string;
  name_en?: string;
  is_active: boolean;
  is_hidden: boolean;
  category?: number;
}

export interface SubcategoryUpdateInput {
  slug?: string;
  name?: string;
  name_uk?: string;
  name_en?: string;
  is_active?: boolean;
  is_hidden?: boolean;
  category?: number;
}

export interface Brand {
  id: number;
  slug: string;
  created_at: string;
  updated_at: string;
  name: string;
  is_active: boolean;
  is_hidden: boolean;
}

export interface BrandCreateInput {
  slug: string;
  name: string;
  is_active: boolean;
  is_hidden: boolean;
}

export interface BrandUpdateInput {
  slug?: string;
  name?: string;
  is_active?: boolean;
  is_hidden?: boolean;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface GoogleAuthInput {
  token: string;
  accept_terms: boolean;
}

export interface LoginInput {
  email_or_phone: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  email: string;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

export interface PasswordChangeInput {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  code: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileUser {
  id: number;
  email: string;
  is_active: boolean;
}

export interface Profile {
  id: number;
  user: ProfileUser;
  first_name: string;
  last_name: string;
  surname: string;
  gender: number;
  clothing_size: number;
  shoe_size: number;
  birthday: string;
  phone: string;
}

export interface ProfileUpdateInput {
  first_name?: string;
  last_name?: string;
  surname?: string;
  gender?: number;
  clothing_size?: number;
  shoe_size?: number;
  birthday?: string;
  phone?: string;
}

export interface ActivationCodeInput {
  code: string;
  email: string;
}

export interface ResendActivationInput {
  email: string;
}

export interface CartItem {
  productId: number;
  variantId: number;
  quantity: number;
  brand: string;
  title: string;
  price: number;
  currency: string;
  imageSrc: string;
  imageAlt: string;
  sku?: string;
  color?: string;
  size?: string;
}

export interface WishlistItem {
  productId: string;
  favoriteId?: number;
  variantId?: number;
}

export interface ApiOrderItem {
  id: number;
  product_variant: number | null;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface ApiOrder {
  id: number;
  status: string;
  currency_code: string;
  total_amount: string;
  promo_code?: string;
  promo_discount?: string;
  items: ApiOrderItem[];
  created_at: string;
}

export interface AdminOrder extends ApiOrder {
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  phone?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface Favorite {
  id: number;
  variantId: number;
  productId: string;
}

export type FavoriteCreateInput = {
  product_variant: number;
};

export type FavoriteUpdateInput = {
  product_variant?: number;
};

/** Raw product from GET /api/products/ */
export interface ApiProduct {
  id: number;

  // Старые поля API — сохраняем совместимость
  name: string;
  description: string;

  // Локализованные поля
  name_uk?: string | null;
  name_en?: string | null;
  description_uk?: string | null;
  description_en?: string | null;

  slug: string;
  product_code?: string | null;
  brand: number;
  subcategory: number;
  is_active: boolean;
  is_hidden: boolean;
  variants?: ProductVariant[];
}

export interface ProductWriteInput {
  name?: string;
  description?: string;

  name_uk?: string | null;
  name_en?: string | null;
  description_uk?: string | null;
  description_en?: string | null;

  slug: string;
  brand: number;
  subcategory: number;
  is_active: boolean;
  is_hidden: boolean;
}

export interface CatalogColor {
  id: number;
  name: string;
  hex_code: string;
  is_active: boolean;
}

export interface CatalogSize {
  id: number;
  name: string;
  size_type: string;
  sort_order: number;
}

export type ProductVariantGender = 'male' | 'female' | 'unisex';

export interface ProductVariant {
  id: number;
  product: number;
  size: number | null;
  color: number | null;
  sku: string;
  stock: number;
  price?: string | null;
  gender: ProductVariantGender;
  is_active: boolean;
}

export interface ProductVariantWrite {
  product: number;
  size: number | null;
  color: number | null;
  sku: string;
  stock: number;
  gender: ProductVariantGender;
  is_active: boolean;
}

export interface ProductImageRecord {
  id: number;
  product_variant: number;
  image: string;
  is_main: boolean;
  sort_order: number;
}

export interface Discount {
  id: number;
  product_variant: number;
  discount_type: string;
  amount: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
}

export interface CurrencyAmount {
  id: number;
  product_variant: number;
  currency_code: string;
  amount: string;
}

export type CurrencyWriteInput = Omit<CurrencyAmount, 'id'>;

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductPrice {
  current: number;
  currency: string;
}

export interface ProductLink {
  href: string;
  label: string;
}

export interface RelatedProductCard {
  id: string;
  image: ProductImage;
  title: string;
  price: string;
}

export interface ProductCardData {
  id: number;
  brand: string;
  title: string;
  description: string[];
  price: ProductPrice;
  code: string;
  rating: number;
  size: string[];
  images: {
    main: {
      front: ProductImage;
      back: ProductImage;
    };
    gallery: ProductImage[];
    colors: ProductImage[];
  };
  link: ProductLink;
  botonImages: RelatedProductCard[];
}
