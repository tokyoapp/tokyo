import { default as GlViewport } from './Viewport.js';
import { html, css, LitElement } from "lit-element";
import componentStyles from '../Components.style';

export default class Viewport extends LitElement {

    get active() {
        return this.hasAttribute('active');
    }

    inFocus() {
        return this._inFocus;
    }

    registerDefaultEventListeners() {
        // focus handlers
        this._inFocus = true;

        this.addEventListener('mousemove', e => {
            this._inFocus = true;
        });
        this.addEventListener('mouseleave', e => {
            this._inFocus = false;
        });
        this.addEventListener('mouseout', e => {
            this._inFocus = false;
        });
    }

	render() {
		return html`
			<style>
				vp-viewport {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
				}

				.hud-slot {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: block;
					right: 10px;
					z-index: 10;
					pointer-events: none;
				}

				${componentStyles}
			</style>
			<div class="toolbar">
				<span>
					<slot name="toolbar-1"></slot>
				</span>
				<span>
					<slot name="toolbar-2"></slot>
				</span>
			</div>
			<slot name="hud" class="hud-slot"></slot>
			${this.viewport}
		`;
	}

	constructor(props = {}) {
		super();

        this.props = props;

        this.registerDefaultEventListeners();

		this.viewport = new GlViewport(
			this.parentNode.clientWidth,
			this.parentNode.clientHeight
		);

		window.addEventListener('resize', () => {
			this.viewport.setResolution(
				this.parentNode.clientWidth,
				this.parentNode.clientHeight	
			);
		});
		window.addEventListener('layout', () => {
			this.viewport.setResolution(
				this.parentNode.clientWidth,
				this.parentNode.clientHeight	
			);
		});

		this.viewport.renderer.background = [26 / 255, 26 / 255, 26 / 255, 1];
		this.viewport.camera.farplane = 200;

		this.innerHTML = `
			<style>
				#openButton, #openFilesButton {
					display: none;;
				}
				vs-viewport .holo {
					width: 32px;
					height: 32px;
					background: rgb(0 0 0 / 30%);
					border: 1px solid #3e3e3e;
					border-radius: 4px;
					display: flex;
					justify-content: center;
					align-items: center;
					backdrop-filter: blur(4px);
					cursor: pointer;
				}
				vs-viewport .holo:hover {
					background: rgb(20 20 20 / 20%);
				}
				vs-viewport .holo:active {
					background: rgb(50 50 50 / 40%);
				}
				
				.hud {
					position: absolute;
					bottom: 20px;
					right: 20px;
					font-size: 14px;
				}
			</style>
			
			<input id="openButton" multiple title="Open .vpk or .bsp files." accept=".vpk,.bsp,.mdl,.vtx,.vvd" type="file" />

			<input id="openFilesButton" multiple directory webkitDirectory title="Import model files." accept=".mdl,.vtx,.vvd"
				type="file" />

			<button class="holo" slot="toolbar-1" id="toggleGridBtn" title="Toggle Grid">
				<gyro-icon icon="Grid"></gyro-icon>
			</button>
			<button class="holo" slot="toolbar-2" id="resetViewBtn" title="Reset View">
				<gyro-icon icon="Loop"></gyro-icon>
			</button>
			<button class="holo" slot="toolbar-2" id="normalView" title="Toggle Normals View">
				<gyro-icon icon="Axis"></gyro-icon>
			</button>
			<button class="holo" slot="toolbar-2" id="uvView" title="Toggle UV View">
				<gyro-icon icon="Wireframe"></gyro-icon>
			</button>

			<div slot="hud" class="hud">
				<!-- <div class="object-properties" id="objectProperties">
						<div class="prop-row">
							<label>Translate X</label>
							<gyro-fluid-input></gyro-fluid-input>
						</div>
						<div class="prop-row">
							<label>Translate Y</label>
							<gyro-fluid-input></gyro-fluid-input>
						</div>
						<div class="prop-row">
							<label>Translate Z</label>
							<gyro-fluid-input></gyro-fluid-input>
						</div>
						<hr/>
						<div class="prop-row">
							<label>Rotate X</label>
							<gyro-fluid-input></gyro-fluid-input>
						</div>
						<div class="prop-row">
							<label>Rotate Y</label>
							<gyro-fluid-input></gyro-fluid-input>
						</div>
						<div class="prop-row">
							<label>Rotate Z</label>
							<gyro-fluid-input></gyro-fluid-input>
						</div>
					</div> -->
				<div id="fileInfo"></div>
			</div>
		`;
	}

	setScene(scene) {
		this.viewport.setScene(scene);
	}
}

customElements.define("vs-viewport", Viewport);
