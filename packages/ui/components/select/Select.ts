import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export class Select extends LitElement {
  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }

  @property({ type: String })
  public activeAttribute = 'selected';

  // select multiple options
  @property({ type: Boolean, reflect: false })
  public multiple = false;

  public activeChildren: string[] = [];

  public get value() {
    return this.activeChildren;
  }

  public set value(items: string[]) {
    this.activeChildren = items;
    this.updateChildren();
  }

  private focusCallback(e) {
    const childIndex = [...this.children].indexOf(e.target);
    this.selected = childIndex;
    this.onSelected();
  }

  private clickCallback(e: MouseEvent) {
    if (![...this.children].includes(e.target as HTMLElement)) {
      return;
    }

    if (!this.multiple) {
      this.activeChildren = [];
    }

    let i = 0;
    for (const child of this.children) {
      child.removeAttribute(this.activeAttribute);

      if (e.target === child || child.contains(e.target as HTMLElement)) {
        const value = Select.getChildValue(child as HTMLElement) || i.toString();

        const index = this.activeChildren.indexOf(value);
        if (index !== -1) {
          this.activeChildren.splice(index, 1);
        } else {
          this.activeChildren.push(value);
        }

        child.setAttribute(this.activeAttribute, '');
      }

      i++;
    }

    this.updateChildren();

    this.dispatchEvent(new Event('change', { bubbles: true }));
    e.stopPropagation();
  }

  static getChildValue(child: HTMLElement) {
    return child.getAttribute('value') || child.dataset.value;
  }

  private updateChildren() {
    let index = 0;
    for (const child of this.children) {
      const value = Select.getChildValue(child as HTMLElement) || index.toString();

      if (this.activeChildren.indexOf(value) !== -1) {
        child.setAttribute(this.activeAttribute, '');
      } else {
        child.removeAttribute(this.activeAttribute);
      }

      index++;
    }
  }

  public selected = -1;

  public selectNext() {
    this.selected = Math.min(this.selected + 1, this.children.length - 1);
    this.onSelected();
  }

  public selectPrev() {
    this.selected = Math.max(this.selected - 1, 0);
    this.onSelected();
  }

  private onSelected() {
    const child = this.children[this.selected] as HTMLElement;
    if (child) {
      child.focus();
    }
  }

  onKeyDown(e) {
    const selected = document.activeElement;
    if (selected != null) {
      let nextChild = selected.nextElementSibling;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextChild = selected.previousElementSibling;
      }

      if (nextChild) {
        const currentRect = selected.getClientRects()[0];
        const nextRect = nextChild.getClientRects()[0];

        const xd = Math.abs(nextRect.x - currentRect.x);
        const yd = Math.abs(nextRect.y - currentRect.y);

        if (xd > yd) {
          if (e.key === 'ArrowLeft') {
            this.selectPrev();
          }
          if (e.key === 'ArrowRight') {
            this.selectNext();
          }
        } else {
          if (e.key === 'ArrowUp') {
            this.selectPrev();
          }
          if (e.key === 'ArrowDown') {
            this.selectNext();
          }
        }
      }
    }
  }

  protected updated(): void {
    this.updateChildren();
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (!this.activeChildren) {
      this.activeChildren = [];
    } else {
      this.updateChildren();
    }

    this.tabIndex = 0;

    this.addEventListener('keydown', this.onKeyDown);

    this.addEventListener('click', this.clickCallback);
    this.addEventListener('focusin', this.focusCallback);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.onKeyDown);

    this.removeEventListener('click', this.clickCallback);
    this.removeEventListener('focusin', this.focusCallback);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sv-select': Select;
  }
}

customElements.define('sv-select', Select);
