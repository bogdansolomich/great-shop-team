export type SavedCheckoutAddress = {
  firstName?: string;
  lastName?: string;
  phoneIso?: string;
  phone?: string;
  email?: string;
  city?: string;
  cityRef?: string;
  warehouse?: string;
  warehouseRef?: string;
  notes?: string;
};

export const SAVED_CHECKOUT_ADDRESS_KEY = 'wearly.checkout.address';

function readOptionalString(record: Record<string, unknown>, key: keyof SavedCheckoutAddress) {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

export function readSavedCheckoutAddress(): SavedCheckoutAddress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVED_CHECKOUT_ADDRESS_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    return {
      firstName: readOptionalString(record, 'firstName'),
      lastName: readOptionalString(record, 'lastName'),
      phoneIso: readOptionalString(record, 'phoneIso'),
      phone: readOptionalString(record, 'phone'),
      email: readOptionalString(record, 'email'),
      city: readOptionalString(record, 'city'),
      cityRef: readOptionalString(record, 'cityRef'),
      warehouse: readOptionalString(record, 'warehouse'),
      warehouseRef: readOptionalString(record, 'warehouseRef'),
      notes: readOptionalString(record, 'notes'),
    };
  } catch {
    window.localStorage.removeItem(SAVED_CHECKOUT_ADDRESS_KEY);
    return null;
  }
}

export function saveCheckoutAddress(address: SavedCheckoutAddress) {
  if (typeof window === 'undefined') return;
  const current = readSavedCheckoutAddress();
  window.localStorage.setItem(
    SAVED_CHECKOUT_ADDRESS_KEY,
    JSON.stringify({ ...current, ...address }),
  );
}

export function clearCheckoutAddress() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SAVED_CHECKOUT_ADDRESS_KEY);
}
