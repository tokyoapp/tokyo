const state = {
    time: 0,
    playing: false,
}

const eventTarget = new EventTarget();

export default class Timer {

    static get time() {
        return state.time;
    }

    static set time(second) {
        state.time = second;
        Timer.emit('update');
    }

    static play() {
        state.playing = true;
        console.log('play');
        eventTarget.dispatchEvent(new Event('play'));
    }
    
    static pause() {
        state.playing = false;
        console.log('pause');
        eventTarget.dispatchEvent(new Event('pause'));
        Timer.emit('update');
    }

    static get playing() {
        return state.playing;
    }

    static on(event, callback) {
        eventTarget.addEventListener(event, callback);
        return () => {
            eventTarget.removeEventListener(event, callback);
        }
    }

    static emit(event) {
        eventTarget.dispatchEvent(new Event('update'));
    }

}

let lastTick = null;
const updateUI = ms => {
    
    if(lastTick != null) {
        const delta = ms - lastTick;

        if(Timer.playing) {
            Timer.time += delta / 1000;
            Timer.emit('update');
        }
    }
    lastTick = ms;

    requestAnimationFrame(updateUI);
}

updateUI();
