import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthState {
  user: User | null;
  isSuperadmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        // Force a token refresh so a freshly granted claim is picked up.
        const token = await nextUser.getIdTokenResult(true);
        setIsSuperadmin(token.claims.role === "superadmin");
      } else {
        setIsSuperadmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isSuperadmin,
      loading,
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
      },
      signOutUser: async () => {
        await signOut(auth);
      },
    }),
    [user, isSuperadmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
