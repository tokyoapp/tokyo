import { Action, ActionOptions } from './Actions';
import DebugElement from 'ui/components/Debug';
import { dragElement } from './util';
import { LitElement } from 'lit-element';
import { MenuItem, MenuOption } from 'ui/components/menubar/Menubar';
import { SettingsComponent } from 'ui/components/settings/Settings';
import Notification from 'ui/components/Notification';

const componentTypes = [];

export interface Component {
  title: string;
  components: Array<LitElement>;
  settings: any;
  menu: Array<any>;
  actions: Array<any>;
}

export default class Gyro {
  static get Notification() {
    return Notification;
  }

  static get dragElement() {
    return dragElement;
  }

  static log(...str: Array<string>) {
    if (localStorage.getItem('debug') == 'true') {
      debugElement.appendLine(str.join(' '));
    }
    console.log(...str);
  }

  static registerComponent(component: Component) {
    this.log('register componnent', component.title);

    const menu = component.menu;

    if (menu) {
      for (let item of menu) {
        this.addMenuItem(item);
      }
    }

    const actions = component.actions;

    if (actions) {
      for (let actn of actions) {
        Gyro.registerAction(actn);
      }
    }

    const settings = component.settings;

    if (settings) {
      SettingsComponent.createTab(settings);
    }

    componentTypes.push(component);

    // register ui component
    // make it selectable in the ui layout
  }

  static unregisterComponent() {
    // unregister ui component
  }

  static addMenuItem(item) {
    const itemEle = new MenuItem(item);
    itemEle.setAttribute('icon', item.icon);
    itemEle.title = item.title;
    if (item.action) {
      itemEle.setAttribute('action', item.action);
    }

    const menuEle = document.querySelector('gyro-menubar .top');
    menuEle?.append(itemEle);
  }

  static registerAction(optns: ActionOptions) {
    Action.register(optns);
  }
}

const debugElement = new DebugElement();
window.addEventListener('DOMContentLoaded', (e) => {
  document.body.append(debugElement);
});

// global Gyro var
declare global {
  interface Window {
    Gyro: Gyro;
  }
}

window.Gyro = Gyro;
