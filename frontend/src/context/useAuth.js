import { useContext } from "react";
import { AuthContext } from "./authCore";

export const useAuth = () => useContext(AuthContext);
