import { useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { formatDistanceToNow } from 'date-fns';
import { useState } from "react";

interface Notification {
  id: number;
  message: string;
  type: string;
  source_id: number | null;
  source_type: string | null;
  is_read: number;
  created_at: string;
}

export default function NotificationPage() {
  const { state } = useNavigation();
  // Hard-coded sample notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      message: "Department Engineering has reached its maximum capacity of 15 trainees (Current: 18)",
      type: "department_capacity",
      source_id: 101,
      source_type: "department",
      is_read: 0,
      created_at: "2025-03-03T08:30:00"
    },
    {
      id: 2,
      message: "Department Finance has reached its maximum capacity of 10 trainees (Current: 12)",
      type: "department_capacity",
      source_id: 102,
      source_type: "department",
      is_read: 1,
      created_at: "2025-03-02T14:45:00"
    },
    {
      id: 3,
      message: "Department Marketing has reached its maximum capacity of 8 trainees (Current: 10)",
      type: "department_capacity",
      source_id: 103,
      source_type: "department",
      is_read: 0,
      created_at: "2025-03-02T09:15:00"
    },
    {
      id: 4,
      message: "Department IT has reached its maximum capacity of 20 trainees (Current: 22)",
      type: "department_capacity",
      source_id: 104,
      source_type: "department",
      is_read: 0,
      created_at: "2025-03-01T16:20:00"
    },
    {
      id: 5,
      message: "Department Human Resources has reached its maximum capacity of 5 trainees (Current: 7)",
      type: "department_capacity",
      source_id: 105,
      source_type: "department",
      is_read: 1,
      created_at: "2025-02-28T11:10:00"
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'department_capacity':
        return 'bi-exclamation-circle-fill text-warning';
      default:
        return 'bi-bell-fill';
    }
  };

  const markAsRead = (id: number) => {
    // Update local state to mark notification as read
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? {...notification, is_read: 1} 
          : notification
      )
    );
  };
  
  return (
    <>
    {state === "loading" ? (
      <Loader />
    ) : (
      <MainContainer breadCrumbs={["Home", "Notifications"]} title="Notifications">
        <SubContainer>
          {notifications && notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((notification: Notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item card mb-3 ${notification.is_read ? 'bg-light' : 'bg-white border-primary'}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <i className={`${getIcon(notification.type)} fs-4 me-3`}></i>
                      <div>
                        <p className="mb-1">{notification.message}</p>
                        <small className="text-muted">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash fs-1 text-muted mb-3"></i>
              <p>No notifications available.</p>
            </div>
          )}
        </SubContainer>
      </MainContainer>
    )}
  </>
);
}
