import { LightRenderer } from "../../viewport/renderer/LightRenderer.js";
import { Resources } from "../../viewport/resources/Resources.js";
import { Camera } from '../../viewport/scene/Camera.js';
import { Scene } from "../../viewport/scene/Scene.js";
import { Scheduler } from "../../viewport/Scheduler.js";
import { ViewportController } from "../../viewport/controlers/ViewportController.js";

export default class ViewportLight extends HTMLElement {

    static get template() {
        return `
            <style>
                :host {
                    display: block;
                }
                canvas {
                    display: block;
                }
            </style>
        `;
    }

    get width() {
        this._width = +this.getAttribute('width') || this._width;
        return this._width;
    }

    get height() {
        this._height = +this.getAttribute('height') || this._height;
        return this._height;
    }

    set width(val) {
        this._width = val;
    }

    set height(val) {
        this._height = val;
    }

    constructor() {
        super();

        this.width = this.clientWidth;
        this.height = this.clientHeight;

        this.scheduler = new Scheduler();

        this.attachShadow({ mode: 'open' });
        this.root = this.shadowRoot;

        this.canvas = document.createElement('canvas');

        this.renderer = new LightRenderer(this.canvas);
        
        this.camera = new Camera({
            position: [0, 5, -5],
            rotation: [10, 0, 0],
            fov: 106
        });

        this.controller = new ViewportController(this.camera, this);

        this.scene = new Scene([ this.camera ]);

        this.frame = {
            currentFrame: 0,
            nextFrame: 0,
            lastFrame: 0,
            accumulator: 0,
            tickrate: 1000 / 128
        };

        this.root.innerHTML = this.constructor.template;
        this.root.appendChild(this.canvas);
    }

    connectedCallback() {
        Resources.load().then(() => {
            this.init();
            this.render();
        });
    }

    disconnectedCallback() {
        if(this.frame.nextFrame) {
            cancelAnimationFrame(this.frame.nextFrame);
        }
    }

    setScene(scene) {
        this.scene = scene;
        this.scene.add(this.camera);
    }

    setResolution(width, height) {
        // resolution
        this.renderer.setResolution(width, height);
        this.renderer.initialRender = true;
    }

    init() {
        window.addEventListener('resize', () => {
            this.width = this.clientWidth;
            this.height = this.clientHeight;
            
            this.setResolution(this.width, this.height);
        });

        this.width = this.clientWidth;
        this.height = this.clientHeight;

        this.setResolution(this.width, this.height);
    }

    render() {
        const currentFrame = performance.now();
        let delta = currentFrame - this.frame.lastFrame;
        
        this.frame.lastFrame = currentFrame;
        this.frame.nextFrame = requestAnimationFrame(this.render.bind(this));

        // dont update on inital render
        if(this.renderer.initialRender) {
            delta = 0;
        }

        // reset delta for the very first frame after initial load
        if(this.frame.accumulator == 0) {
            delta = this.frame.tickrate;
        }

        this.frame.accumulator += delta;

        this.renderer.info.drawtime = this.frame.accumulator.toFixed(1);

        while (this.frame.accumulator > this.frame.tickrate) {
            this.frame.accumulator -= this.frame.tickrate;

            this.scene.update(this.frame.tickrate);
            this.scheduler.run(this.frame.tickrate);
        }
        
        this.renderer.draw(this.scene, {
            camera: this.camera,
        });

        this.renderer.info.fps = Math.round(1000 / delta);
    }

}

customElements.define('vp-viewport', ViewportLight);
