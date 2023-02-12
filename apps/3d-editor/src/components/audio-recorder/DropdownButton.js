import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';

export default class DropdownButton extends HTMLElement {

	static get observedAttributes() {
		return ['value'];
	}

	static template(props) {
		const options = props.options || [];
		const onSelect = props.onSelect;
		const value = props.value ? props.value.name : options[0] ? options[0].name : "none";

		return html`
			<style>
				:host {
					display: block;
					position: relative;
					outline: none;
					color: white;
					font-family: sans-serif;
					font-size: 12px;
					text-transform: capitalize;
				}

				:host(:focus) {
					background: rgba(52, 52, 52, 0.75);
				}

				:host {
					width: auto;
					line-height: 15px;
					cursor: pointer;
					padding: 6px 12px;
					min-width: 100px;
					border-radius: 4px;
					box-sizing: content-box;
					background: rgba(15, 15, 15, 0.5);
				}

				:host(:hover) {
					background: rgba(52, 52, 52, 0.75);
				}

				:host([active]) {
					z-index: 1000;
				}

				:host([active]) .options {
					display: block;
					animation: show .06s ease-out;
				}

				.options {
					display: none;
					position: absolute;
					top: 100%;
					margin-top: 2px;
					left: 0;
					background: rgba(25, 25, 25, 1);
					border-radius: 4px;
					overflow: hidden;
					min-width: 100%;
					width: max-content;
					animation: hide .06s ease-out both;
				}

				.options span {
					padding: 5px 8px;
					display: block;
					cursor: pointer;
				}

				.options span:hover {
					background: rgba(100, 100, 100, 0.75);
				}

				.options span:active {
					filter: brightness(0.9);
				}

				.value {
					max-width: 100px;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
				}

				.value::after {
					content: url("data:image/svg+xml,%3C!-- Generator: Adobe Illustrator 22.0.1, SVG Export Plug-In --%3E%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:a='http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/' x='0px' y='0px' width='7px' height='5.8px' viewBox='0 0 7 5.8' style='enable-background:new 0 0 7 5.8;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:%23FFFFFF;%7D%0A%3C/style%3E%3Cdefs%3E%3C/defs%3E%3Cpolygon class='st0' points='0,0 3.5,5.8 7,0 '/%3E%3C/svg%3E%0A");
					position: absolute;
					right: 10px;
					top: 50%;
					transform: translateY(-50%);
				}

				:host([active]) .value::after {
					transform: translateY(-50%) rotate(180deg);
				}

				@keyframes show {
                    from {
                        clip-path: polygon(100% 0, 0 0, 0 0, 100% 0);
                    }
                    to {
                        clip-path: polygon(100% 0, 0 0, 0 100%, 100% 100%);
                    }
                }
                @keyframes hide {
                    from {
                        clip-path: polygon(100% 0, 0 0, 0 100%, 100% 100%);
                    }
                    to {
                        clip-path: polygon(100% 0, 0 0, 0 0, 100% 0);
                    }
                }

			</style>
			<div class="value">
				${value}
			</div>
			<div class="options">
				${options.map(opt => {
					return html`<span @click=${() => onSelect(opt)}>${opt.name}</span>`;
				})}
			</div>
		`;
	}

	get value() {
		return this.props.value;
	}

	set value(val) {
		this.props.value = val;
		this.render();
	}

	get options() {
		return this.props.options || [];
	}

	set options(arr) {
		this.props.options = arr;
		this.dispatchEvent(new Event('change'));
		this.render();
		this.blur();
	}

	constructor(props = {}) {
		super();

        this.props = props;

		this.props.onSelect = opt => {
			console.log(opt);
			this.value = opt;
			this.dispatchEvent(new Event('change'));
			this.render();
			this.blur();
		}

		const template = this.renderTemplate();

        if (template) {
            this.attachShadow({ mode: "open" });

            if (template.type == "html") {
                this.render();
            } else {
                this.shadowRoot.innerHTML = template;
            }
        }
	}

	render() {
        render(this.renderTemplate(), this.shadowRoot);
    }

	renderTemplate() {
        return this.constructor.template(this.props, this);
    }

	connectedCallback() {
		this.tabIndex = 0;

		this.addEventListener('focus', e => {
			this.setAttribute('active', '');
		});

		this.addEventListener('blur', e => {
			this.removeAttribute('active');
		});

		if(this.options && this.options.length < 1) {
			const childOptions = [];
			for(let child of this.children) {
				childOptions.push({
					name: child.getAttribute('name'),
					value: child.getAttribute('value'),
				});
			}
			this.options = childOptions;
		}
	}

}

customElements.define("dropdown-button-2", DropdownButton);
