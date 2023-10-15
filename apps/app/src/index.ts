import "ui/index.css";
import { render } from 'solid-js/web';
import { App, Title } from 'ui';

const title = document.querySelector("#titlebar");
if(title) render(Title, title);

const app = document.querySelector("#main");
if(app) render(App, app);
