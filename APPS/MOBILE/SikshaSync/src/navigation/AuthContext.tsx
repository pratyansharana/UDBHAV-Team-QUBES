import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseconfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToFirestore = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid);

    await setDoc(
      userRef,
      {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? null,
        email: firebaseUser.email ?? null,
        phoneNumber: firebaseUser.phoneNumber ?? null,
        photoURL: firebaseUser.photoURL ?? null,
        isAnonymous: firebaseUser.isAnonymous,
        providerIds: firebaseUser.providerData.map((provider) => provider?.providerId).filter(Boolean),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('DEBUG (AuthContext): Firebase Auth state changed. User exists:', !!firebaseUser);

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          await syncUserToFirestore(firebaseUser);
        } catch (error) {
          console.error('DEBUG (AuthContext): Failed to sync user profile to Firestore:', error);
        }
      }

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