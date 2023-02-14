import Panel from "./Panel";

export default class Column extends Panel {
  constructor() {
    super();

    this.resizableRow = true;
    this.resizableColumn = false;
    this.removeOnEmtpy = true;
  }
}

customElements.define("gyro-layout-column", Column);
