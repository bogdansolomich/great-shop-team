export type AccountProfile = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  user?: {
    email?: string | null;
  };
};

export function readAccountProfile(value: unknown): AccountProfile | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = record.id;
  if (typeof id !== 'number') return null;

  const user = record.user;
  const nestedEmail =
    user && typeof user === 'object' && typeof (user as { email?: unknown }).email === 'string'
      ? (user as { email: string }).email
      : null;

  return {
    id,
    first_name: typeof record.first_name === 'string' ? record.first_name : '',
    last_name: typeof record.last_name === 'string' ? record.last_name : '',
    phone: typeof record.phone === 'string' ? record.phone : '',
    user: nestedEmail ? { email: nestedEmail } : undefined,
  };
}
