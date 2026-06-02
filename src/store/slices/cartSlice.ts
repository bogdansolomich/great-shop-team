import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '@/store/types';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    updateCartItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.quantity = action.payload.quantity;
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, updateCartItem, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
