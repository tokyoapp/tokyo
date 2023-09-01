import { RiveCanvas, File, Artboard } from '@rive-app/canvas-advanced-single';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Animations, registerListeners, Alignments } from './rive.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sv-animation': Animation;
    }
  }
}

export type RiveEvents = 'load';

class RiveEvent extends Event {
  constructor(event: RiveEvents, data: any) {
    super(event);

    Object.assign(this, data);
  }
}

@customElement('sv-animation')
export class Animation extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  @property() src?: string;
  @property() themed?: boolean;
  @property() artboard?: string;
  @property() animation?: string;
  @property() inputs?: Record<string, number | boolean>;
  @property() width?: number;
  @property() height?: number;
  @property() paused?: boolean;

  public loaded = false;

  private currentArtboard?: Artboard;
  private currentAnimation;
  private currentStateMachine;
  private currentTick = 0;
  private frame?: number;
  private frameCount = 0;
  private listeners;
  private rive?: RiveCanvas;
  private riveCanvas: HTMLCanvasElement;

  public get currentTime() {
    return this.currentTick;
  }

  public set currentTime(val: number) {
    this.currentTick = val;
  }

  public get duration() {
    return this.currentAnimation ? this.currentAnimation.duration / 60 : undefined;
  }

  constructor() {
    super();

    this.riveCanvas = document.createElement('canvas');

    return this;
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    if (this.src) {
      await Animations.loadCached(this.src).then((anim) => {
        this.initAnimation(anim.rive, anim.file);
        this.rive = anim.rive;
      });
    }
  }

  disconnectedCallback(): void {
    if (!this.rive) return;

    this.frame && this.rive.cancelAnimationFrame(this.frame);
    this.rive.cleanup();
    // remove listeners
    this.listeners && this.listeners();
  }

  protected updated(): void {
    if (!this.rive) return;

    if (this.width && this.height) {
      this.resize(this.width, this.height);
    }

    if (this.inputs && this.currentStateMachine) {
      for (let i = 0; i < this.currentStateMachine.inputCount(); i++) {
        const input = this.currentStateMachine.input(i);

        if (input.name in this.inputs) {
          switch (input.type) {
            case this.rive.SMIInput.bool:
              input.asBool().value = this.inputs[input.name];
              break;
            case this.rive.SMIInput.number:
              input.asNumber().value = this.inputs[input.name];
              break;
            case this.rive.SMIInput.trigger:
              // TOOD: is just a boolean rn, cant call it directly
              //  should be exposed method of the component?
              if (this.inputs[input.name]) {
                input.asTrigger().fire();
              }
              break;
          }
        }
      }
    }
  }

  private resize(w: number, h: number) {
    if (this.riveCanvas) {
      this.riveCanvas.width = w;
      this.riveCanvas.height = h;
    }

    this.dispatchEvent(new Event('resize'));
    // TODO: sideeffect: clears canvas on resize
  }

  private initAnimation(rive: RiveCanvas, file: File) {
    const canvas = this.riveCanvas;
    canvas.width = this.width || 128;
    canvas.height = this.height || 128;

    if (!file) throw new Error('Animations file not compatible.');

    this.currentArtboard = this.artboard
      ? file.artboardByName(this.artboard)
      : file.defaultArtboard();
    if (!this.currentArtboard) throw new Error('Artboard, "' + this.artboard + '" doesnt exist.');

    let stateMachine, animation;

    if (this.animation) {
      const anim = this.currentArtboard.animationByName(this.animation);
      this.currentAnimation = anim;
      animation = new rive.LinearAnimationInstance(anim, this.currentArtboard);
    } else {
      stateMachine = new rive.StateMachineInstance(
        this.currentArtboard.stateMachineByIndex(0),
        this.currentArtboard
      );
      this.currentStateMachine = stateMachine;
    }

    const currentRenderer = rive.makeRenderer(canvas);

    const getAlignments = (): Alignments => {
      return [
        rive.Fit.cover,
        rive.Alignment.center,
        {
          minX: 0,
          minY: 0,
          maxX: canvas.width,
          maxY: canvas.height,
        },
        this.currentArtboard?.bounds || {
          minX: 0,
          minY: 0,
          maxX: canvas.width,
          maxY: canvas.height,
        },
      ];
    };

    if (stateMachine) {
      this.listeners = registerListeners({
        rive,
        canvas,
        stateMachines: [stateMachine],
        alignments: getAlignments(),
      });
    }

    const update = (elapsedTimeSec: number) => {
      let advance = this.animationShouldUpdate();

      if (animation) {
        if (animation.time + elapsedTimeSec >= 0) {
          const animationAdvanced = animation.advance(elapsedTimeSec);
          animation.apply(1);
          const boardAdvanced = this.currentArtboard?.advance(elapsedTimeSec);
          return advance || animationAdvanced || boardAdvanced;
        }
      } else {
        const stateAdvanced = stateMachine.advance(elapsedTimeSec);
        const boardAdvanced = this.currentArtboard?.advance(elapsedTimeSec);

        advance = advance || stateAdvanced || boardAdvanced;
      }

      return advance;
    };

    const draw = () => {
      this.frameCount++;

      if (currentRenderer) {
        currentRenderer.save();
        currentRenderer.clear();
        currentRenderer.align(...getAlignments());
        this.currentArtboard?.draw(currentRenderer);
        currentRenderer.restore();
      }

      this.onFrame();
    };

    let lastTick;

    const renderLoop = (time: number) => {
      if (!this.paused) {
        this.currentTick = time;
      }

      if (lastTick === undefined) lastTick = this.currentTick;

      if (update((this.currentTick - lastTick) / 1000)) draw();

      lastTick = this.currentTick;
      this.frame = rive.requestAnimationFrame(renderLoop);
    };

    if (this.frame) {
      rive.cancelAnimationFrame(this.frame);
    }
    this.frame = rive.requestAnimationFrame(renderLoop);

    this.loaded = true;

    this.dispatchEvent(new RiveEvent('load', { animation: this.currentAnimation }));
  }

  public animationShouldUpdate() {
    return this.frameCount < 3;
  }

  public onFrame() {
    // placeholder to extend
  }

  render() {
    return html`${this.riveCanvas}`;
  }
}
