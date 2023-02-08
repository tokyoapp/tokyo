import { LitElement, css, html } from 'lit-element';

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export default class ColorPicker extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                width: 185px;
                position: relative;
                z-index: 10000;
            }

            .color-picker {
                padding: 15px;
                border-radius: 6px;
                background: var(--gyro-pallate-panel-content);
            }

            .input {
                margin-bottom: 15px;
            }

            gyro-input {
                width: 100%;
                height: 25px;
            }

            .color-wheel {
                display: grid;
                grid-gap: 10px;
                grid-template-columns: 1fr auto;
                grid-template-rows: 1fr auto;
                grid-template-areas: "wheel lightness"
                                        "transparency none";
            }

            .wheel {
                grid-area: wheel;
                width: 130px;
                height: 130px;
                border-radius: 50%;
                background: grey;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .transparency {
                grid-area: transparency;
                width: 100%;
                height: 15px;
                border-radius: 40px;
                background: url('images/transparency.svg');
                background-size: 10px;
                position: relative;
                overflow: hidden;
            }

            .transparency::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, black);
                pointer-events: none;
            }

            .lightness {
                grid-area: lightness;
                width: 15px;
                height: 100%;
                border-radius: 40px;
                background: linear-gradient(0deg, black, white);
            }

            .slider-handle {
                width: 11px;
                height: 11px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }

            .slider-handle:hover {
                background: rgba(255, 255, 255, 0.5);
            }

            .presets {
                display: grid;
                grid-auto-flow: column;
                grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
                grid-gap: 10px;
                margin-top: 15px;
            }

            .preset {
                border-radius: 50%;
                width: 20px;
                height: 20px;
            }
        `;
    }

	render() {
		return html`
			<div class="color-picker">
                <div class="input">
                    <gyro-input></gyro-input>
                </div>
                <div class="color-wheel">
                    <canvas class="wheel" width="130" height="130"></canvas>
                    <div class="transparency">
                        <div class="slider-handle"></div>
                    </div>
                    <div class="lightness">
                        <div class="slider-handle"></div>
                    </div>
                </div>
                <div class="presets">
                    <div class="preset" style="background: grey;"></div>
                    <div class="preset" style="background: grey;"></div>
                    <div class="preset" style="background: grey;"></div>
                </div>
			</div>
		`;
	}

	update(...args) {
        super.update(...args);
        
        const wheel = this.shadowRoot.querySelector('canvas.wheel');

        const context = wheel.getContext("2d");

        const width = wheel.width;
        const height = wheel.height;

        const center = [
            wheel.width / 2,
            wheel.height / 2,
        ];

        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;

        for(let i = 0; i < data.length; i += 4) {

            const x = (i / 4) / width;
            const y = Math.floor((i / 4) % width);

            data[i + 3] = 255;

            const r = Math.sqrt(Math.pow((x - center[0]), 2) + Math.pow((y - center[1]), 2)) * 2;

            const deltaX = center[0] - x;
            const deltaY = center[1] - y;
            const a = Math.atan2(deltaY, deltaX) / (Math.PI * 2);

            const rgb = hslToRgb(a, r / width, .5);

            data[i + 0] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
        }

        context.putImageData(imageData, 0, 0);

        const x = center[0];
        const y = center[1];

        context.lineWidth = 2;
        context.strokeStyle = "white";
        context.arc(x, y, 6.5, 0, 2 * Math.PI);
        context.stroke();
	}

}

customElements.define("gyro-color-picker", ColorPicker);
