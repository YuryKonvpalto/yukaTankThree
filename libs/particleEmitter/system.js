
class ParticleSystem {

    constructor(params) {
        Object.assign(this, params)

        this.time = 0
    }

    get emitter() {
        return this._emitter
    }

    set emitter(val) {
        this._emitter = val
        this.mesh = this._emitter.mesh
    }

    update() {
        const now = +new Date
        const dt = (now - this._startTime) / 1000
        this._emitter.update(dt * 0.5)

        this._startTime = now
        this.id = requestAnimationFrame(this.update.bind(this))

        this.time += dt

        if ((this._emitter.name == 'explode') && (this.time > this._emitter.particleDeathAge * 3.)) {
            this.time = 0
            this._emitter.age = 0
            // console.log(1111);
            this.mesh.visible = false
            this.stop()
        }

    }

    start() {
        this._startTime = +new Date
        this.mesh.visible = true
        this.update()
    }

    stop() {
        cancelAnimationFrame(this.id)
    }

    destroy() {
        this.stop()
        this.mesh.parent.remove(this.mesh)
    }

}

export default ParticleSystem