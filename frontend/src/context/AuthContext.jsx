import React, { createContext, useContext, useState } from "react";
import { loginUser } from "../services/authService";

const AuthContext = createContext(null);

export const roleRoutes = {
  admin: "/admin",
  patient: "/patient_dashboard",
  receptionist: "/receptionist",
  technician: "/technician",
  pathologist: "/pathologist"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userId", data.user.id);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
