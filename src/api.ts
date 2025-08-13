import axios from "axios";
import Swal from "sweetalert2";

const instance = axios.create({
  baseURL: "http://10.70.4.34:8000", //https://mpmaojt.slpa.lk http://10.70.4.34:9000/
  headers: {
    Accept: "application/json",
  },
});

// Add request interceptor for network errors
instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle network errors with retry
    if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
      console.log("Network error detected, retrying...");

      // Retry once after 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return instance.request(error.config);
    }

    // Existing 401 handling...
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
