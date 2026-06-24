export type {
  Product,
  ProductColorOption,
  ProductListItem,
  ProductOptions,
  ProductPrice,
} from './model/types';
export { normalizeProduct, parseProducts } from './lib/normalizeProduct';
export { formatProductPrice, mapProductToCatalogCard } from './lib/mapProductToCatalogCard';
