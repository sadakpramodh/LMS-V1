import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type AuthError, type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ADMIN_EMAIL = "sadakpramodh_maduru@welspun.com";

interface UserProfile {
  full_name?: string | null;
  is_enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ensureAdminPermissions = async (session: Session | null) => {
  if (session?.user?.email !== DEFAULT_ADMIN_EMAIL) {
    return;
  }

  try {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grant-admin-permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (error: unknown) {
    console.error("Error granting admin permissions:", error);
  }
};

const mapProfile = (
  authUser: User,
  profile: UserProfile | null
): UserProfile => {
  if (authUser.email === DEFAULT_ADMIN_EMAIL) {
    return {
      full_name: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email,
      is_enabled: true,
    };
  }

  if (profile) {
    return profile;
  }

  return {
    full_name: authUser.user_metadata?.full_name ?? authUser.email,
    is_enabled: false,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, is_enabled")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return {
        full_name: data?.full_name ?? null,
        is_enabled: Boolean(data?.is_enabled),
      };
    } catch (error: unknown) {
      console.error("Unexpected error fetching profile:", error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const latest = await fetchProfile(user.id);
    setProfile(mapProfile(user, latest));
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        const profileData = await fetchProfile(nextUser.id);
        if (isMounted) {
          setProfile(mapProfile(nextUser, profileData));
        }
        await ensureAdminPermissions(nextSession);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        await applySession(nextSession);
      }
    );

    void supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      void applySession(existingSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
