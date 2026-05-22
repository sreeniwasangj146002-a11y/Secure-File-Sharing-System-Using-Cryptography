import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ token, role: localStorage.getItem("role") });
    }
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    setUser({ token: data.token, role: data.role });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
