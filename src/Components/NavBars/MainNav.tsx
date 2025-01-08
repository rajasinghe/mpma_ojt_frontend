import "./MainNav.css";
import logo from "../../assets/SLPA_Logo-Cu9TOj32.png";
import profile_icon from "../../assets/profile_icon.png";
//import { UserContext } from "../../App";
import { Link, useLocation, useOutletContext } from "react-router-dom";

export default function MainNav() {
  let { pathname } = useLocation();
  const user = useOutletContext() as any;

  return (
    <div>
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src={logo} alt="" width={40} className="d-inline-block align-text-top" />
          </a>
          <a className="navbar-brand" href="#">
            MPMA
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ps-5">
              <li className="nav-item">
                <Link
                  className="nav-link active navbar_text txt d-flex flex-column align-items-center"
                  to="Trainees"
                >
                  <div
                    className={`navLinkBody ${/^\/OJT\/trainees/i.test(pathname) ? "active" : ""}`}
                  >
                    Trainees
                  </div>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link active navbar_text txt d-flex flex-column align-items-center"
                  to="calender"
                >
                  <div className={`navLinkBody ${pathname == "/OJT/calender" ? "active" : ""}`}>
                    Calender
                  </div>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link active navbar_text txt d-flex flex-column align-items-center"
                  to="attendence"
                >
                  <div
                    className={`navLinkBody ${/^\/OJT\/attendence/.test(pathname) ? "active" : ""}`}
                  >
                    Attendence
                  </div>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link active navbar_text txt d-flex flex-column align-items-center"
                  to="departments"
                >
                  <div
                    className={`navLinkBody ${
                      /^\/OJT\/departments/.test(pathname) ? "active" : ""
                    }`}
                  >
                    Departments
                  </div>
                </Link>
              </li>
              {user && user.type == "SUPERADMIN" && (
                <li className="nav-item">
                  <Link
                    className="nav-link active navbar_text txt d-flex flex-column align-items-center"
                    to="users"
                  >
                    <div
                      className={`navLinkBody ${/^\/OJT\/users/.test(pathname) ? "active" : ""}`}
                    >
                      Users
                    </div>
                  </Link>
                </li>
              )}
            </ul>
            <div className="ms-auto">
              <Link to={"/OJT/user_profile"}>
                <img
                  src={profile_icon}
                  alt=""
                  width={40}
                  className="d-inline-block align-text-top"
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
