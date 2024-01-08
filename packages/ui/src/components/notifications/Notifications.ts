import ErrorNotification from './ErrorNotification.js';
import Notification from './Notification.js';
import NotificationFeed from './NotificationFeed.js';

const log: Notification[] = [];

export class Notifications {
	private static push(notification: Notification) {
		const feed = NotificationFeed.getInstance();
		if (feed) {
			feed?.append(notification);
			log.unshift(notification);
			return notification;
		}
	}

	static info(message: string) {
		Notifications.push(
			new Notification({
				message: `${message}`,
				time: 3000,
			})
		);
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
