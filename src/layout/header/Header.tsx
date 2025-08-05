import { ReactNode } from "react";
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

  // Get status color based on time remaining
  const getStatusColor = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes <= 5) return "text-danger";
    if (minutes <= 15) return "text-warning";
    return "text-success";
  };

  //need to get the notifications for that user
  return (
    <>
      <header id="header" className="header d-flex align-items-center">
        <div className="d-flex me-auto align-items-center justify-content-between ">
          <div id="name1" className="logo d-flex align-items-center">
            <img src={logo} alt="logo" />
            <span className="d-lg-block">MPMA</span>
          </div>
        </div>

        {/* {children} */}

        <nav className="header-nav ms-auto notifi-profile">
          <ul className="d-flex align-items-center">
            {/* Session Status Indicator */}
            <li className="nav-item me-3">
              <div className="d-flex align-items-center">
                <i
                  className={`bi bi-clock me-2 ${getStatusColor(
                    sessionTimeLeft
                  )}`}
                ></i>
                <span className={`small ${getStatusColor(sessionTimeLeft)}`}>
                  Session: {formatTimeRemaining(sessionTimeLeft)}
                </span>
              </div>
            </li>

            <li className="nav-item dropdown">
              <a className="nav-link nav-icon" data-bs-toggle="dropdown">
                <i className="bi bi-bell"></i>
                <span className="badge bg-primary badge-number">4</span>
              </a>
              {/* End Notification Icon */}
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

                <hr className="dropdown-divider" />

                <li className="notification-item">
                  <i className="bi bi-exclamation-circle text-warning"></i>
                  <div>
                    <h4>Lorem Ipsum</h4>
                    <p>
                      Quae dolorem earum veritatis oditseno kia jnwjdnjw
                      nwndwijd d wdjw wdwndwndiw.
                    </p>
                    <p>30 min. ago</p>
                  </div>
                </li>
              </ul>
              {/* End Notification Dropdown Items */}
            </li>
            {/* End Notification Nav */}

            <li className="nav-item pe-3">
              <Link
                to="/OJT/user_profile"
                className="nav-link nav-profile d-flex align-items-center pe-0"
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-semibold text-uppercase"
                  style={{ width: "34px", height: "34px", fontSize: "0.85rem" }}
                >
                  {user.name === "MPMA -SUPER ADMIN"
                    ? "SA"
                    : getInitials(user.name)}
                </div>
              </Link>
            </li>
            {/* End Profile Nav */}
          </ul>
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
