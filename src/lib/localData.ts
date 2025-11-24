import { type Permission } from "@/types/permissions";

const isBrowser = typeof window !== "undefined";

const USERS_KEY = "lms-users";
const SESSION_KEY = "lms-session";
const PERMISSIONS_KEY = "lms-permissions";
const DISPUTES_KEY = "lms-disputes";
const PROFILES_KEY = "lms-profiles";
const ALERTS_KEY = "lms-alert-settings";

export const DEFAULT_ADMIN_EMAIL = "sadakpramodh_maduru@welspun.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

export interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name?: string;
  avatar_url?: string;
  is_enabled: boolean;
  last_sign_in_at?: string;
}

export interface StoredProfile {
  full_name?: string;
  avatar_url?: string;
}

export interface StoredAlertSettings {
  email_alerts: boolean;
  whatsapp_alerts: boolean;
  whatsapp_number: string;
}

export interface StoredDispute {
  id: string;
  user_id: string;
  company: string;
  dispute_type: string;
  value: number;
  notice_from: string;
  notice_date: string;
  reply_due_date: string;
  responsible_user: string;
  description: string | null;
  status: string;
  document_paths: string[];
  created_at: string;
  updated_at: string;
}

const readJson = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse local storage key ${key}:`, error);
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to persist local storage key ${key}:`, error);
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const seedAdminUser = (users: LocalUser[]): LocalUser[] => {
  if (users.some((user) => user.email === DEFAULT_ADMIN_EMAIL)) {
    return users;
  }

  const admin: LocalUser = {
    id: generateId(),
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    full_name: "Welspun Admin",
    is_enabled: true,
    avatar_url: "",
    last_sign_in_at: new Date().toISOString(),
  };

  const nextUsers = [...users, admin];
  writeJson(USERS_KEY, nextUsers);
  return nextUsers;
};

export const getStoredUsers = (): LocalUser[] => {
  const users = readJson<LocalUser[]>(USERS_KEY, []);
  return seedAdminUser(users);
};

export const saveStoredUsers = (users: LocalUser[]) => {
  writeJson(USERS_KEY, users);
};

export const getCurrentUser = (): LocalUser | null => {
  const userId = readJson<string | null>(SESSION_KEY, null);
  if (!userId) return null;
  const users = getStoredUsers();
  return users.find((item) => item.id === userId) ?? null;
};

export const setCurrentUser = (userId: string | null) => {
  if (!isBrowser) return;
  if (userId) {
    writeJson(SESSION_KEY, userId);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
};

export const signInLocalUser = (
  email: string,
  password: string
): { user: LocalUser | null; error: string | null } => {
  const users = getStoredUsers();
  const user = users.find((item) => item.email === email);

  if (!user || user.password !== password) {
    return { user: null, error: "Invalid email or password" };
  }

  const updatedUser: LocalUser = {
    ...user,
    last_sign_in_at: new Date().toISOString(),
  };

  const nextUsers = users.map((item) => (item.id === user.id ? updatedUser : item));
  saveStoredUsers(nextUsers);
  setCurrentUser(updatedUser.id);

  return { user: updatedUser, error: null };
};

export const signUpLocalUser = (
  email: string,
  password: string,
  fullName: string
): { user: LocalUser | null; error: string | null } => {
  const users = getStoredUsers();
  if (users.some((item) => item.email === email)) {
    return { user: null, error: "Email is already registered" };
  }

  const newUser: LocalUser = {
    id: generateId(),
    email,
    password,
    full_name: fullName,
    is_enabled: true,
    avatar_url: "",
    last_sign_in_at: new Date().toISOString(),
  };

  const nextUsers = [...users, newUser];
  saveStoredUsers(nextUsers);
  setCurrentUser(newUser.id);

  return { user: newUser, error: null };
};

export const signOutLocalUser = () => {
  setCurrentUser(null);
};

export const getPermissionsMap = (): Record<string, Permission[]> => {
  return readJson<Record<string, Permission[]>>(PERMISSIONS_KEY, {});
};

export const savePermissionsMap = (map: Record<string, Permission[]>) => {
  writeJson(PERMISSIONS_KEY, map);
};

export const getPermissionsForUser = (
  userId: string,
  email?: string
): Permission[] => {
  if (email === DEFAULT_ADMIN_EMAIL) {
    return [
      "add_dispute",
      "delete_dispute",
      "upload_excel_litigation",
      "add_users",
      "delete_users",
      "export_reports",
    ];
  }

  const permissions = getPermissionsMap();
  return permissions[userId] ?? [];
};

export const updatePermissionsForUser = (
  userId: string,
  permissions: Permission[]
) => {
  const map = getPermissionsMap();
  map[userId] = permissions;
  savePermissionsMap(map);
};

export const getAdminUsersWithPermissions = () => {
  const users = getStoredUsers();
  const permissions = getPermissionsMap();

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? user.email,
    is_enabled: user.is_enabled,
    last_sign_in_at: user.last_sign_in_at,
    permissions: getPermissionsForUser(user.id, user.email),
  }));
};

export const updateUserAccess = (userId: string, isEnabled: boolean) => {
  const users = getStoredUsers();
  const updated = users.map((user) =>
    user.id === userId ? { ...user, is_enabled: isEnabled } : user
  );
  saveStoredUsers(updated);
};

export const getStoredProfile = (userId: string): StoredProfile | null => {
  const profiles = readJson<Record<string, StoredProfile>>(PROFILES_KEY, {});
  return profiles[userId] ?? null;
};

export const updateStoredProfile = (userId: string, profile: StoredProfile) => {
  const profiles = readJson<Record<string, StoredProfile>>(PROFILES_KEY, {});
  profiles[userId] = profile;
  writeJson(PROFILES_KEY, profiles);

  const users = getStoredUsers();
  const updatedUsers = users.map((user) =>
    user.id === userId
      ? { ...user, full_name: profile.full_name ?? user.full_name, avatar_url: profile.avatar_url }
      : user
  );
  saveStoredUsers(updatedUsers);
};

export const getStoredAlertSettings = (
  userId: string
): StoredAlertSettings => {
  const settings = readJson<Record<string, StoredAlertSettings>>(ALERTS_KEY, {});
  return (
    settings[userId] ?? {
      email_alerts: true,
      whatsapp_alerts: false,
      whatsapp_number: "",
    }
  );
};

export const updateStoredAlertSettings = (
  userId: string,
  alertSettings: StoredAlertSettings
) => {
  const settings = readJson<Record<string, StoredAlertSettings>>(ALERTS_KEY, {});
  settings[userId] = alertSettings;
  writeJson(ALERTS_KEY, settings);
};

export const getLocalDisputes = (userId: string): StoredDispute[] => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  return disputes[userId] ?? [];
};

export const addLocalDispute = (
  userId: string,
  payload: Omit<StoredDispute, "id" | "user_id" | "created_at" | "updated_at">,
  documentPaths: string[]
): StoredDispute => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  const now = new Date().toISOString();
  const newDispute: StoredDispute = {
    ...payload,
    id: generateId(),
    user_id: userId,
    document_paths: documentPaths,
    created_at: now,
    updated_at: now,
  };

  const updated = [newDispute, ...(disputes[userId] ?? [])];
  disputes[userId] = updated;
  writeJson(DISPUTES_KEY, disputes);
  return newDispute;
};

export const removeLocalDispute = (userId: string, disputeId: string) => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  const filtered = (disputes[userId] ?? []).filter((item) => item.id !== disputeId);
  disputes[userId] = filtered;
  writeJson(DISPUTES_KEY, disputes);
  return filtered;
};

export const updateLocalDisputeStatus = (
  userId: string,
  disputeId: string,
  status: string
) => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  const updated = (disputes[userId] ?? []).map((item) =>
    item.id === disputeId ? { ...item, status, updated_at: new Date().toISOString() } : item
  );
  disputes[userId] = updated;
  writeJson(DISPUTES_KEY, disputes);
  return updated;
};
