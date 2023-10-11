import Action from './actions/Action';
import Titlebar from './components/Titlebar.tsx';
import './components/notifications/index.ts';
import { ErrorNotification, Notifications } from './components/notifications/index.ts';

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
  p: Action.map('search'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

function Title() {
  window.addEventListener('error', (e) => {
    Notifications.push(
      new ErrorNotification({
        message: `Error: ${e.message}`,
        time: 3000,
      })
    );
  });

  return (
    <div>
      <Titlebar />

      <notification-feed class="fixed z-10 left-1/2 top-20 -translate-x-1/2 w-80" />
    </div>
  );
}

export default Title;
