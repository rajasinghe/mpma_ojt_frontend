import { ReactNode, useState, useEffect } from "react";
import logo from "../../../src/assets/SLPA_Logo-Cu9TOj32.png";
import "./style.css";
import { Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";

interface Props {
  children?: ReactNode;
  user: any;
}

export default function Header({ user }: Props) {
  const { sessionTimeLeft } = useSession();
  function getInitials(name: string): string {
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  // Format time remaining for display
  const formatTimeRemaining = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get status class based on time remaining
  const getStatusClass = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes <= 5) return "session-status-danger";
    if (minutes <= 15) return "session-status-warning";
    return "session-status-success";
  };
  // State to track sidebar toggle action (not the actual open/closed state)
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  // State to force re-renders when window is resized
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Helper function to determine if sidebar is currently open
  // This provides a clear method to identify sidebar state across desktop and mobile
  const isSidebarOpen = (): boolean => {
    const isDesktop = windowWidth >= 1200;
    if (isDesktop) {
      // Desktop behavior: sidebar is open by default, closed when toggled
      return !isSidebarToggled;
    } else {
      // Mobile behavior: sidebar is closed by default, open when toggled
      return isSidebarToggled;
    }
  };

  // Helper function to determine if logo should be hidden
  // Logo is hidden when sidebar is open
  const shouldHideLogo = (): boolean => {
    return isSidebarOpen();
  };

  // Function to toggle the sidebar state
  const handleSidebarToggle = () => {
    setIsSidebarToggled(!isSidebarToggled);
    document.body.classList.toggle("toggle-sidebar");
  };

  // Handle click outside sidebar to close it in mobile view
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const sidebar = document.getElementById("sidebar");
      const toggleBtn = document.querySelector(".header-toggle-btn");

      if (
        isSidebarToggled &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        !toggleBtn?.contains(event.target as Node) &&
        window.innerWidth <= 1199
      ) {
        setIsSidebarToggled(false);
        document.body.classList.remove("toggle-sidebar");
      }
    };

    if (isSidebarToggled) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarToggled]);

  // Handle window resize to update responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      // Optional: Reset sidebar state when switching between desktop and mobile
      // This ensures consistent behavior across breakpoints
      const wasDesktop = windowWidth >= 1200;
      const isDesktop = newWidth >= 1200;

      if (wasDesktop !== isDesktop) {
        // Breakpoint changed - you can add specific logic here if needed
        // For now, we maintain the current toggle state
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [windowWidth]);

  //need to get the notifications for that user
  return (
    <>
      <header id="header" className="header d-flex align-items-center w-100">
        {/* Hamburger Toggle Button */}
        <div className="hamburger-container">
          <i
            className={`bi ${
              isSidebarOpen() ? "bi-x-lg" : "bi-list"
            } header-toggle-btn`}
            onClick={handleSidebarToggle}
            title={isSidebarOpen() ? "Close Menu" : "Open Menu"}
          ></i>
        </div>

        <div className="d-flex me-auto align-items-center justify-content-between">
          <div
            id="name1"
            className={`logo d-flex align-items-center ${
              shouldHideLogo() ? "logo-hidden" : ""
            }`}
          >
            <img src={logo} alt="logo" />
            <div
              className="d-lg-block brand-name"
              style={{ whiteSpace: "nowrap" }}
            >
              <span style={{ display: "inline" }}>MPMA </span>
              <small style={{ display: "inline" }}>OJT Management System</small>
            </div>
          </div>
        </div>

        {/* {children} */}

        <nav className="header-nav ms-auto">
          <div>
            <ul className="d-flex align-items-center gap-3">
              {/* Session Status Indicator */}
              <li className="nav-item me-3">
                <div className={`session-indicator ${getStatusClass(sessionTimeLeft)}`}>
                  <i className="bi bi-clock"></i>
                  <span>
                    Session: {formatTimeRemaining(sessionTimeLeft)}
                  </span>
                </div>
              </li>
              {/* Notification Section */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link nav-icon position-relative"
                  data-bs-toggle="dropdown"
                  role="button"
                  aria-expanded="false"
                >
                  <i className="bi bi-bell fs-5"></i>
                  <span className="notification-badge">4</span>
                </a>
                {/* Enhanced Notification Dropdown */}
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                  <li className="dropdown-header">
                    You have <span className="notifi-count">04</span> new
                    notifications
                    <a href="#">
                      <span className="badge rounded-pill bg-primary p-2 ms-2">
                        View all
                      </span>
                    </a>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li className="notification-item">
                    <i className="bi bi-exclamation-circle text-warning"></i>
                    <div>
                      <h4>System Update</h4>
                      <p>New features have been added to the system.</p>
                      <p>30 min. ago</p>
                    </div>
                  </li>
                </ul>
              </li>

              {/* Profile Section */}
              <li className="nav-item">
                <Link
                  to="/OJT/user_profile"
                  className="nav-link nav-profile d-flex align-items-center"
                >
                  <div className="profile-container">
                    <div className="profile-avatar">
                      {user?.name === "MPMA -SUPER ADMIN"
                        ? "SA"
                        : user?.name
                        ? getInitials(user.name)
                        : "U"}
                    </div>
                    <div className="profile-info d-none d-md-block">
                      <span className="profile-name">
                        {user?.name === "MPMA -SUPER ADMIN"
                          ? "Super Admin"
                          : user?.name || "User"}
                      </span>
                      <br />
                      <small className="profile-role"> Administrator</small>
                    </div>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        {/* End Icons Navigation */}
      </header>
    </>
  );
}

/*   const [searchBarVisible, setSearchBarVisible] = useState(false); // State to toggle search bar
 */
// Toggle search bar function
/* const toggleSearchBar = () => {
    setSearchBarVisible(!searchBarVisible);
  }; */

// Effect to toggle search bar class
/*  useEffect(() => {
    const searchBarElement = document.querySelector(".search-bar");
    if (searchBarElement) {
      if (searchBarVisible) {
        searchBarElement.classList.add("search-bar-show");
      } else {
        searchBarElement.classList.remove("search-bar-show");
      }
    }
  }, [searchBarVisible]); */
