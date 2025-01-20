import { ReactNode } from "react";
import logo from "../../../src/assets/SLPA_Logo-Cu9TOj32.png";
import "./style.css";

interface Props {
  children?: ReactNode;
  user: any;
}

export default function Header({ user }: Props) {
  //need to get the notifications for that user
  return (
    <>
      <header id="header" className="header d-flex align-items-center">
        <div className="d-flex me-auto align-items-center justify-content-between ">
          <div className="logo d-flex align-items-center">
            <img src={logo} alt="logo" />
            <span className="d-lg-block">MPMA</span>
          </div>
        </div>

        {/* {children} */}

        <nav className="header-nav ms-auto notifi-profile">
          <ul className="d-flex align-items-center">
            {/* End Search Icon */}

            <li className="nav-item dropdown">
              <a className="nav-link nav-icon" data-bs-toggle="dropdown">
                <i className="bi bi-bell"></i>
                <span className="badge bg-primary badge-number">4</span>
              </a>
              {/* End Notification Icon */}
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                <li className="dropdown-header">
                  You have <span className="notifi-count">04</span> new notifications
                  <a href="#">
                    <span className="badge rounded-pill bg-primary p-2 ms-2">View all</span>
                  </a>
                </li>

                <hr className="dropdown-divider" />

                <li className="notification-item">
                  <i className="bi bi-exclamation-circle text-warning"></i>
                  <div>
                    <h4>Lorem Ipsum</h4>
                    <p>
                      Quae dolorem earum veritatis oditseno kia jnwjdnjw nwndwijd d wdjw wdwndwndiw.
                    </p>
                    <p>30 min. ago</p>
                  </div>
                </li>
              </ul>
              {/* End Notification Dropdown Items */}
            </li>
            {/* End Notification Nav */}

            <li className="nav-item dropdown pe-3">
              <div
                className="nav-link nav-profile d-flex align-items-center pe-0"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle "></i>
                <span className="d-none d-md-block ps-2">{user?.names}</span>
              </div>
              {/* End Profile Iamge Icon */}
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
