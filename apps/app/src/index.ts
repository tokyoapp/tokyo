import { render } from 'solid-js/web';
import { App } from 'tokyo-ui';
import 'tokyo-ui/index.css';

const app = document.querySelector('main');
if (app) render(App, app);
