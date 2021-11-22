import * as THREE from "three";
import * as YUKA from 'yuka'
import { Bullet } from './Bullet.js'


class CustomVehicle extends YUKA.Vehicle {

    constructor(mainPlane, targetsArray) {

        super();

        this.memorySystem = new YUKA.MemorySystem();
        this.memorySystem.memorySpan = 3;

        this.vision = new YUKA.Vision(this);
        this.vision.range = 250;//how far entities can see. Real case - appr.1100 meters (so - 1/3 in our case with scale)
        this.vision.fieldOfView = Math.PI * 0.9;

        this.maxTurnRate = Math.PI * 0.5;

        this.currentTime = 0;
        this.memoryRecords = new Array();

        this.target = null;

        this.obstacles = []
        this.targets = targetsArray

        this.bullet = new Bullet(1)
        this.bulletVelocity = 1.5
        this.maxBulletFlight = 300
        this.reloadTime = 3
        this.aimingTime = 5
        this.timeElapsedAfterFire = 0
        this.triggerDistance = 1.9
        this.lifePoints = 100

        this.hasFired = false
        this.bulletIsOutOfRange = false
        this.hasAimed = false;
        this.trackHasBeenHit = false

        this.distanceToTarget = null
        this.targetMoved = 5


        this.helperVector3 = new THREE.Vector3()
        this.helperThreeQuaternion = new THREE.Quaternion()
        this.smoothRotationQuaternion = new YUKA.Quaternion()
        this.yukaHelperVector3 = new YUKA.Vector3()
        this.lastTargetPosition = new YUKA.Vector3().clone(this.position)
        this.ray = new YUKA.Ray();
        this.raycaster = new THREE.Raycaster();
        this.bulletCollisionPoint = new THREE.Vector3()


        this.raycasterDir = new THREE.Vector3(0, -1, 0)
        this.helpYukaVec3 = new YUKA.Vector3(0, 1, 0)
        this.mainPlane = mainPlane

        //for rotating on spot before activating behaviors
        this.rotateToTargetPointBeforeBehavior = false
        this.targetPoint = null
        this.behavior = null

        this.debugRegulator = new YUKA.Regulator(1);//how many times in one second. The higher the value, the faster fires.
    }



    setBulletOnStart() {

        this._renderComponent.children[0].children[1].getWorldPosition(this.helperVector3) //gets position of gun's muzzle and copies it to helperVector
        // this._renderComponent.getWorldPosition(this.helperVector3) //gets position of gun's muzzle and copies it to helperVector
        this.bullet.position.copy(this.helperVector3) // copies position of helperVector  
        this.getDirection(this.yukaHelperVector3) //gets direction and copies it to yukaHelperVector3
    }

    fireBullet() {//executes while bullet is being fired

        this.bullet.position.add(this.yukaHelperVector3.clone().multiplyScalar(this.bulletVelocity))
    }


    setObstaclesForVision(obstacles) {
        this.obstacles = obstacles

        for (let i = 0; i < obstacles.length; i++) {
            if (this.obstacles[i].status !== 'house'
                && this.obstacles[i].status !== 'terrain'
                && this.obstacles[i].status !== 'testplane') {
                continue
            }

            if (!this.obstacles[i].active) continue

            this.vision.addObstacle(obstacles[i]);
        }
    }

    updateObstacles(obstacle) {//removes an obstacle from vision if the obstacle is destroyed
        this.vision.removeObstacle(obstacle);
    }



    start() {
        const target = this.manager.getEntityByName('targetPak38');

        this.target = target;

        this.raycaster.set(this.position, new YUKA.Vector3(0, -1, 0))
        const intersects = this.raycaster.intersectObject(this.mainPlane, false);

        if (intersects.length > 0) {//places vehicle on a plane below
            this.position.y = intersects[0].point.y + 0.23
        }

        this.setMemorySystem()
        this.tankTurret = this._renderComponent.children[0].children[4];

    }

    update(delta) {


        super.update(delta);
        this.currentTime += delta;


        if (this.steering.behaviors[1].path._waypoints.length > 0) { //check distance to finishPoint
            this.checkDistanceTankAP()
        }

        if (this.hasFired) {//calculates time for reloading
            this.timeElapsedAfterFire += delta

            if (this.timeElapsedAfterFire > this.reloadTime) {
                this.hasFired = false;
                this.timeElapsedAfterFire = 0
            }
        }


        if (this.hasFired && !this.bulletIsOutOfRange) {//fires a bullet

            this.fireBullet()
        }


        if ((Math.abs(this.bullet.position.x) > this.maxBulletFlight
            || Math.abs(this.bullet.position.z) > this.maxBulletFlight)
            && !this.bulletIsOutOfRange) {//checks if bullet flies out of range

            this.bulletIsOutOfRange = true
            this.bullet.visible = false
        }




        // In many scenarios it is not necessary to update the vision in each
        // simulation step. A regulator could be used to restrict the update rate.
        if (this.isReadyForNextStep()) this.updateVision();


        // get a list of all recently sensed game entities
        this.memorySystem.getValidMemoryRecords(this.currentTime, this.memoryRecords);

        if (this.memoryRecords.length > 0 && !this.rotateToTargetPointBeforeBehavior) {

            // Pick the first one. It's highly application specific what record is chosen
            // for further processing.
            const record = this.memoryRecords[0];
            const entity = record.entity;


            if (!this.hasAimed && this.velocity.length() < 0.001) {//when target is first time seen, time lapses for aiming
                this.timeElapsedAfterFire += delta

                if (this.timeElapsedAfterFire > this.aimingTime) {
                    this.hasAimed = true;
                    this.timeElapsedAfterFire = 0
                }

            }

            // if the game entity is visible, directly rotate towards it. Otherwise, focus
            // the last known position
            if (record.visible === true) {

                let isFacingTarget
                if (this.velocity.length() < 0.001) {//rotates tank to visible target only if tank stops
                    isFacingTarget = this.rotateTo(entity.position, delta, 0.004); //let face target not precise for fire, but with little tolerance (0.05)
                }

                if (!this.hasFired && isFacingTarget && this.hasAimed) {//sets bullet on fire start position

                    this.bullet.visible = true
                    this.bulletIsOutOfRange = false
                    this.setBulletOnStart()

                    this.lookAt(entity.position)
                    this.raycaster.set(this.position, this.yukaHelperVector3)
                    let ar = this.raycaster.intersectObject(entity._renderComponent.children[0].getObjectByName('aabbBox'))

                    if (ar[0]) {
                        this.distanceToTarget = ar[0].distance
                        this.hasFired = true
                    }

                    this.calculateHits(entity)
                }

                this.rotateTo(entity.position, delta);

            } else {

                // only rotate to the last sensed position if the entity was seen at least once
                if (record.timeLastSensed !== - 1) {

                    // this.rotateTo(record.lastSensedPosition, delta);
                }

            }

        } else {

            //// rotate back to default
            // this.rotateTo(this.forward, delta);

            this.hasAimed = false;//sets need for aiming back
        }


        if (this.rotateToTargetPointBeforeBehavior) {//rotates vehicle on spot to target

            this.maxTurnRate = 3.141592653589793 * 0.15;//lets rotate a little bit faster


            let isFacingTarget = this.rotateTo(this.targetPoint, delta, 0.004); //let face target not precise, but with little tolerance (0.05)

            if (isFacingTarget) {//when target point has been faced, lets start behavior

                this.rotateToTargetPointBeforeBehavior = false
                this.trackHasBeenHit ? (this.behavior.active = false) : (this.behavior.active = true) //no behavior if track has been hit
                this.maxTurnRate = 3.141592653589793 * 0.05;//let set a turn rate back
            }

        }


        if (this.velocity.length() > 0) {//orients vehicle above and parallel to the terrain faces

            this.raycaster.set(this.position, new YUKA.Vector3(0, -1, 0))
            const intersects = this.raycaster.intersectObject(this.mainPlane, false);

            if (intersects.length > 0) {

                this.helpYukaVec3.copy(intersects[0].face.normal)

                this.helperThreeQuaternion.setFromUnitVectors(this.up, intersects[0].face.normal)

                this.smoothRotationQuaternion.copy(this.rotation.clone().premultiply(this.helperThreeQuaternion))
                this.rotation.rotateTo(this.smoothRotationQuaternion, 0.01, 0.01)//makes smooth rotation whan moving along terrain faces

                this.position.y = intersects[0].point.y + 0.23

            }
        }

    }


    updateVision() {

        if (this.targets.length > 0) {

            for (let i = 0; i < this.targets.length; i++) {

                const record = this.memorySystem.getRecord(this.targets[i]);

                if (this.vision.visible(this.targets[i].position) === true) {

                    record.timeLastSensed = this.currentTime;
                    record.lastSensedPosition.copy(this.targets[i].position);
                    record.visible = true;

                } else {

                    record.visible = false;

                }

            }

        }

    }


    rotateToTargetPoint(targetPoint, behavior) {//rotates vehicle on spot to point before starting FollowPathBehavior

        if (!behavior.active) {
            this.targetPoint = targetPoint
            this.behavior = behavior
            this.rotateToTargetPointBeforeBehavior = true

        }

    }


    calculateHits(entity) {

        let basis = 0.35
        let distCoeff = 1 - this.distanceToTarget / this.vision.range
        distCoeff = 0.55 * distCoeff // hit chance increases when distance to target shortens
        let moveCoeff = 0 //if target has not really moved, then let's add hit chance

        this.targetMoved > 2 ? (moveCoeff = 0) : (moveCoeff = 0.25)

        basis += (distCoeff + moveCoeff) //calculate final chances for hit

        if (Math.random() < basis) {

            console.log('gun has been hit');
            this.checkHitSpot(entity)//checks how badly target has been hit

        } else {
            console.log('missed gun');
        }
    }

    checkHitSpot(entity) {//checks how badly target has been hit
        let vec3Target = new YUKA.Vector3() //help vec
        let vec3Self = new YUKA.Vector3() //help vec
        entity.getDirection(vec3Target) //get direction of target
        this.getDirection(vec3Self) //get direction of firing entity

        let distCoeff = 1 - this.distanceToTarget / this.vision.range // damage grows when distance to target shortens
        distCoeff > 0.8 ? (distCoeff = 1) : distCoeff //if close to target the coeff will always be max - 1

        let dot = vec3Self.dot(vec3Target) //calculates dot between diections of target and firing entity

        if (entity.name === 'targetPak38') {//for type Pak38

            if (dot < -0.80) {//if front of gun has been hit
                entity.lifePoints -= THREE.MathUtils.randFloat(5, 50) * distCoeff
                console.log('front gun hit', entity.lifePoints);
            } else if (dot > 0.80) {//if rear of gun has been hit
                entity.lifePoints -= THREE.MathUtils.randFloat(70, 140) * distCoeff
                console.log('rear gun hit', entity.lifePoints);
            } else {
                entity.lifePoints -= THREE.MathUtils.randFloat(60, 140) * distCoeff//if side has been hit
                console.log('side gun hit', entity.lifePoints);
            }

        }

        if (entity.lifePoints < 0) {//if lifePoints reach 0 the entity considers as destroyed and deactivates
            entity.active = false
            console.log('GUN HAS BEEN DESTROYED', 111111111);
            this.memorySystem.deleteRecord(entity)
            this.targets.splice(this.targets.indexOf(entity), 1);

            return
        }
    }

    checkDistanceTankAP() {//checks distance between vehicle and arriving point

        let APPosition = this.steering.behaviors[1].path._waypoints[this.steering.behaviors[1].path._waypoints.length - 1]
        let distance = this.position.distanceTo(APPosition)

        if (distance < this.triggerDistance) {

            if (this.steering.behaviors[0].active == true) {
                this.steering.behaviors[0].active = false
                this.velocity.multiplyScalar(distance / this.triggerDistance * 0.3)  // brakes if vehicle within triggerDistance (close to AP)
            }

            if (distance < (this.triggerDistance * 0.3)) {
                this.velocity = new YUKA.Vector3(0, 0, 0)
                this.steering.behaviors[1].active = false
            }
        }

        else if (distance > this.triggerDistance
            && (this.steering.behaviors[0].active == false)
            && this.getSpeed() > 1.1) { //check speed, otherwise when within obstacle radius - may result in unexpected behavior 

            this.steering.behaviors[0].active = true
        }

    }

    setMemorySystem() {//sets targets for memory of entity from this.targets array

        for (let i = 0; i < this.targets.length; i++) {

            if (this.memorySystem.hasRecord(this.targets[i]) === false) {

                this.memorySystem.createRecord(this.targets[i]);
            }

        }


    }



    isReadyForNextStep() {//Returns true if Regulator fires new step

        return this.debugRegulator.ready();

    }



}

export { CustomVehicle };

