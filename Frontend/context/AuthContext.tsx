import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  username?: string;
  bio?: string;
};

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (userData?: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initial state: false (not logged in)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const login = async (userData?: Partial<UserProfile>) => {
    setIsLoggedIn(true);
    setUser({
      id: userData?.id || 'me',
      email: userData?.email || 'user@example.com',
      displayName: userData?.displayName || 'User',
      username: userData?.username || 'user',
      bio: userData?.bio || '',
    });
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
