import { html, LitElement, css } from 'https://cdn.skypack.dev/lit-element@2.4.0';
import Timer from '../Timer.js';

export default class Timeline extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                overflow: hidden;
                position: relative;
                width: 100%;
                height: auto;
                min-height: 100%;
                user-select: none;
                -webkit-user-drag: none;
            }
            .container {

            }
    
            .background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 0;
            }
    
            canvas {
                image-rendering: pixelated;
            }
    
            .tracks {
                width: 100%;
                padding: 30px 0 30px 0;
                z-index: 10;
            }
    
            .track {
                position: relative;
                width: 100%;
                height: 153px;
                padding: 1px;
                box-sizing: border-box;
            }

            .track-content {
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.03);
            }
            .track-content:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .track-content slot {
                display: flex;
                height: 100%;
                position: relative;
            }

            .playhead {
                position: absolute;
                top: 0px;
                left: calc(var(--time) * 1px - var(--scrollX) * 1px);
                height: 100%;
                pointer-events: none;
                z-index: 100;
            }
            .playhead::before {
                content: "";
                position: absolute;
                top: 0px;
                width: 3px;
                height: 20px;
                background: white;
                transform: translateX(-50%);
            }
            .playhead::after {
                content: "";
                position: absolute;
                top: 0px;
                width: 1px;
                height: 100%;
                background: white;
                opacity: calc(var(--playing) * 0.5);
            }
        `;
    }

    resize() {
        this.canvas.width = this.clientWidth;
        this.canvas.height = this.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    constructor() {
        super();

        const backgroundCanvas = document.createElement('canvas');
        this.canvas = backgroundCanvas;
        backgroundCanvas.width = this.clientWidth;
        backgroundCanvas.height = this.clientHeight;

        this.width = backgroundCanvas.width;
        this.height = backgroundCanvas.height;

        window.addEventListener('resize', e => {
            this.resize();
        })

        const ctx = backgroundCanvas.getContext("2d");

        const timeline = {
            scrollX: 0,
            scrollY: 0,
            selection: [[0, 0], [0, 0]],
        }

        this.pointer = {
            x: 0,
            y: 0,
        }

        const gblobalScale = 100;
        const trackCount = 3;
        const trackHeight = 153;

        let mousedown = false;
        let dragging = 0;
        let mousedownmove = 0;
        let deltaX = 0;

        this.addEventListener('wheel', e => {
            const newX = timeline.scrollX - Math.sign(e.deltaY) * 50
            if(newX <= 0) {
                timeline.scrollX = newX; 
            }
        })
        this.addEventListener('mousedown', e => {
            const mouseX = e.x - this.getClientRects()[0].x;
            const mouseY = e.y - this.getClientRects()[0].y;

            if(e.target == this) {
                timeline.selection[0][0] = Math.min(Math.floor((mouseY - 30) / trackHeight), trackCount - 1);
                timeline.selection[0][1] = Math.min(Math.floor((mouseY - 30) / trackHeight), trackCount - 1);
                timeline.selection[1][0] = (mouseX - timeline.scrollX) / gblobalScale;
                timeline.selection[1][1] = (mouseX - timeline.scrollX) / gblobalScale;
    
                Timer.time = (mouseX - timeline.scrollX) / gblobalScale;
            }

            mousedown = true;
            mousedownmove = true;
        })
        this.addEventListener('mouseup', e => {
            const mouseX = e.x - this.getClientRects()[0].x;
            const mouseY = e.y - this.getClientRects()[0].y;

            if(e.target == this) {
                if(Math.abs(deltaX) > 2) {
                    timeline.selection[0][1] = Math.min(Math.floor((mouseY - 30) / trackHeight), trackCount - 1);
                    timeline.selection[1][1] = (mouseX - timeline.scrollX) / gblobalScale;
                }
            }
            
            if(Math.abs(deltaX) < 2) {
                timeline.selection[0][0] = Math.min(Math.floor((mouseY - 30) / trackHeight), trackCount - 1);
                timeline.selection[0][1] = Math.min(Math.floor((mouseY - 30) / trackHeight), trackCount - 1);
                timeline.selection[1][0] = (mouseX - timeline.scrollX) / gblobalScale;
                timeline.selection[1][1] = (mouseX - timeline.scrollX) / gblobalScale;
                Timer.time = (mouseX - timeline.scrollX) / gblobalScale;
            }

            dragging = false;
            mousedown = false;
            mousedownmove = false;
            deltaX = 0;
        })
        window.addEventListener('mousemove', e => {
            const mouseX = e.x - this.getClientRects()[0].x;
            const mouseY = e.y - this.getClientRects()[0].y;
            
            if(mousedownmove) {
                deltaX += e.movementX;
            }
            if(e.target == this) {
                if(!dragging && mousedown && Math.abs(deltaX) > 2) {
                    dragging = true;
                }
            }
            if(dragging) {
                timeline.selection[0][1] = Math.min(Math.floor((mouseY - 30) / trackHeight), trackCount - 1);
                timeline.selection[1][1] = (mouseX - timeline.scrollX) / gblobalScale;
            }

            this.pointer.x = mouseX;
            this.pointer.y = mouseY;
        })

        const draw = () => {
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.fillStyle = "#1c1c1c";
            ctx.font = "9px Arial";
            ctx.textAlign = "center";

            let second = 0;
            for(let i = timeline.scrollX; i < (backgroundCanvas.width - timeline.scrollX); i+=100) {
                let x = i + timeline.scrollX;
                if(x > 0) {
                    ctx.fillStyle = "grey";
                    ctx.fillText(second, x, 15);
                    ctx.fillStyle = "#1c1c1c";
                    ctx.fillRect(x, 20, 1, this.height);
                }

                second++;
            }

            const selection = timeline.selection;
            ctx.fillStyle = "rgba(100, 100, 100, 0.25)";

            const trackStart = Math.min(...selection[0]) * trackHeight;
            const trackEnd = Math.max(...selection[0]) * trackHeight;
            const start = selection[1][0] * gblobalScale;
            const end = selection[1][1] * gblobalScale;
            ctx.fillRect(
                start + timeline.scrollX, 
                trackStart + 30, 
                end - start, 
                ((trackEnd + trackHeight) - trackStart)
            );
            ctx.fillStyle = "rgba(100, 100, 100, 0.33)";
            ctx.fillRect(
                start + timeline.scrollX, 
                trackStart + 30,
                1,
                ((trackEnd + trackHeight) - trackStart)
            );
            ctx.fillRect(
                start + timeline.scrollX + (end - start), 
                trackStart + 30,
                1,
                ((trackEnd + trackHeight) - trackStart)
            );

            ctx.fillStyle = "rgba(100, 100, 100, 0.33)";
            ctx.fillRect(this.pointer.x, 0, 2, 20);

            this.style.setProperty('--time', Timer.time * gblobalScale);
            this.style.setProperty('--scrollX', -timeline.scrollX);
            this.style.setProperty('--playing', Timer.playing ? 1 : 0);

            requestAnimationFrame(draw);

            window.timeline = JSON.stringify(timeline);
        }

        draw();
    }

    connectedCallback() {
        super.connectedCallback();
        requestAnimationFrame(this.resize.bind(this));
    }

    render() {
        return html`
            <div class="container">
                <div class="background">
                    ${this.canvas}
                </div>
                <div class="tracks">
                    <div class="track">
                        <div class="track-content">
                            <slot name="track1"></slot>
                        </div>
                    </div>
                    <div class="track">
                        <div class="track-content">
                            <slot name="track2"></slot>
                        </div>
                    </div>
                    <div class="track">
                        <div class="track-content">
                            <slot name="track3"></slot>
                        </div>
                    </div>
                </div>
                <div class="playhead"></div>
            </div>
        `;
    }

}

customElements.define('audio-timeline', Timeline);