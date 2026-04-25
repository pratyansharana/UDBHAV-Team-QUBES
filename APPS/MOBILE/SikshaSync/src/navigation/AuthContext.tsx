import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseconfig'; // Ensure this path is correct

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is the CRITICAL bridge. It listens to Firebase.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("DEBUG (AuthContext): Firebase Auth state changed. User exists:", !!firebaseUser);
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};