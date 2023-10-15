import 'ui/index.css';
import { render } from 'solid-js/web';
import { App } from 'ui';

const app = document.querySelector('main');
if (app) render(App, app);
