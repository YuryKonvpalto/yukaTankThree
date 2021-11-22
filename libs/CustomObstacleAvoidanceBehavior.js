import * as YUKA from 'yuka'
import { createSphereHelper, createAABBHelper, createOBBHelper, createConvexHullHelper } from './BVHelper.js';


class CustomObstacleAvoidanceBehavior extends YUKA.ObstacleAvoidanceBehavior {


    constructor(obstacles = new Array()) {

        super();

        this.obstacles = obstacles;

    }


    calculate(vehicle, force /*, delta */) {
        const localRay = new YUKA.Ray();

        const inverse$1 = new YUKA.Matrix4();
        const localPositionOfObstacle = new YUKA.Vector3();
        const localPositionOfClosestObstacle = new YUKA.Vector3();
        const intersectionPoint = new YUKA.Vector3();
        const boundingSphere = new YUKA.BoundingSphere();

        const ray = new YUKA.Ray(new YUKA.Vector3(0, 0, 0), new YUKA.Vector3(0, 0, 1));

        const obstacles = this.obstacles;

        // this will keep track of the closest intersecting obstacle

        let closestObstacle = null;

        // this will be used to track the distance to the closest obstacle

        let distanceToClosestObstacle = Infinity;

        // the detection box length is proportional to the agent's velocity

        const dBoxLength = this.dBoxMinLength + (vehicle.getSpeed() / vehicle.maxSpeed) * this.dBoxMinLength;

        vehicle.worldMatrix.getInverse(inverse$1);

        for (let i = 0, l = obstacles.length; i < l; i++) {

            const obstacle = obstacles[i];

            if (obstacle === vehicle) continue;
            if (!obstacle.active) continue; ////////YR MY EXTENSION!!!! if inactive, don't check the obstacle for behavior
            // if (!obstacle.active) continue; ////////YR MY EXTENSION!!!! if inactive, don't check the obstacle for behavior

            // calculate this obstacle's position in local space of the vehicle

            localPositionOfObstacle.copy(obstacle.position).applyMatrix4(inverse$1);

            // if the local position has a positive z value then it must lay behind the agent.
            // besides the absolute z value must be smaller than the length of the detection box

            if (localPositionOfObstacle.z > 0 && Math.abs(localPositionOfObstacle.z) < dBoxLength) {

                // if the distance from the x axis to the object's position is less
                // than its radius + half the width of the detection box then there is a potential intersection

                const expandedRadius = obstacle.boundingRadius + vehicle.boundingRadius;

                if (Math.abs(localPositionOfObstacle.x) < expandedRadius) {

                    // do intersection test in local space of the vehicle

                    boundingSphere.center.copy(localPositionOfObstacle);
                    boundingSphere.radius = expandedRadius;

                    ray.intersectBoundingSphere(boundingSphere, intersectionPoint);

                    // compare distances

                    if (intersectionPoint.z < distanceToClosestObstacle) {

                        // save new minimum distance

                        distanceToClosestObstacle = intersectionPoint.z;

                        // save closest obstacle

                        closestObstacle = obstacle;

                        // save local position for force calculation

                        localPositionOfClosestObstacle.copy(localPositionOfObstacle);

                    }

                }

            }

        }

        // if we have found an intersecting obstacle, calculate a steering force away from it

        if (closestObstacle !== null) {

            // the closer the agent is to an object, the stronger the steering force should be

            const multiplier = 1 + ((dBoxLength - localPositionOfClosestObstacle.z) / dBoxLength);

            // calculate the lateral force

            force.x = (closestObstacle.boundingRadius - localPositionOfClosestObstacle.x) * multiplier;

            // apply a braking force proportional to the obstacles distance from the vehicle

            force.z = (closestObstacle.boundingRadius - localPositionOfClosestObstacle.z) * this.brakingWeight;

            // finally, convert the steering vector from local to world space (just apply the rotation)

            force.applyRotation(vehicle.rotation);

        }

        return force;

    }

}

export { CustomObstacleAvoidanceBehavior };
