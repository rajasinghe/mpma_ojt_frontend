import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import "./style.css";
import api from "../../../../api";
import Swal from "sweetalert2";
import { useSession } from "../../../../contexts/SessionContext";
import { AxiosError } from "axios";
import logo from "../../../../assets/SLPA_Logo-Cu9TOj32.png";

interface LoginComponentProps {
  className?: string;
}

function LoginComponent({}: LoginComponentProps) {
  // Enhanced validation schema
  const schema = z.object({
    username: z
      .string()
      .min(1, { message: "Username is required" })
      .min(3, { message: "Username must be at least 3 characters" }),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters" }),
  });
  type loginRequest = z.infer<typeof schema>;

  // State for UI enhancements
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);

  // Check if user has logged in before
  useState(() => {
    const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");
    setIsFirstLogin(!hasLoggedInBefore);
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginRequest>({ resolver: zodResolver(schema) });

  const navigate = useNavigate();
  const { login: sessionLogin } = useSession();

  const onSubmit: SubmitHandler<loginRequest> = async (data) => {
    try {
      setIsLoading(true);
      console.log(data);

      // Show loading state
      Swal.fire({
        title: "Signing you in...",
        text: "Please wait while we verify your credentials",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.post("auth/login", data);
      sessionLogin(response.data);

      console.log(response.data);

      // Success feedback
      await Swal.fire({
        icon: "success",
        title: "Welcome!",
        text: "Login successful. Redirecting...",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/OJT/trainees");
    } catch (error: any) {
      console.log(error);

      // Enhanced error handling
      let errorMessage = "An unexpected error occurred. Please try again.";
      let errorTitle = "Login Failed";

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          errorTitle = "Invalid Credentials";
          errorMessage =
            "The username or password you entered is incorrect. Please check your credentials and try again.";
        } else if (error.response?.status === 429) {
          errorTitle = "Too Many Attempts";
          errorMessage =
            "Too many login attempts. Please wait a few minutes before trying again.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonText: "Try Again",
        confirmButtonColor: "#4154f1",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          {/* Header Section */}
          <div className="login-header">
            <div className="login-logo">
              <img src={logo} alt="MPMA Logo" className="logo-image" />
            </div>
            <h1 className="login-title">
              {isFirstLogin ? "Welcome" : "Welcome Back"}
            </h1>
            <p className="login-subtitle">
              Sign in to your MPMA OJT Management account
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <i className="bi bi-person-circle"></i>
                Username
              </label>
              <div className="input-wrapper">
                <input
                  {...register("username")}
                  id="username"
                  type="text"
                  className={`form-input ${errors.username ? "error" : ""}`}
                  placeholder="Enter your username"
                  disabled={isSubmitting || isLoading}
                  autoComplete="username"
                />
                <i className="bi bi-person input-icon"></i>
              </div>
              {errors.username && (
                <div className="error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errors.username.message}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-shield-lock"></i>
                Password
              </label>
              <div className="input-wrapper">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Enter your password"
                  disabled={isSubmitting || isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
              {errors.password && (
                <div className="error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errors.password.message}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-button ${
                isSubmitting || isLoading ? "loading" : ""
              }`}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  Sign In
                </>
              )}
            </button>

            {/* Footer Links */}
            <div className="login-footer">
              <p className="signup-text">
                Don't have an account?{" "}
                <Link to="/#" className="signup-link">
                  Request Access
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginComponent;
