import '@tokyo/ui/index.css';
import { render } from 'solid-js/web';
import { App } from '@tokyo/ui';

const app = document.querySelector('main');
if (app) render(App, app);
