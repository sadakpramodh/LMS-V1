import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_ADMIN_EMAIL,
  getCurrentUser,
  signInLocalUser,
  signOutLocalUser,
  signUpLocalUser,
  type LocalUser,
  getStoredProfile,
} from "@/lib/localData";

type AuthError = { message: string };

interface UserProfile {
  full_name?: string | null;
  is_enabled: boolean;
  avatar_url?: string;
}

interface AuthUser {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string;
  is_enabled: boolean;
  last_sign_in_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const mapProfile = (user: LocalUser, profile: UserProfile | null): UserProfile => {
  if (user.email === DEFAULT_ADMIN_EMAIL) {
    return {
      full_name: profile?.full_name ?? user.full_name ?? user.email,
      is_enabled: true,
      avatar_url: profile?.avatar_url ?? user.avatar_url,
    };
  }

  return {
    full_name: profile?.full_name ?? user.full_name ?? user.email,
    is_enabled: profile?.is_enabled ?? user.is_enabled,
    avatar_url: profile?.avatar_url ?? user.avatar_url,
  };
};

const normalizeUser = (user: LocalUser | null): AuthUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    is_enabled: user.is_enabled,
    last_sign_in_at: user.last_sign_in_at,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((nextUser: LocalUser | null) => {
    const mapped = normalizeUser(nextUser);
    setUser(mapped);

    if (nextUser) {
      const storedProfile = getStoredProfile(nextUser.id);
      setProfile(mapProfile(nextUser, storedProfile));
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const current = getCurrentUser();
    applyUser(current);
    setLoading(false);
  }, [applyUser]);

  const signIn = async (email: string, password: string) => {
    const { user: foundUser, error } = signInLocalUser(email, password);
    if (error) {
      return { error: { message: error } };
    }

    applyUser(foundUser);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { user: newUser, error } = signUpLocalUser(email, password, fullName);
    if (error) {
      return { error: { message: error } };
    }

    applyUser(newUser);
    return { error: null };
  };

  const signOut = async () => {
    signOutLocalUser();
    applyUser(null);
  };

  const refreshProfile = async () => {
    const current = getCurrentUser();
    applyUser(current);
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    loading,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
