import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api";
import Swal from "sweetalert2";

interface SessionContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  sessionTimeLeft: number;
  isSessionWarningVisible: boolean;
  login: (token: string) => void;
  logout: () => void;
  hideSessionWarning: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Add JWT decode function at the top
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

// Session timeout constants (in milliseconds)
const WARNING_TIME = 1 * 60 * 1000; // Show warning 5 minutes before expiration
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(() => {
    const token = localStorage.getItem("token");
    if (!token) return 0;

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return 0;

    const expirationTime = decoded.exp * 1000;
    const timeLeft = expirationTime - Date.now();
    return Math.max(0, timeLeft);
  });
  const [isSessionWarningVisible, setIsSessionWarningVisible] =
    useState<boolean>(false);
  // const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Calculate time left in session
  const calculateTimeLeft = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return 0;

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return 0;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const timeLeft = expirationTime - Date.now();
    return Math.max(0, timeLeft);
  }, []);

  // Login function
  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = token;
    setIsAuthenticated(true);
    setIsSessionWarningVisible(false);

    // Update sessionTimeLeft immediately
    const decoded = decodeJWT(token);
    if (decoded && decoded.exp) {
      const expirationTime = decoded.exp * 1000;
      const timeLeft = expirationTime - Date.now();
      setSessionTimeLeft(Math.max(0, timeLeft));
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionStartTime"); // Clean up old storage
    delete api.defaults.headers.common.Authorization;
    setIsAuthenticated(false);
    setUser(null);
    setSessionTimeLeft(0);
    setIsSessionWarningVisible(false);
  }, []);

  // Hide session warning
  const hideSessionWarning = useCallback(() => {
    setIsSessionWarningVisible(false);
  }, []);

  // Session monitoring effect
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api.defaults.headers.common.Authorization = token;
      setIsAuthenticated(true);
    }

    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setSessionTimeLeft(timeLeft);

      // Show warning when 5 minutes left
      if (
        timeLeft <= WARNING_TIME &&
        timeLeft > 0 &&
        !isSessionWarningVisible
      ) {
        setIsSessionWarningVisible(true);
      }

      // Auto logout when session expires
      if (timeLeft <= 0 && localStorage.getItem("token")) {
        logout();
        Swal.fire({
          icon: "warning",
          title: "Session Expired",
          text: "Your session has expired. Please login again to continue.",
          confirmButtonText: "Go to Login",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          window.location.href = "/login";
        });
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, isSessionWarningVisible, logout]);

  // Authenticate user on mount
  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem("token");
      if (token && isAuthenticated) {
        try {
          setIsLoading(true);
          setUser(null); // Clear previous user data before fetching new
          const response = await api.get("/auth");
          setUser(response.data);
        } catch (error) {
          console.error("Authentication failed:", error);
          setUser(null); // Clear user on auth failure
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null); // Clear user when not authenticated
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, [isAuthenticated]);

  const value: SessionContextType = {
    isAuthenticated,
    user,
    isLoading,
    sessionTimeLeft,
    isSessionWarningVisible,
    login,
    logout,
    hideSessionWarning,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

// Custom hook to use session context
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
