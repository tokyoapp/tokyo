import ErrorNotification from './ErrorNotification.js';
import Notification from './Notification.js';
import NotificationFeed from './NotificationFeed.js';

export class Notifications {
  static push(notification: Notification) {
    const feed = NotificationFeed.getInstance();
    if (feed) {
      feed?.append(notification);
      return notification;
    }
  }

  static error(message: string) {
    Notifications.push(
      new ErrorNotification({
        message: `Error: ${message}`,
        time: 3000,
      })
    );
  }
}
