export class DoropDownSelectEvent extends Event {
  option?: HTMLElement;

  constructor(selectedItem) {
    super("select", { bubbles: true });

    this.option = selectedItem;
  }
}
