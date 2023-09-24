import Notification from "./components/Notification";
import NotificationFeed from "./components/NotificationFeed";

export class Notifications {
  static push(notification: Notification) {
    const feed = NotificationFeed.getInstance();
    if (feed) {
      feed?.append(notification);
      return notification;
    }
  }
}
