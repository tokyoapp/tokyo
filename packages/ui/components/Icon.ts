let iconFile = "./gyro-icons.svg";

export class Icon extends HTMLElement {

    static getIconFile() {
        return iconFile;
    }

    static setIconFile(filePath: string) {
        iconFile = filePath;
    }

    static get observedAttributes() {
        return ['icon', 'size'];
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value: string | null) {
        this.setAttribute('icon', value || "");
    }

    get size() {
        return +(this.getAttribute('size') || 0);
    }

    set size(value: number) {
        this.setAttribute('size', value.toString());
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.displayIcon();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        this.displayIcon();
    }

    displayIcon() {
        if (this.icon && this.shadowRoot) {
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        width: var(--icon-size, 18px);
                        height: var(--icon-size, 18px);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    svg {
                        display: block;
                        pointer-events: none;
                        width: 100%;
                        height: 100%;
                    }
                </style>
                <svg>
                    <use xlink:href="${Icon.getIconFile()}#${this.icon || "Placeholder"}"></use>
                </svg>
            `;
        }
    }

}

customElements.define('gyro-icon', Icon);
