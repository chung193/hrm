export type StoredUserPayload = {
  id?: number;
  name?: string;
  email?: string;
  avatar?: string;
  image?: string;
  photo?: string;
  token?: string;
  access_token?: string;
  token_type?: string;
  data?: {
    id?: number;
    name?: string;
    email?: string;
    avatar?: string;
    token?: string;
    access_token?: string;
    token_type?: string;
  };
  user?: {
    id?: number;
    name?: string;
    email?: string;
    avatar?: string;
    image?: string;
    photo?: string;
    token?: string;
    access_token?: string;
    token_type?: string;
  };
};

export type AuthProfile = {
  isAuthenticated: boolean;
  id: number | null;
  name: string;
  email: string;
  avatar: string;
  token: string;
  tokenType: string;
};

export const AUTH_PROFILE_UPDATED_EVENT = 'auth-profile-updated';

const emitAuthProfileUpdated = (): void => {
  window.dispatchEvent(new CustomEvent(AUTH_PROFILE_UPDATED_EVENT));
};

const EMPTY_AUTH_PROFILE: AuthProfile = {
  isAuthenticated: false,
  id: null,
  name: '',
  email: '',
  avatar: '',
  token: '',
  tokenType: 'Bearer',
};

export const readStoredUser = (): StoredUserPayload | null => {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUserPayload;
  } catch {
    return null;
  }
};

export const getAuthProfile = (): AuthProfile => {
  const stored = readStoredUser();
  if (!stored) return EMPTY_AUTH_PROFILE;

  const token =
    stored.token ||
    stored.access_token ||
    stored.data?.token ||
    stored.data?.access_token ||
    stored.user?.token ||
    stored.user?.access_token ||
    '';

  const tokenType =
    stored.token_type || stored.data?.token_type || stored.user?.token_type || 'Bearer';

  const idCandidates = [stored.id, stored.data?.id, stored.user?.id];
  const id = idCandidates.find((value): value is number => typeof value === 'number') ?? null;

  const name =
    stored.name ||
    stored.data?.name ||
    stored.user?.name ||
    '';

  const email =
    stored.email ||
    stored.data?.email ||
    stored.user?.email ||
    '';

  const avatar =
    stored.avatar ||
    stored.data?.avatar ||
    stored.user?.avatar ||
    stored.image ||
    stored.user?.image ||
    stored.photo ||
    stored.user?.photo ||
    '';

  return {
    isAuthenticated: Boolean(token),
    id,
    name,
    email,
    avatar,
    token,
    tokenType,
  };
};

export const persistAuthPayload = (payload: StoredUserPayload): void => {
  const token =
    payload.token ||
    payload.access_token ||
    payload.data?.token ||
    payload.data?.access_token ||
    payload.user?.token ||
    payload.user?.access_token ||
    '';

  const tokenType =
    payload.token_type || payload.data?.token_type || payload.user?.token_type || 'Bearer';

  localStorage.setItem(
    'user',
    JSON.stringify({
      ...payload,
      token,
      access_token: token,
      token_type: tokenType,
    })
  );
  emitAuthProfileUpdated();
};

export const syncStoredUserProfile = (profile: {
  id?: number | null;
  name?: string;
  email?: string;
  avatar?: string;
}): void => {
  const current = readStoredUser() || {};
  const nextUser = {
    ...(current.user || {}),
    ...(typeof profile.id === 'number' ? { id: profile.id } : {}),
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.email !== undefined ? { email: profile.email } : {}),
    ...(profile.avatar !== undefined ? { avatar: profile.avatar } : {}),
  };

  persistAuthPayload({
    ...current,
    ...(typeof profile.id === 'number' ? { id: profile.id } : {}),
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.email !== undefined ? { email: profile.email } : {}),
    ...(profile.avatar !== undefined ? { avatar: profile.avatar } : {}),
    user: nextUser,
  });
};

export const clearStoredUser = (): void => {
  localStorage.removeItem('user');
  emitAuthProfileUpdated();
};
