import * as THREE from "three";
import Emitter from './emitter.js'
import Tween from './tween.js'
import { Shape } from './const.js'
import explode from "../../../../../img/PanzerGame/particlesImg/explode.png";


class ExplodeEmitter extends Emitter {

    constructor() {

        super({
            positionShape: Shape.SPHERE,
            position: new THREE.Vector3(0, 10, 0),
            positionRadius: 10,
            velocityShape: Shape.SPHERE,
            velocity: new THREE.Vector3(30, 200, 30),
            velocityRange: new THREE.Vector3(10, 20, 10),
            texture: new THREE.TextureLoader().load(explode),
            size: 10,
            sizeRange: 100,
            sizeTween: new Tween([0, 0.05, 0.3, 0.45], [0, 100, 300, 10]),
            opacityTween: new Tween([0, 0.05, 0.3, 0.45], [1, 1, 0.5, 0]),

            blendMode: THREE.AdditiveBlending,
            particlesPerSecond: 10,
            particleDeathAge: 1,
        })
    }

}

export default ExplodeEmitter

// class TunnelEmitter extends Emitter {

//     constructor() {
//         super({
//             positionShape: Shape.CUBE,
//             position: new THREE.Vector3(0, 0, 0),
//             positionRange: new THREE.Vector3(10, 10, 10),

//             velocityShape: Shape.CUBE,
//             velocity: new THREE.Vector3(0, 70, 0),
//             velocityRange: new THREE.Vector3(10, 40, 10),

//             angle: 0,
//             angleRange: 720,
//             angleVelocity: 10,
//             angleVelocityRange: 0,

//             texture: new THREE.TextureLoader().load(flare),

//             size: 19.0,
//             sizeRange: 40.0,
//             color: new THREE.Vector3(0.95, 0.15, 0.2),
//             colorRange: new THREE.Vector3(1, 1, 0),
//             opacity: 0.8,
//             // blendMode: THREE.AdditiveBlending,

//             particlesPerSecond: 100,
//             particleDeathAge: 0.6,
//             deathAge: 60
//         })
//     }

// }

// export default TunnelEmitter