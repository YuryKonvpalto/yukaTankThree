// import * as YUKA from 'yuka'
import * as THREE from "three";

class Bullet {

    constructor(scale) {

        // this.gunScale = 12.7
        // this.gunScale = 0.7 //best size
        this.gunScale = scale //best size

        let gunBulletGeometry = new THREE.SphereGeometry(0.15, 2, 2); //radius = 0.05 is optimal
        let gunBulletMaterial = new THREE.MeshBasicMaterial({ color: 'red' });
        gunBulletGeometry.scale(this.gunScale, this.gunScale, this.gunScale)
        let mesh = new THREE.Mesh(gunBulletGeometry, gunBulletMaterial);
        mesh.visible = false

        return mesh;
    }

    createBulletMesh() {


    }

}

export { Bullet };
