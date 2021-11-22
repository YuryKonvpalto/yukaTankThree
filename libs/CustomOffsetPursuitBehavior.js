import * as THREE from "three";
import * as YUKA from 'yuka'



const offsetWorld = new YUKA.Vector3();
const toOffset = new YUKA.Vector3();
const newLeaderVelocity = new YUKA.Vector3();
const predictedPosition$1 = new YUKA.Vector3();
let raycaster = new THREE.Raycaster()
// let helpYukaVec3 = new YUKA.Vector3(0, 1, 0)

class CustomOffsetPursuitBehavior extends YUKA.OffsetPursuitBehavior {


    constructor(mainPlane) {

        super();

        this.mainPlane = mainPlane
    }


    calculate(vehicle, force /*, delta */) {

        const leader = this.leader;
        const offset = this.offset;

        // calculate the offset's position in world space
        offsetWorld.copy(offset).applyMatrix4(leader.worldMatrix);

        // calculate the vector that points from the vehicle to the offset position
        toOffset.subVectors(offsetWorld, vehicle.position);

        // the lookahead time is proportional to the distance between the leader
        // and the pursuer and is inversely proportional to the sum of both
        // agent's velocities
        let lookAheadTime = toOffset.length() / (vehicle.maxSpeed + leader.getSpeed());

        // calculate new velocity and predicted future position
        newLeaderVelocity.copy(leader.velocity).multiplyScalar(lookAheadTime);

        predictedPosition$1.addVectors(offsetWorld, newLeaderVelocity);


        ////raycasting intersection of predictedPosition$1
        predictedPosition$1.y += 100 ///in order to raycast ground from far above the ground
        raycaster.set(predictedPosition$1, new YUKA.Vector3(0, -1, 0))
        let intersects = raycaster.intersectObject(this.mainPlane, false);

        if (intersects.length > 0) {

            predictedPosition$1.y = intersects[0].point.y + 0.23

        }

        // now arrive at the predicted future position of the offset
        this._arrive.target = predictedPosition$1;
        this._arrive.calculate(vehicle, force);


        if (vehicle.trackHasBeenHit) this.active = false;

        return force;

    }



}

export { CustomOffsetPursuitBehavior };
