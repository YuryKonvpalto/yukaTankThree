import * as THREE from "three";
import Emitter from './emitter.js'
import Tween from './tween.js'
import { Shape } from './const.js'
// import explode1 from "../../../../../img/PanzerGame/particlesImg/explode3.png";
// import explode from "../../../../../img/PanzerGame/particlesImg/explodeRed2.png";
// import explode from "../../../../../img/PanzerGame/particlesImg/plane.png";
// import explode from "../../../../../img/PanzerGame/particlesImg/smoke.png";
import explode from "../../../../../img/PanzerGame/particlesImg/smoke2.png";
// import explode from "../../../../../img/PanzerGame/particlesImg/fireSmoke.png";




class ExplodeEmitter extends Emitter {

    constructor() {

        super({
            positionShape: Shape.SPHERE,
            position: new THREE.Vector3(0, 10, 0),
            positionRadius: 4,
            velocityShape: Shape.SPHERE,
            velocity: new THREE.Vector3(30, 50, 30),
            velocityRange: new THREE.Vector3(30, 50, 30),
            texture: new THREE.TextureLoader().load(explode),
            size: 45,
            sizeRange: 100,
            sizeTween: new Tween([0, 0.01, 0.1, .95], [0, 60, 200, 28]),
            opacityTween: new Tween([0, 0.01, 0.1, 0.95], [1, 1, 0.4, 0]),
            color: new THREE.Vector3(0.15, 0.1, 0.7),
            colorRange: new THREE.Vector3(0.7, 0.4, 0.3),

            // blendMode: THREE.AdditiveBlending,
            particlesPerSecond: 11,
            particleDeathAge: 0.12,

            // loop: false,

            name: 'explode' ///it triggers no-loop in emitter
        })
    }

    update(dt) {

        const recycleIndices = []
        const positionArray = this.geometry.attributes.position.array
        const opacityArray = this.geometry.attributes.opacity.array
        const visibleArray = this.geometry.attributes.visible.array
        const colorArray = this.geometry.attributes.color.array
        const angleArray = this.geometry.attributes.angle.array
        const sizeArray = this.geometry.attributes.size.array

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particles[i]
            if (particle.alive) {

                particle.update(dt)
                // console.log(particle.age);
                if (particle.age > this.particleDeathAge) {
                    particle.alive = 0.0
                    recycleIndices.push(i)
                }
                positionArray[i * 3] = particle.position.x
                positionArray[i * 3 + 1] = particle.position.y
                positionArray[i * 3 + 2] = particle.position.z
                colorArray[i * 3] = particle.color.r
                colorArray[i * 3 + 1] = particle.color.g
                colorArray[i * 3 + 2] = particle.color.b
                visibleArray[i] = particle.alive
                opacityArray[i] = particle.opacity
                angleArray[i] = particle.angle
                sizeArray[i] = particle.size
            }
        }

        this.geometry.attributes.size.needsUpdate = true
        this.geometry.attributes.color.needsUpdate = true
        this.geometry.attributes.angle.needsUpdate = true
        this.geometry.attributes.visible.needsUpdate = true
        this.geometry.attributes.opacity.needsUpdate = true
        this.geometry.attributes.position.needsUpdate = true

        if (!this.alive) return

        ///its only for explodeEmitter - makes it cycle only once
        if (this.age > this.particleDeathAge) {
            return
        }


        if (this.age < this.particleDeathAge) {
            let startIndex = Math.round(this.particlesPerSecond * (this.age + 0))
            let endIndex = Math.round(this.particlesPerSecond * (this.age + dt))
            if (endIndex > this.particleCount) {
                endIndex = this.particleCount
            }
            for (let i = startIndex; i < endIndex; i++) {
                this.particles[i].alive = 1.0
            }
        }

        for (let j = 0; j < recycleIndices.length; j++) {

            let i = recycleIndices[j]
            this.particles[i] = this.createParticle()
            this.particles[i].alive = 1.0
            positionArray[i * 3] = this.particles[i].position.x
            positionArray[i * 3 + 1] = this.particles[i].position.y
            positionArray[i * 3 + 2] = this.particles[i].position.z
        }
        this.geometry.attributes.position.needsUpdate = true

        this.age += dt

        if (this.age > this.deathAge && !this.loop) {
            this.alive = false
        }

    }

}

export default ExplodeEmitter

