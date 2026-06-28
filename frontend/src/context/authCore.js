import { createContext } from "react";

export const AuthContext = createContext(null);

export const roleRoutes = {
  admin: "/admin",
  patient: "/patient_dashboard",
  receptionist: "/receptionist/dashboard",
  technician: "/technician/dashboard",
  pathologist: "/pathologist/dashboard"
};
