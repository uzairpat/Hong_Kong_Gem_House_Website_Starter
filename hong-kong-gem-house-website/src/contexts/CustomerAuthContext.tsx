import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
).replace(/\/$/, '');

export interface CustomerUser {
  id: string;
  email: string;
  fullName: string;
  accountType: string;
}

interface CustomerAuthContextValue {
  user: CustomerUser | null;
  loading: boolean;
  refreshUser: () => Promise<CustomerUser | null>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(undefined);

export function CustomerAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Unable to check the customer session.');
      }

      const result = await response.json() as { user?: CustomerUser | null };
      const nextUser = result.user ?? null;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const csrfResult = await csrfResponse.json().catch(() => ({})) as { csrfToken?: string };

    if (!csrfResponse.ok || !csrfResult.csrfToken) {
      throw new Error('Unable to securely sign out. Please refresh and try again.');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-CSRF-Token': csrfResult.csrfToken,
      },
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error || 'Unable to sign out. Please try again.');
    }

    setUser(null);
  }, []);

  useEffect(() => {
    void refreshUser();

    const handleFocus = () => {
      void refreshUser();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout }),
    [user, loading, refreshUser, logout],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used inside CustomerAuthProvider.');
  }
  return context;
}
