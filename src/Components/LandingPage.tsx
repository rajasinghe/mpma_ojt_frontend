import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Loader from "./ui/Loader/Loader";
import { useEffect, useState } from "react";
import api from "../api";
import { useSession } from "../contexts/SessionContext";
import Swal from "sweetalert2";

export default function LandingPage() {
  const [authenticating, setAuthenticating] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useSession();

  // function to retry API calls
  const retryApiCall = async (
    apiCall: () => Promise<any>,
    maxRetries = 3,
    delay = 1000
  ) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        console.log(`API call attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw error; // Throw on final attempt
        }

        // Only retry on network errors, not auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error; // Don't retry auth errors
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  };

  // Helper function to check network connectivity
  const checkNetworkConnection = async () => {
    try {
      // Simple connectivity check
      await fetch(api.defaults.baseURL + "/health", {
        method: "HEAD",
        mode: "no-cors",
      });
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const initializeAuth = async () => {
      //receive the token from the localstorage
      const token = localStorage.getItem("token");
      console.log("Landing page location:", location);
      console.log(
        "Landing page effect - token:",
        token ? "exists" : "not found"
      );

      if (token) {
        console.log("Setting up authentication with token");
        api.defaults.headers.common.Authorization = token;
        login(token);

        // Add small delay to prevent race condition with SessionContext
        setTimeout(() => {
          if (isMounted) {
            authenticate();
          }
        }, 100);
      } else {
        console.log("No token found, redirecting to login");
        navigate("/login");
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const authenticate = async () => {
    try {
      console.log("Starting authentication process...");
      setAuthenticating(true);

      // Check network connectivity first
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        throw new Error(
          "Network connection failed. Please check your internet connection."
        );
      }

      // Retry authentication with network error handling
      const response = await retryApiCall(() => api.get("/auth"), 2, 1000);
      console.log("Authentication successful:", response.data);

      // Navigate only after successful authentication
      if (location.pathname === "/") {
        navigate("/OJT/trainees");
      }
    } catch (error: any) {
      console.error("Authentication failed:", error);

      // Clear invalid token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("hasLoggedIn");
      delete api.defaults.headers.common.Authorization;

      // Determine error message based on error type
      let errorMessage = "Authentication failed. Please try again.";
      let errorTitle = "Authentication Error";

      if (error.message?.includes("Network connection failed")) {
        errorTitle = "Connection Error";
        errorMessage =
          "Unable to connect to server. Please check your internet connection and try again.";
      } else if (error.response?.status === 401) {
        errorTitle = "Session Expired";
        errorMessage =
          "Your session has expired or is invalid. Please login again.";
      } else if (
        error.code === "ECONNREFUSED" ||
        error.code === "ERR_NETWORK"
      ) {
        errorTitle = "Server Unavailable";
        errorMessage =
          "Cannot connect to the server. Please contact your administrator or try again later.";
      }

      // Show user-friendly error message
      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#4154f1",
      }).then(() => {
        navigate("/login");
      });
    } finally {
      setAuthenticating(false);
    }
  };
  return (
    <>
      {authenticating ? (
        <Loader text="Authenticating..." />
      ) : (
        <Outlet context={user} />
      )}
    </>
  );
}
