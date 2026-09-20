import React, { useState } from 'react';
import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../features/api/apiSlice';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const { data } = useGetMyNotificationsQuery(undefined, { pollingInterval: 60000 });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead().unwrap();
    } catch (err) { }
  };

  const handleItemClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification._id).unwrap();
      } catch (err) { }
    }
  };

  return (
    <div className="user-menu position-relative me-2">
      <div className="user-dropdown-container">
        <button
          className="user-button d-flex align-items-center gap-2 px-3 py-2 rounded position-relative"
          onClick={handleOpen}
          title="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="badge bg-danger position-absolute"
              style={{ top: 2, right: 2, fontSize: '10px', borderRadius: '50%', padding: '3px 6px' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div
              className="dropdown-backdrop position-fixed top-0 start-0 w-100 h-100"
              onClick={() => setOpen(false)}
            />

            <div
              className="user-dropdown position-absolute end-0 mt-2 shadow rounded bg-white"
              style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}
            >
              <div className="dropdown-header px-3 py-2 d-flex justify-content-between align-items-center">
                <strong>Notifications</strong>
                {unreadCount > 0 && (
                  <button className="btn btn-sm btn-link p-0" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="dropdown-divider my-1" />

              {notifications.length === 0 ? (
                <p className="text-muted text-center small py-3 mb-0">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className="dropdown-item px-3 py-2"
                    style={{ cursor: 'pointer', background: n.read ? 'transparent' : '#f0f7ff' }}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="small">{n.message}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationBell;
