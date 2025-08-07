import { useEffect, useState } from "react";
import "./style.css";
import logo from "../../assets/SLPA_Logo-Cu9TOj32.png";
import { Link, useLocation, useNavigation } from "react-router-dom";
interface Props {
  user: any;
}

interface RouteLink {
  name: string;
  route: string;
  active_icon: string;
  inactive_icon: string;
  regex: RegExp;
  subLinks?: RouteLink[];
}

const Sidebar = ({ user }: Props) => {
  const initLinks: RouteLink[] = [
    {
      name: "Trainees",
      route: "/OJT/trainees",
      regex: /^\/OJT\/trainees/i,
      inactive_icon: "bi-people",
      active_icon: "bi-people-fill",
      subLinks: [
        {
          name: "Registration",
          route: "/OJT/trainees/new",
          regex: /^\/OJT\/trainees\/new/i,
          active_icon: "bi-person-plus-fill",
          inactive_icon: "bi-person-plus",
        },
        {
          name: "Details",
          route: "/OJT/trainees/details",
          regex: /^\/OJT\/trainees\/details/i,
          active_icon: "bi-folder-fill",
          inactive_icon: "bi-folder",
        },
        {
          name: "Portal Account",
          route: "/OJT/trainees/portal_account",
          regex: /^\/OJT\/trainees\/portal_account/i,
          active_icon: "bi-person-badge-fill",
          inactive_icon: "bi-person-badge",
        },
      ],
    },
    {
      name: "Calender",
      regex: /^\/OJT\/calender/i,
      route: "/OJT/calender",
      active_icon: "bi-calendar-event-fill",
      inactive_icon: "bi-calendar-event",
    },
  ];

  const [links, setLinks] = useState<RouteLink[]>(initLinks);

  useEffect(() => {
    if (user) {
      console.log(user);
      let updatedLinks = [...initLinks];

      if (user && user.type == "SUPERADMIN") {
        updatedLinks.push(
          {
            name: "Interview",
            regex: /^\/OJT\/Interview/i,
            route: "/OJT/interview",
            active_icon: "bi-person-rolodex",
            inactive_icon: "bi-person-bounding-box",
            subLinks: [
              {
                name: "New Interview",
                regex: /^\/OJT\/interview\/new/i,
                route: "/OJT/interview/new",
                active_icon: " bi-person-plus-fill",
                inactive_icon: "bi-person-plus",
              },
            ],
          },
          {
            name: "Attendence",
            regex: /^\/OJT\/attendence/i,
            route: "/OJT/attendence",
            active_icon: "bi-clipboard-check-fill",
            inactive_icon: "bi-clipboard-check",
            subLinks: [
              {
                name: "Upload Attendence",
                regex: /^\/OJT\/attendence\/new/i,
                route: "/OJT/attendence/new",
                active_icon: " bi-file-earmark-arrow-up-fill",
                inactive_icon: "bi-file-earmark-arrow-up",
              },
            ],
          },
          {
            name: "Departments",
            regex: /^\/OJT\/departments/i,
            route: "/OJT/departments",
            active_icon: "bi-diagram-3-fill",
            inactive_icon: "bi-diagram-3",
          },
          {
            name: "Payments",
            regex: /^\/OJT\/payments/i,
            route: "/OJT/payments",
            active_icon: "bi-credit-card-fill",
            inactive_icon: "bi-credit-card",
            subLinks: [
              {
                name: "Payment Slip Generate",
                regex: /^\/OJT\/payments\/paymentslipgenerate/i,
                route: "/OJT/payments/paymentslipgenerate",
                active_icon: "bi bi-file-text-fill",
                inactive_icon: "bi bi-file-text",
              },
            ],
          },
          {
            name: "Users",
            regex: /^\/OJT\/users/i,
            route: "/OJT/users",
            active_icon: "bi-key-fill",
            inactive_icon: "bi-key",
            subLinks: [
              {
                name: "Add User",
                regex: /^\/OJT\/users\/create/i,
                route: "/OJT/users/create",
                active_icon: "bi-patch-plus-fill",
                inactive_icon: "bi-patch-plus",
              },
            ],
          }
        );
      } else {
        if (
          user.accessLevels.find(
            (accessLevel: any) => accessLevel.access == "interview:modify"
          )
        ) {
          updatedLinks.push(
            {
              name: "Interview",
              regex: /^\/OJT\/Interview/i,
              route: "/OJT/interview",
              active_icon: "bi-diagram-3-fill",
              inactive_icon: "bi-diagram-3",
              subLinks: [
                {
                  name: "New Interview",
                  regex: /^\/OJT\/interview\/new/i,
                  route: "/OJT/interview/new",
                  active_icon: " bi-file-earmark-arrow-up-fill",
                  inactive_icon: "bi-file-earmark-arrow-up",
                },
              ],
            },
            {
              name: "Departments",
              regex: /^\/OJT\/departments/i,
              route: "/OJT/departments",
              active_icon: "bi-diagram-3-fill",
              inactive_icon: "bi-diagram-3",
            }
          );
        }
        if (
          user.accessLevels.find(
            (accessLevel: any) => accessLevel.access == "attendence:modify"
          )
        ) {
          updatedLinks.push({
            name: "Attendence",
            regex: /^\/OJT\/attendence/i,
            route: "/OJT/attendence",
            active_icon: "bi-clipboard-check-fill",
            inactive_icon: "bi-clipboard-check",
            subLinks: [
              {
                name: "Upload Attendence",
                regex: /^\/OJT\/attendence\/new/i,
                route: "/OJT/attendence/new",
                active_icon: " bi-file-earmark-arrow-up-fill",
                inactive_icon: "bi-file-earmark-arrow-up",
              },
            ],
          });
        }
        if (
          user.accessLevels.find(
            (accessLevel: any) => accessLevel.access == "department:modify"
          )
        ) {
          updatedLinks.push({
            name: "Departments",
            regex: /^\/OJT\/departments/i,
            route: "/OJT/departments",
            active_icon: "bi-diagram-3-fill",
            inactive_icon: "bi-diagram-3",
          });
        }
        if (
          user.accessLevels.find(
            (accessLevel: any) => accessLevel.access == "payments:modify"
          )
        ) {
          updatedLinks.push({
            name: "Payments",
            regex: /^\/OJT\/payments/i,
            route: "/OJT/payments",
            active_icon: "bi-credit-card-fill",
            inactive_icon: "bi-credit-card",
            subLinks: [
              {
                name: "Payment Slip Generate",
                regex: /^\/OJT\/payments\/paymentslipgenerate/i,
                route: "/OJT/payments/paymentslipgenerate",
                active_icon: "bi bi-file-text-fill",
                inactive_icon: "bi bi-file-text",
              },
            ],
          });
        }
      }
      setLinks(updatedLinks);
    }
  }, [user]);

  // State to control the sidebar toggle
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  let { pathname } = useLocation();

  const navigation = useNavigation();

  useEffect(() => {
    console.log(navigation);
  }, [navigation]);

  // Function to toggle the sidebar state
  const handleSidebarToggle = () => {
    setIsSidebarToggled(!isSidebarToggled);
    document.body.classList.toggle("toggle-sidebar");
  };

  return (
    <>
      {/* Toggle Sidebar Button */}
      <i
        className="bi bi-list toggle-sidebar-btn"
        onClick={handleSidebarToggle}
      ></i>
      {/* Sidebar Component */}
      <aside
        id="sidebar"
        className={`sidebar ${isSidebarToggled ? "toggle-sidebar" : ""}`}
      >
        <div className="d-flex">
          {/* Close Button */}
          <i
            className="bi bi-x-circle toggle-close-btn ms-auto"
            onClick={handleSidebarToggle}
          ></i>
        </div>
        <div className="d-flex logo align-items-center mb-3">
          <img src={logo} alt="logo" />
          <span className="d-lg-block">MPMA</span>
        </div>
        <ul className="sidebar-nav" id="sidebar-nav">
          <li className="nav-heading">Main Menu</li>
          {links.map((link) => {
            if (link && link.subLinks) {
              return (
                <li className="nav-item" key={link.name}>
                  <a className={`nav-link `}>
                    <Link
                      to={link.route}
                      className={`d-flex text-decoration-none  ${
                        link.regex.test(pathname) ? "enable-main" : "text-black"
                      } `}
                    >
                      <i
                        className={`bi ${
                          link.regex.test(pathname)
                            ? link.active_icon
                            : link.inactive_icon
                        } `}
                      ></i>
                      <span>{link.name}</span>
                    </Link>
                    <div className="w-100 d-flex">
                      <button
                        className="btn btn-sm ms-auto"
                        data-bs-toggle="collapse"
                        data-bs-target={`#submenu-${link.name}`}
                      >
                        <i className={`bi bi-chevron-expand`}></i>
                      </button>
                    </div>
                  </a>

                  <ul
                    className="collapse"
                    id={`submenu-${link.name}`}
                    data-bs-parent="#sidebar-nav"
                  >
                    {link.subLinks.map((sublink) => (
                      <li className="nav-item" key={sublink.name}>
                        <Link
                          to={sublink.route}
                          className={`nav-link ${
                            sublink.regex.test(pathname) ? "enable" : ""
                          }`}
                        >
                          <i
                            className={`bi ${
                              sublink.regex.test(pathname)
                                ? sublink.active_icon
                                : sublink.inactive_icon
                            }`}
                          ></i>
                          <span>{sublink.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            } else {
              return (
                <li className="nav-item" key={link.name}>
                  <Link
                    className={`nav-link ${
                      link.regex.test(pathname) ? "enable" : ""
                    }`}
                    to={link.route}
                  >
                    <i
                      className={`bi  ${
                        link.regex.test(pathname)
                          ? link.active_icon
                          : link.inactive_icon
                      }`}
                    ></i>
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            }
          })}
          {/* other links */}
          <li className="nav-heading">Other</li>
          <li className="nav-item">
            <Link className="nav-link disable" to={"/OJT/user_profile"}>
              <i className="bi bi-person-circle"></i>
              <span>Profile</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link disable" to={"/OJT/notifications"}>
              <i className="bi bi-bell"></i>
              <span>Notification</span>
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link disable" to={"/login"}>
              <i className="bi bi-box-arrow-in-right"></i>
              <span>Sign Out</span>
            </Link>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
