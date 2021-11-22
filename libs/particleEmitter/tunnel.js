import * as THREE from "three";
import Emitter from './emitter.js'
import { Shape } from './const.js'
import flare from "../../../../../img/PanzerGame/particlesImg/plane.png";
import { MathUtils } from "yuka";




class TunnelEmitter extends Emitter {

    constructor() {
        super({
            positionShape: Shape.CUBE,
            position: new THREE.Vector3(0, 0, 0),
            // positionRange: new THREE.Vector3(5, 10, 5),
            positionRange: new THREE.Vector3(MathUtils.randFloat(1, 7), 10, MathUtils.randFloat(1, 7)),

            velocityShape: Shape.CUBE,
            velocity: new THREE.Vector3(0, MathUtils.randFloat(25, 70), 0),
            velocityRange: new THREE.Vector3(20, 40, 20),

            angle: 0,
            // angle: Math.random() * 100,
            angleRange: 720,
            angleVelocity: 10,
            angleVelocityRange: 0,

            texture: new THREE.TextureLoader().load(flare),

            // size: 29.0 ,
            size: MathUtils.randFloat(23, 35),
            sizeRange: 40.0,
            color: new THREE.Vector3(0.95, 0.15, 0.2),
            colorRange: new THREE.Vector3(1, 1, 0),
            opacity: 0.8,
            // blendMode: THREE.AdditiveBlending,

            particlesPerSecond: 100,
            particleDeathAge: 0.6,
            deathAge: 60

        })
    }

}

export default TunnelEmitter