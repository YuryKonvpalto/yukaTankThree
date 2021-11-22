import * as YUKA from 'yuka'
import * as THREE from "three";



const helperVector3 = new THREE.Vector3();
const toPoint = new YUKA.Vector3();
const direction$1 = new YUKA.Vector3();
const ray$1 = new YUKA.Ray();
const intersectionPoint$1 = new YUKA.Vector3();
const worldPosition = new YUKA.Vector3();


class CustomVision extends YUKA.Vision {


    constructor(owner = null) {

        super();

        this.owner = owner;
        this.fieldOfView = Math.PI;
        this.range = Infinity;
        this.obstacles = new Array();

    }


    visible(point) {

        const owner = this.owner;
        const obstacles = this.obstacles;
        owner.getWorldPosition(worldPosition);

        owner.fireCube.getWorldPosition(helperVector3) //gets position of gun's muzzle and copies it to helperVector
        worldPosition.y = helperVector3.y

        /// check if point lies within the game entity's visual range
        toPoint.subVectors(point, worldPosition);
        const distanceToPoint = toPoint.length();

        if (distanceToPoint > this.range) return false;

        /// next, check if the point lies within the game entity's field of view
        owner.getWorldDirection(direction$1);

        const angle = direction$1.angleTo(toPoint);

        if (angle > (this.fieldOfView * 0.5)) return false;

        // the point lies within the game entity's visual range and field
        // of view. now check if obstacles block the game entity's view to the given point.

        ray$1.origin.copy(worldPosition);
        ray$1.direction.copy(toPoint).divideScalar(distanceToPoint || 1); // normalize

        for (let i = 0, l = obstacles.length; i < l; i++) {

            const obstacle = obstacles[i];

            const intersection = obstacle.lineOfSightTest(ray$1, intersectionPoint$1);

            if (intersection !== null) {

                // if an intersection point is closer to the game entity than the given point,
                // something is blocking the game entity's view

                const squaredDistanceToIntersectionPoint = intersectionPoint$1.squaredDistanceTo(worldPosition);

                if (squaredDistanceToIntersectionPoint <= (distanceToPoint * distanceToPoint)) return false;

            }

        }

        return true;

    }



}

export { CustomVision };
