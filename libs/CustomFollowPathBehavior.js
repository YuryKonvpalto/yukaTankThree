import * as THREE from "three";
import * as YUKA from 'yuka'
import { triggers } from '../threeXR_5.js'



class CustomFollowPathBehavior extends YUKA.FollowPathBehavior {


    constructor(mainPlane) {//mainPlane to raycast terrain 

        super();

        this.raycaster = new THREE.Raycaster()
        this.raycasterDir = new THREE.Vector3(0, -1, 0)
        this.helpYukaVec3 = new YUKA.Vector3(0, 1, 0)
        this.newFinishPointIsSet = false

    }


    calculate(vehicle, force /*, delta */) {


        const path = this.path;

        // calculate distance in square space from current waypoint to vehicle
        const distanceSq = path.current().squaredDistanceTo(vehicle.position);

        // move to next waypoint if close enough to current target
        if (distanceSq < (this.nextWaypointDistance * this.nextWaypointDistance)) {

            path.advance();

        }

        const target = path.current();


        if (!vehicle.stoppedForFire) {//continue to calculate behavior if vehicle moves

            if (path.finished() === true) {
                this._arrive.target = target;
                this._arrive.calculate(vehicle, force);

            } else {

                this._seek.target = target;
                this._seek.calculate(vehicle, force);

            }
        } else { //if 'vehicle.stoppedForFire=true' deccelerate and halt vehicle

            if (vehicle.velocity.length() < 0.05) {

                vehicle.velocity.set(0, 0, 0)
            } else {

                vehicle.velocity.multiplyScalar(0.94)
            }

            force.multiplyScalar(0.0)

        }


        ////if tracks has been hit we set finish point (AP) right in front of it
        if (vehicle.trackHasBeenHit && !this.newFinishPointIsSet) {

            this.newFinishPointIsSet = true //lets set it to true in order last waypoint would be set only once (not to recalculate it each cycle)
            vehicle.getDirection(this.helpYukaVec3)
            this.helpYukaVec3.multiplyScalar(2)
            path._waypoints[path._waypoints.length - 1] = vehicle.position.clone().add(this.helpYukaVec3.clone())
        }



        return force;

    }



}

export { CustomFollowPathBehavior };
