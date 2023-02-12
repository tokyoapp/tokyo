// ported from common-components

export default class Notification {

    static get TEXT() { return 0; }

    constructor({
        text = "",
        time = 2000,
        onclick = () => {},
        type = Notification.TEXT
    } = {}) {
        this.text = text;
        this.time = time;
        this.type = type;
        this.onclick = onclick;
    }

    show() {
        const text = this.text;
        const time = this.time;

        const container = document.querySelector('notifications') || document.createElement('notifications');

        if (!container.parentNode) {
            document.body.appendChild(container);
        }

        const note = document.createElement("notification");

        switch (this.type) {
            case Notification.TEXT:
                note.innerHTML = text;
                break;
        }

        function close() {
            note.style.setProperty("animation", "fade-out .25s ease");
            setTimeout(() => { note.remove(); }, 200);
        }

        const timer = setTimeout(() => close(), time);

        note.onclick = () => {
            clearTimeout(timer);
            this.onclick && this.onclick(note);
            close();
        }

        const style = document.createElement('style');
        style.innerHTML = `
            notification {
                padding: 10px 20px;
                background: #1c1c1c;
                box-shadow: 1px 2px 5px hsla(0, 0%, 0%, 0.25);
                border-radius: 4px;
                display: block;
                color: #eee;
                font-size: 16px;
                opacity: 0.98;
                min-width: 150px;
                animation: slide-in .15s ease;
                user-select: none;
                cursor: pointer;
                margin-bottom: 10px;
                position: relative;
                overflow: hidden;
            }
            notification:hover::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                opacity: 0.025;
            }
            notification:active::after {
                background: black;
            }
            @keyframes slide-in {
                from { transform: translateY(-100%); opacity: 0; }
            }
            @keyframes fade-out {
                to { opacity: 0; }
            }
        `;
        note.appendChild(style);

        container.appendChild(note);

        return note;
    }
}
