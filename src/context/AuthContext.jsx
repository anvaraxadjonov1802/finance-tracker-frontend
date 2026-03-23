import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access_token") || ""
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refresh_token") || ""
  );
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isAuthenticated = !!accessToken;

  const saveTokens = (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    setAccessToken(access);
    setRefreshToken(refresh);
  };

  const fetchMe = async () => {
    try {
      const response = await api.get("/auth/me/");
      setUser(response.data);
    } catch (error) {
      console.error("Fetch me error:", error);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    const { access, refresh } = response.data;

    saveTokens(access, refresh);
    await fetchMe();
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register/", payload);
    const { access, refresh, user } = response.data;

    saveTokens(access, refresh);
    setUser(user);
    setLoadingUser(false);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken("");
    setRefreshToken("");
    setUser(null);
    setLoadingUser(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchMe();
    } else {
      setUser(null);
      setLoadingUser(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated,
      loadingUser,
      login,
      register,
      logout,
    }),
    [accessToken, refreshToken, user, isAuthenticated, loadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}