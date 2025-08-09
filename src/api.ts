import axios from "axios";
import Swal from "sweetalert2";

const instance = axios.create({
  baseURL: "http://localhost:4000", //https://mpmaojt.slpa.lk
  headers: {
    Accept: "application/json",
  },
});

// Response interceptor to handle session expiration
instance.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized responses (session expired)
    if (error.response?.status === 401) {
      // Don't intercept authentication failures from login endpoint
      // Let the LoginComponent handle these with proper error messages
      if (error.config?.url?.includes("auth/login")) {
        return Promise.reject(error);
      }

      console.log("Session expired - clearing tokens and redirecting to login");

      // Clear the token from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("sessionStartTime");

      // Clear the authorization header
      delete instance.defaults.headers.common.Authorization;

      // Show session expired message
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has expired. Please login again to continue.",
        confirmButtonText: "Go to Login",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => {
        // Redirect to login page
        window.location.href = "/login";
      });
    }

    // Return the error for other status codes
    return Promise.reject(error);
  }
);

export default instance;
