'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from '@/lib/firebase-config';

type UserRole = 'superadmin' | 'staff';

interface User {
  isLoggedIn: boolean;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
}

const users = [
  {
    username: 'superadmin',
    password: 'superpassword',
    user: {
      isLoggedIn: true,
      displayName: 'Super Admin',
      email: 'superadmin@eastcoast.lk',
      photoURL: '',
      role: 'superadmin' as UserRole,
    },
  },
  {
    username: 'Admin',
    password: 'password',
    user: {
      isLoggedIn: true,
      displayName: 'Admin Staff',
      email: 'admin@eastcoast.lk',
      photoURL: '',
      role: 'staff' as UserRole,
    },
  },
];


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  db: Database | null;
  app: FirebaseApp | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const initializedApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      const database = getDatabase(initializedApp);
      setApp(initializedApp);
      setDb(database);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to the database. Please check your Firebase configuration.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname === '/login';
      if (!user && !isAuthRoute) {
        router.push('/login');
      }
      if (user && isAuthRoute) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (username?: string, password?: string) => {
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      localStorage.setItem('user', JSON.stringify(foundUser.user));
      setUser(foundUser.user);
      toast({
        title: 'Success!',
        description: 'You have been signed in successfully.',
      });
      router.push('/dashboard');
    } else {
      throw new Error('Invalid username or password.');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signOut, db, app }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
