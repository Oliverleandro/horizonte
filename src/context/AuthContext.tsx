import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/finance';

interface LocalAccount {
  user: User;
  profile: UserProfile;
  password?: string;
}

const LOCAL_STORAGE_USERS_KEY = 'horizonte_local_users';
const LOCAL_STORAGE_SESSION_KEY = 'horizonte_current_session';

const getLocalUsers = (): Record<string, LocalAccount> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalUsers = (users: Record<string, LocalAccount>) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Falha ao salvar usuários locais:', e);
  }
};

const getLocalSession = (): { user: User; session: Session; profile: UserProfile } | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalSession = (data: { user: User; session: Session; profile: UserProfile } | null) => {
  try {
    if (data) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  } catch (e) {
    console.error('Falha ao atualizar sessão local:', e);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfileName: (name: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  isCloudConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.hash.includes('type=recovery');
  });

  const clearError = () => setError(null);

  const translateAuthError = (errMessage: string): string => {
    const msg = errMessage.toLowerCase();
    if (
      msg.includes('invalid login credentials') ||
      msg.includes('invalid_grant') ||
      msg.includes('invalid credentials')
    ) {
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'Este e-mail já está cadastrado. Que tal fazer login ou recuperar sua senha?';
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres para sua segurança.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Por favor, confirme seu e-mail pelo link que enviamos antes de entrar.';
    }
    return 'Não foi possível completar a operação. Tente novamente.';
  };

  const fetchProfile = async (userId: string, userEmail: string, userMetadata?: Record<string, unknown>) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error: fetchErr } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') {
          const newProfile: UserProfile = {
            id: userId,
            email: userEmail,
            nome: (userMetadata?.full_name as string) || (userMetadata?.name as string) || userEmail.split('@')[0],
            saldo_atual: 0,
            onboarding_concluido: false,
          };
          const { data: created, error: insertErr } = await supabase
            .from('perfis')
            .insert({
              id: newProfile.id,
              email: newProfile.email,
              nome: newProfile.nome,
              saldo_atual: newProfile.saldo_atual,
              onboarding_concluido: newProfile.onboarding_concluido,
            })
            .select()
            .single();

          if (!insertErr && created) {
            setProfile(created);
          }
        }
      } else if (data) {
        setProfile(data);
      }
    } catch {
      // Ignore
    }
  };

  // Check active session on startup
  useEffect(() => {
    let isMounted = true;

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionErr }) => {
        if (!isMounted) return;
        if (sessionErr || !currentSession) {
          // Check local session as fallback
          const localSess = getLocalSession();
          if (localSess) {
            setSession(localSess.session);
            setUser(localSess.user);
            setProfile(localSess.profile);
          }
          setIsLoading(false);
          return;
        }
        setSession(currentSession);
        setUser(currentSession.user);
        fetchProfile(currentSession.user.id, currentSession.user.email || '', currentSession.user.user_metadata)
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }).catch(() => {
        if (isMounted) {
          const localSess = getLocalSession();
          if (localSess) {
            setSession(localSess.session);
            setUser(localSess.user);
            setProfile(localSess.profile);
          }
          setIsLoading(false);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email || '', newSession.user.user_metadata);
        } else {
          saveLocalSession(null);
          setProfile(null);
        }
        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    } else {
      // Local Storage Mode
      const localSess = getLocalSession();
      if (localSess) {
        setSession(localSess.session);
        setUser(localSess.user);
        setProfile(localSess.profile);
      }
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (signInErr) {
          setError(translateAuthError(signInErr.message));
          setIsLoading(false);
          return false;
        }

        if (data.user) {
          await fetchProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        }
        setIsLoading(false);
        return true;
      } catch {
        // Fall back to local check if offline
      }
    }

    // Local authentication
    try {
      const localUsers = getLocalUsers();
      const account = localUsers[cleanEmail];

      if (!account) {
        setError('Conta não encontrada com este e-mail. Que tal criar uma conta nova na aba "Criar Conta"?');
        setIsLoading(false);
        return false;
      }

      if (account.password && account.password !== pass) {
        setError('Senha incorreta. Verifique os dados digitados e tente novamente.');
        setIsLoading(false);
        return false;
      }

      const localSession: Session = {
        access_token: 'local-token-' + account.user.id,
        refresh_token: 'local-refresh-' + account.user.id,
        expires_in: 3600 * 24 * 30,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
        token_type: 'bearer',
        user: account.user,
      };

      saveLocalSession({ user: account.user, session: localSession, profile: account.profile });
      setUser(account.user);
      setSession(localSession);
      setProfile(account.profile);
      setIsLoading(false);
      return true;
    } catch {
      setError('Não foi possível entrar na conta. Tente novamente.');
      setIsLoading(false);
      return false;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string
  ): Promise<{ success: boolean; needsEmailConfirmation?: boolean }> => {
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (isSupabaseConfigured) {
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: cleanName,
              name: cleanName,
            },
          },
        });

        if (signUpErr) {
          setError(translateAuthError(signUpErr.message));
          setIsLoading(false);
          return { success: false };
        }

        const needsEmailConfirmation = !data.session && Boolean(data.user);

        if (data.user && data.session) {
          await fetchProfile(data.user.id, data.user.email || '', { full_name: cleanName });
        }

        setIsLoading(false);
        return { success: true, needsEmailConfirmation };
      } catch {
        // Fall back to local account creation
      }
    }

    // Local authentication: create new local account
    try {
      const localUsers = getLocalUsers();
      if (localUsers[cleanEmail]) {
        setError('Este e-mail já está cadastrado. Que tal fazer login com ele?');
        setIsLoading(false);
        return { success: false };
      }

      const userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const localUser: User = {
        id: userId,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: cleanName, name: cleanName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
        phone: '',
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      const localProfile: UserProfile = {
        id: userId,
        email: cleanEmail,
        nome: cleanName,
        saldo_atual: 0,
        onboarding_concluido: false,
        created_at: new Date().toISOString(),
      };

      const localSession: Session = {
        access_token: 'local-token-' + userId,
        refresh_token: 'local-refresh-' + userId,
        expires_in: 3600 * 24 * 30,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
        token_type: 'bearer',
        user: localUser,
      };

      localUsers[cleanEmail] = {
        user: localUser,
        profile: localProfile,
        password: pass,
      };

      saveLocalUsers(localUsers);
      saveLocalSession({ user: localUser, session: localSession, profile: localProfile });

      setUser(localUser);
      setSession(localSession);
      setProfile(localProfile);
      setIsLoading(false);
      return { success: true, needsEmailConfirmation: false };
    } catch {
      setError('Não foi possível criar a conta local. Tente novamente.');
      setIsLoading(false);
      return { success: false };
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    if (isSupabaseConfigured) {
      try {
        const { error: googleErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (googleErr) {
          setError(translateAuthError(googleErr.message));
        }
        return;
      } catch {
        // Fall through to local Google mock
      }
    }

    // Local Google Mock
    const googleEmail = 'google.user@exemplo.com';
    const localUsers = getLocalUsers();
    let account = localUsers[googleEmail];
    if (!account) {
      const userId = 'usr_google_' + Date.now().toString(36);
      const googleUser: User = {
        id: userId,
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Usuário Google', name: 'Usuário Google' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: googleEmail,
        phone: '',
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;
      const googleProfile: UserProfile = {
        id: userId,
        email: googleEmail,
        nome: 'Usuário Google',
        saldo_atual: 0,
        onboarding_concluido: false,
        created_at: new Date().toISOString(),
      };
      account = { user: googleUser, profile: googleProfile };
      localUsers[googleEmail] = account;
      saveLocalUsers(localUsers);
    }

    const session: Session = {
      access_token: 'local-token-' + account.user.id,
      refresh_token: 'local-refresh-' + account.user.id,
      expires_in: 3600 * 24 * 30,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
      token_type: 'bearer',
      user: account.user,
    };

    saveLocalSession({ user: account.user, session, profile: account.profile });
    setUser(account.user);
    setSession(session);
    setProfile(account.profile);
  };

  const signInAsDemo = async () => {
    setError(null);
    setIsLoading(true);
    const demoEmail = 'demonstracao@horizonte.app';
    const localUsers = getLocalUsers();
    let account = localUsers[demoEmail];
    if (!account) {
      const userId = 'usr_demo_sample';
      const demoUser: User = {
        id: userId,
        app_metadata: { provider: 'demo' },
        user_metadata: { full_name: 'Usuário Demonstração', name: 'Usuário Demonstração' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: demoEmail,
        phone: '',
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;
      const demoProfile: UserProfile = {
        id: userId,
        email: demoEmail,
        nome: 'Usuário Demonstração',
        saldo_atual: 2450.00,
        onboarding_concluido: true,
        created_at: new Date().toISOString(),
      };
      account = { user: demoUser, profile: demoProfile };
      localUsers[demoEmail] = account;
      saveLocalUsers(localUsers);
    }

    const session: Session = {
      access_token: 'local-token-' + account.user.id,
      refresh_token: 'local-refresh-' + account.user.id,
      expires_in: 3600 * 24 * 30,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
      token_type: 'bearer',
      user: account.user,
    };

    saveLocalSession({ user: account.user, session, profile: account.profile });
    setUser(account.user);
    setSession(session);
    setProfile(account.profile);
    setIsLoading(false);
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}`,
        });
        if (resetErr) {
          setError(translateAuthError(resetErr.message));
          return false;
        }
        return true;
      } catch {
        // Fallback below
      }
    }

    return true;
  };

  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    saveLocalSession(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);
  };

  const updateProfileName = async (name: string): Promise<boolean> => {
    if (!user) return false;
    const cleanName = name.trim();

    try {
      if (isSupabaseConfigured) {
        const { error: updateErr } = await supabase
          .from('perfis')
          .update({ nome: cleanName })
          .eq('id', user.id);

        if (updateErr) {
          return false;
        }
        await supabase.auth.updateUser({ data: { full_name: cleanName, name: cleanName } });
      }

      const updatedProfile: UserProfile = profile
        ? { ...profile, nome: cleanName }
        : {
            id: user.id,
            email: user.email || '',
            nome: cleanName,
            saldo_atual: 0,
            onboarding_concluido: false,
          };

      setProfile(updatedProfile);

      const localUsers = getLocalUsers();
      if (user.email && localUsers[user.email.toLowerCase()]) {
        localUsers[user.email.toLowerCase()].profile = updatedProfile;
        localUsers[user.email.toLowerCase()].user.user_metadata = {
          ...localUsers[user.email.toLowerCase()].user.user_metadata,
          full_name: cleanName,
          name: cleanName,
        };
        saveLocalUsers(localUsers);
      }

      const currSession = getLocalSession();
      if (currSession) {
        currSession.profile = updatedProfile;
        saveLocalSession(currSession);
      }

      return true;
    } catch {
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error: rpcErr } = await supabase.rpc('delete_my_account');
        if (rpcErr) {
          console.error('Erro na exclusão via RPC delete_my_account:', rpcErr);
          setError('Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.');
          setIsLoading(false);
          return false;
        }
        await supabase.auth.signOut();
      }

      const localUsers = getLocalUsers();
      if (user.email && localUsers[user.email.toLowerCase()]) {
        delete localUsers[user.email.toLowerCase()];
        saveLocalUsers(localUsers);
      }
      localStorage.removeItem(`horizonte_finance_${user.id}`);
      saveLocalSession(null);

      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error('Falha ao excluir conta:', e);
      setError('Não foi possível excluir sua conta. Tente novamente.');
      setIsLoading(false);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user && isSupabaseConfigured) {
      await fetchProfile(user.id, user.email || '');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        error,
        clearError,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemo,
        sendPasswordReset,
        signOut,
        updateProfileName,
        deleteAccount,
        refreshProfile,
        isPasswordRecovery,
        setIsPasswordRecovery,
        isCloudConnected: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
