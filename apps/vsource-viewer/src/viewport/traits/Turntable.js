import { Vec } from '../Math.js';
import Input from '../Input.js';

let x = 0;
let lastX = 0;
const dist = -32;

export default  {

    onCreate(entity) {
        Input.init();

        entity.turntable = true;

        Input.onDrag(e => {
            if(e.button == 0 && entity.turntable) {
                if(e.first) {
                    lastX = e.x;
                }

                x += (e.x - lastX) / 400;

                lastX = e.x;
    
                entity.position.x = Math.sin(-x) * dist;
                entity.position.z = Math.cos(-x) * dist;
                entity.rotation.y = x;
            }
        });

        entity.position.x = Math.sin(-x) * dist;
        entity.position.z = Math.cos(-x) * dist;
        entity.rotation.y = x;
    },

    methods: {
        setDegrees(deg) {
            lastX = deg;
            x = deg;
            this.position.x = Math.sin(-deg) * dist;
            this.position.z = Math.cos(-deg) * dist;
            this.rotation.y = deg;
        }
    }

}
