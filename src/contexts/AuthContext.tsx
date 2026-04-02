import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  college?: string;
  photoURL?: string;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
