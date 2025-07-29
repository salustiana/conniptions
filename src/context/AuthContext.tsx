import React, { createContext, useContext, useEffect, useState } from "react";
import { authenticate, createUser, getCurrentUser, setCurrentUser } from "../auth";

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<string | null>;
  signup: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const login = async (username: string, password: string) => {
    const ok = await authenticate(username, password);
    if (ok) {
      setUser(username);
      setCurrentUser(username);
      return null;
    }
    return "Invalid credentials";
  };

  const signup = async (username: string, password: string) => {
    const err = await createUser(username, password);
    if (!err) {
      setUser(username);
    }
    return err;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}; 