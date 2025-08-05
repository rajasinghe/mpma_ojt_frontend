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
  sessionTimeLeft: number;
  isSessionWarningVisible: boolean;
  login: (token: string) => void;
  logout: () => void;
  hideSessionWarning: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Session timeout constants (in milliseconds)
const SESSION_DURATION = 4 * 60 * 1000; // 1 hour (matches backend TOKEN_EXP_TIME)
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiration
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(() => {
    const token = localStorage.getItem("token");
    const storedStartTime = localStorage.getItem("sessionStartTime");

    if (token && storedStartTime) {
      const elapsed = Date.now() - parseInt(storedStartTime);
      const timeLeft = SESSION_DURATION - elapsed;
      return Math.max(0, timeLeft);
    }

    return 0;
  });
  const [isSessionWarningVisible, setIsSessionWarningVisible] =
    useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Calculate time left in session
  const calculateTimeLeft = useCallback(() => {
    if (!sessionStartTime) return 0;
    const elapsed = Date.now() - sessionStartTime;
    const timeLeft = SESSION_DURATION - elapsed;
    return Math.max(0, timeLeft);
  }, [sessionStartTime]);

  // Login function
  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("sessionStartTime", Date.now().toString());
    api.defaults.headers.common.Authorization = token;
    setIsAuthenticated(true);
    setSessionStartTime(Date.now());
    setSessionTimeLeft(SESSION_DURATION);
    setIsSessionWarningVisible(false);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionStartTime");
    delete api.defaults.headers.common.Authorization;
    setIsAuthenticated(false);
    setUser(null);
    setSessionStartTime(null);
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
    const storedStartTime = localStorage.getItem("sessionStartTime");

    if (token && storedStartTime) {
      api.defaults.headers.common.Authorization = token;
      setIsAuthenticated(true);
      setSessionStartTime(parseInt(storedStartTime)); // Use stored time, not current time
    }

    const interval = setInterval(() => {
      if (sessionStartTime) {
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
        if (timeLeft <= 0) {
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
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [sessionStartTime, calculateTimeLeft, isSessionWarningVisible, logout]);

  // Authenticate user on mount
  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem("token");
      if (token && isAuthenticated) {
        try {
          const response = await api.get("/auth");
          setUser(response.data);
        } catch (error) {
          // Error will be handled by the interceptor
          console.error("Authentication failed:", error);
        }
      }
    };

    authenticateUser();
  }, [isAuthenticated]);

  const value: SessionContextType = {
    isAuthenticated,
    user,
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
