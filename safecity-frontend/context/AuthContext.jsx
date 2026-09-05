"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On first load, restore session from localStorage so a page refresh
  // doesn't kick the user back to login
  useEffect(() => {
    const storedUser = localStorage.getItem("safecity_user");
    const token = localStorage.getItem("safecity_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { token, ...userData } = data;

    localStorage.setItem("safecity_token", token);
    localStorage.setItem("safecity_user", JSON.stringify(userData));
    setUser(userData);

    // Route each role to its own landing screen
    if (userData.role === "super_admin") router.push("/admin/cameras");
    else if (userData.role === "operator") router.push("/operator/alerts");
    else if (userData.role === "checkpoint_officer") router.push("/checkpoint/alerts");
  };

  const logout = () => {
    localStorage.removeItem("safecity_token");
    localStorage.removeItem("safecity_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
