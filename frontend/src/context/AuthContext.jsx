// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("remo_user"));
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { token, user: u } = res.data;
      localStorage.setItem("remo_token", token);
      localStorage.setItem("remo_user", JSON.stringify(u));
      setUser(u);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      const { token, user: u } = res.data;
      localStorage.setItem("remo_token", token);
      localStorage.setItem("remo_user", JSON.stringify(u));
      setUser(u);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("remo_token");
    localStorage.removeItem("remo_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);