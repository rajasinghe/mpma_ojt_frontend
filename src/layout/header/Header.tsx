import { ReactNode } from "react";
import logo from "../../../src/assets/SLPA_Logo-Cu9TOj32.png";
import "./style.css";
import { useEffect, useState } from "react";
import api from "../../api";
import { formatDistanceToNow } from 'date-fns';
import { Link } from "react-router-dom";

interface Props {
  children?: ReactNode;
  user: any;
}

interface Notification {
  id: number;
  message: string;
  type: string;
  source_id: number | null;
  source_type: string | null;
  is_read: number;
  created_at: string;
}

export default function Header({ user }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('api/notifications');
      setNotifications(response.data);
      const unreadCount = response.data.filter((n: Notification) => !n.is_read).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling interval to check for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'department_capacity':
        return 'bi-exclamation-circle-fill text-warning';
      default:
        return 'bi-bell-fill';
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`api/notifications/${id}/read`);
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: 1 } 
          : notification
      ));
      // Update notification count
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

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
                {notificationCount > 0 && (
                  <span className="badge bg-primary badge-number">{notificationCount}</span>
                )}
              </a>
              {/* End Notification Icon */}
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                <li className="dropdown-header">
                  You have <span className="notifi-count">{notificationCount}</span> new notifications
                  <Link to="/OJT/notification">
                    <span className="badge rounded-pill bg-primary p-2 ms-2">View all</span>
                  </Link>
                </li>

                <hr className="dropdown-divider" />

                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <li 
                      key={notification.id} 
                      className={`notification-item ${notification.is_read ? '' : 'unread'}`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <i className={`${getIcon(notification.type)}`}></i>
                      <div>
                        <p>{notification.message}</p>
                        <p className="notification-time">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="notification-item">
                    <div className="text-center">
                      <p>No notifications available</p>
                    </div>
                  </li>
                )}

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