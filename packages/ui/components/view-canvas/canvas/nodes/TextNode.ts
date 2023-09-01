import { NodeElement } from '../NodeElement';
import { OverlayElement } from '../OverlayElement';
import Node from './Node';

import DropdownButton from '../../../DropdownButton';
import FluidInput from '../../../FluidInput';

class TextNodeElement extends NodeElement {}

customElements.define('text-node-element', TextNodeElement);

class DataChangeEvent extends Event {
  constructor(key, value) {
    super('change');
    this.key = key;
    this.value = value;
  }
}

class TextOverlay extends OverlayElement {
  constructor() {
    super();

    this.data = {
      'font-family': 'Roboto',
      'font-size': '69px',
      color: 'grey',
    };

    this.fontDropDown = new DropdownButton({
      options: [
        { name: 'Roboto', value: 'Roboto' },
        { name: 'Open Sans', value: 'Open Sans' },
        { name: 'Monospace', value: 'Monospace' },
      ],
    });
    this.fontDropDown.addEventListener('change', (e) => {
      this.setData('font-family', this.fontDropDown.value.value);
    });
    this.sizeInput = new FluidInput();
    this.sizeInput.steps = 2;
    this.sizeInput.max = 200;
    this.sizeInput.min = 12;
    this.sizeInput.value = 42;
    this.sizeInput.addEventListener('change', (e) => {
      this.setData('font-size', this.sizeInput.value + 'px');
    });
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.append(this.fontDropDown);
    this.append(this.sizeInput);
  }

  emitDataChange(key) {
    this.dispatchEvent(new DataChangeEvent(key, this.data[key]));
  }

  setData(key, value) {
    this.data[key] = value;
    this.emitDataChange(key);
  }
}

customElements.define('text-overlay-element', TextOverlay);

export default class TextNode extends Node {
  static get OverlayElement() {
    return TextOverlay;
  }

  // This node doesnt render extra canvas elements.
  //
  // static get NodeUIElement() {
  //   return TextNodeElement;
  // }

  static onFocus(canvas, node) {}

  static onBlur(camvas, node) {}
}
