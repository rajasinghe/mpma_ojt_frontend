import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { formatDistanceToNow } from 'date-fns';
import api from "../api";
import { useEffect, useState } from "react";

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
  const loadedNotifications  = useLoaderData() as Notification[];
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(loadedNotifications);
  }, [loadedNotifications]);

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
      // Optionally refresh data
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: 1 } 
          : notification
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
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
