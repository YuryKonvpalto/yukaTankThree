import * as THREE from "three";
import * as YUKA from 'yuka'
import { Bullet } from './Bullet.js'
import { triggers } from '../threeXR_5.js'
import { CustomVision } from '../libs/CustomVision.js'
import { MathUtils } from "yuka";


let helperVector3 = new THREE.Vector3()
let helperThreeQuaternion = new THREE.Quaternion()
let smoothRotationQuaternion = new YUKA.Quaternion()
let yukaHelperVector3 = new YUKA.Vector3()
let raycaster = new THREE.Raycaster();
let helpYukaVec3 = new YUKA.Vector3(0, 1, 0)


class Marder2Vehicle extends YUKA.Vehicle {

    constructor(mainPlane, targetsArray, enemyPlatoons, enemySide, selfPlatoons) {

        super();

        this.memorySystem = new YUKA.MemorySystem();
        this.memorySystem.memorySpan = 3;

        // this.vision = new YUKA.Vision(this);
        this.vision = new CustomVision(this);
        this.vision.range = 250;//how far entities can see. Real case - appr.1100 meters (so - 1/3 in our case with scale)
        this.vision.fieldOfView = Math.PI * 0.9;

        this.currentTime = 0;
        this.memoryRecords = new Array();

        this.target = null;
        this.fireCube

        this.obstacles = []
        this.targets = targetsArray
        this.enemyPlatoons = enemyPlatoons
        this.enemySide = enemySide
        this.selfPlatoons = selfPlatoons

        this.bullet = new Bullet(1)
        this.bulletVelocity = 1.5
        this.maxBulletFlight = 300
        this.reloadTime = 5
        this.timeElapsedAfterFire = 0
        this.triggerDistance = 1.9
        this.lifePoints = 100
        this.rearHit = false

        this.hasFired = false
        this.hasFiredCount = 0
        this.bulletIsOutOfRange = false
        this.trackHasBeenHit = false
        this.isDestroyed = false
        this.stoppedForFire = false
        this.countForNextStop = 0

        this.distanceToTarget = null
        this.lastTargetPosition
        // this.targetMoved = 5

        this.mainPlane = mainPlane


        ////for rotating on spot before activating behaviors
        this.rotateToTargetPointBeforeBehavior = false
        this.targetPoint = null
        this.behavior = null

        this.debugRegulator = new YUKA.Regulator(1);//how many times in one second. The higher the value, the faster fires.
        this.stopForFireRegulator = new YUKA.Regulator(1 / 3);//how many times in one second. The higher the value, the faster fires.
    }



    setBulletOnStart() {
        this._renderComponent.children[0].children[0].getWorldPosition(helperVector3) //gets position of gun's muzzle and copies it to helperVector
        this.bullet.position.copy(helperVector3) // copies position of helperVector  
    }

    fireBullet() {//executes while bullet is being fired

        this.bullet.position.add(yukaHelperVector3.clone().multiplyScalar(this.bulletVelocity))
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


        raycaster.set(this.position, new YUKA.Vector3(0, -1, 0))
        const intersects = raycaster.intersectObject(this.mainPlane, false);

        if (intersects.length > 0) {//places vehicle on a plane below
            this.position.y = intersects[0].point.y + 0.23
        }

        this.setMemorySystem()
        this.fireCube = this._renderComponent.children[0].children[0]
    }

    update(delta) {


        super.update(delta);
        this.currentTime += delta;


        if (this.steering.behaviors[1].path._waypoints.length > 0) { //check distance to finishPoint
            this.checkDistanceTankAP()
        }

        if (this.steering.behaviors[2].active) { //check distance to finishPoint
            this.checkDistanceTankTargetPoint(this.steering.behaviors[2])
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


        this.rearHit && this.turnToEnemy(delta) ///checks if a shot came from invisible enemy


        /// In many scenarios it is not necessary to update the vision in each
        /// simulation step. A regulator could be used to restrict the update rate.
        if (this.isReadyForNextStep()) {

            this.updateVision();

            /// get a list of all recently sensed game entities
            this.memorySystem.getValidMemoryRecords(this.currentTime, this.memoryRecords);
        }




        ///if no sensed entities, we set 'stoppedforfire=false', because target-entity could disapear while stopped for aiming
        if ((this.memoryRecords.length < 1) && this.behavior && this.behavior.active) {
            this.stoppedForFire = false
            this.hasFiredCount = 0
        }


        ///if entities are sensed and tank is not rotating to it target point
        if (this.memoryRecords.length > 0 && !this.rotateToTargetPointBeforeBehavior) {

            // Pick the first one. It's highly application specific what record is chosen
            // for further processing.
            const record = this.memoryRecords[0];
            const entity = record.entity;

            this.memoryRecords[0];

            /// if the game entity is visible, directly rotate towards it. Otherwise, focus
            /// the last known position
            if (record.visible === true) {

                let tankIsFacingTarget


                ///if vehicle moves and 'this.stoppedForFire=false' lets start count time for fireStop
                (this.velocity.length() > 0.005 && !this.stoppedForFire) ? this.startCountTimeForNextStop() : this.countForNextStop = 0


                ///if tank stands still and sees a target, lets rotate tank to target (because tank has no turret)
                if ((this.velocity.length() < 0.001) && !tankIsFacingTarget) {
                    tankIsFacingTarget = this.rotateTo(entity.position, delta, 0.004); //let face target not precise for fire, but with little tolerance (0.05)
                }




                if ((this.velocity.length() < 0.001) && !this.hasFired && tankIsFacingTarget) {//sets bullet on fire start position

                    this.bullet.visible = true
                    this.bulletIsOutOfRange = false
                    this.setBulletOnStart()


                    yukaHelperVector3.subVectors(entity.position, this.position).normalize();//gets direction and copies it to yukaHelperVector3

                    raycaster.set(this.position, yukaHelperVector3)
                    let ar = raycaster.intersectObject(entity._renderComponent.children[0].getObjectByName('aabbBox'))

                    if (ar[0]) {
                        this.distanceToTarget = ar[0].distance
                        this.hasFired = true
                        this.hasFiredCount++

                        //////if has fired, lets rotate tank to it target point
                        ////it will remove trigger (this.stoppedForFire) after full rotation and behavior will continue
                        if (this.behavior && this.behavior.active && this.hasFiredCount > 1) {
                            this.targetPoint = this.behavior.path._waypoints[this.behavior.path._index]
                            this.rotateToTargetPointBeforeBehavior = true
                            this.hasFiredCount = 0
                        }
                    }

                    this.calculateHits(entity)
                }

            } else {

                ///if target.visible=false, lets start counting time for fireStop from beginning
                this.countForNextStop > 0 ? this.countForNextStop = 0 : this.countForNextStop
                this.stoppedForFire = false

                // only rotate to the last sensed position if the entity was seen at least once
                if (record.timeLastSensed !== - 1) {
                    // this.rotateTo(record.lastSensedPosition, delta);
                }

            }

        } else {
            //// rotate back to default
            // this.rotateTo(this.forward, delta);
        }


        if (this.rotateToTargetPointBeforeBehavior) {//rotates vehicle on spot to target

            ///in CustomOffsetPursuitBehavior the target is always moving after leader
            ///and we have to recalculate it for proper rotation
            if (this.behavior.name == 'CustomOffsetPursuitBehavior') {
                this.behavior.calculate(this, new YUKA.Vector3(0, 0, 0));


                ///lets find direction of vehicle to leaderTarget and to targetPoint
                let dirToLeaderTarget = new THREE.Vector3().copy(this.behavior.leaderTarget.clone().sub(this.position.clone()))
                let dirTargetPoint = new THREE.Vector3().copy(this.targetPoint.clone().sub(this.position.clone()))

                ///lets find angle between vectors and if it less than 45C (PI*0.5) lets start rotate to target
                let c = dirToLeaderTarget.angleTo(dirTargetPoint)
                if (c < Math.PI * 0.5) {

                    this.maxTurnRate = 3.141592653589793 * 0.15;//lets rotate a little bit faster
                    let isFacingTarget = this.rotateTo(this.targetPoint, delta, 0.004); //let face target not precise, but with little tolerance (0.05)
                    if (isFacingTarget) {//when target point has been faced, lets start behavior
                        this.rotateToTargetPointBeforeBehavior = false
                        this.trackHasBeenHit ? (this.behavior.active = false) : (this.behavior.active = true) //no behavior if track has been hit
                        this.maxTurnRate = 3.141592653589793 * 0.05;//let set a turn rate back
                    }
                }

            } else {

                this.maxTurnRate = 3.141592653589793 * 0.1;//lets rotate a little bit faster

                let isFacingTarget = this.rotateTo(this.targetPoint, delta, 0.004); //let face target not precise, but with little tolerance (0.05)

                if (isFacingTarget) {//when target point has been faced, lets start behavior
                    this.rotateToTargetPointBeforeBehavior = false
                    this.trackHasBeenHit ? (this.behavior.active = false) : (this.behavior.active = true) //no behavior if track has been hit
                    this.maxTurnRate = 3.141592653589793 * 0.07;//let set a turn rate back
                    this.stoppedForFire = false

                }
            }



        }


        if (this.velocity.length() > 0) {//orients vehicle above and parallel to the terrain faces

            raycaster.set(this.position, new YUKA.Vector3(0, -1, 0))
            const intersects = raycaster.intersectObject(this.mainPlane, false);

            if (intersects.length > 0) {

                helpYukaVec3.copy(intersects[0].face.normal)

                helperThreeQuaternion.setFromUnitVectors(this.up, intersects[0].face.normal)

                smoothRotationQuaternion.copy(this.rotation.clone().premultiply(helperThreeQuaternion))
                this.rotation.rotateTo(smoothRotationQuaternion, 0.01, 0.01)//makes smooth rotation when moving along terrain faces

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

            Array.isArray(targetPoint) ? (this.targetPoint = targetPoint[0])
                : (this.targetPoint = targetPoint)

            this.behavior = behavior
            this.rotateToTargetPointBeforeBehavior = true

            if (behavior.name == 'CustomOffsetPursuitBehavior')
                this.targetPoint = this.behavior._arrive.target
        }

    }


    calculateHits(entity) {

        ///if 'onmarchAndStop' and leader is under fire, lets stop leader 
        this.enemyPlatoons[entity.platoon].battleFormation === 'onmarchAndStop' &&
            (this.enemyPlatoons[entity.platoon].battleFormation = 'inline',
                console.log('onmarchAndStop!!! Platoon has been spotted!!'),
                triggers.onmarchSpotted = true, triggers.vehicle = entity);

        ///if 'onmarchAndInlineIfSpotted' and platoon is under fire, lets change formation to inline 
        this.enemyPlatoons[entity.platoon].battleFormation === 'onmarchAndInlineIfSpotted' &&
            (this.enemyPlatoons[entity.platoon].battleFormation = 'inline',
                console.log('onmarchAndInlineIfSpotted switched to inline!!! Platoon has been spotted!!'),
                triggers.onmarchAndInlineIfSpotted = true, triggers.vehicle = entity);


        let basis = 0.35
        let distCoeff = 1 - this.distanceToTarget / this.vision.range
        distCoeff = 0.55 * distCoeff // hit chance increases when distance to target shortens
        let moveCoeff = 0 //if target has not really moved, then let's add hit chance

        // this.targetMoved > 2 ? (moveCoeff = 0) : (moveCoeff = 0.25)

        basis += (distCoeff + moveCoeff) //calculate final chances for hit

        if (Math.random() < basis) {

            console.log(`${entity.side} ${entity._renderComponent.children[0].name} has been hit`);

            this.hitExplosion(entity)

            this.checkHitSpot(entity)//checks how badly target has been hit

        } else {
            this.missExplosion(entity)
            // console.log('missed gun');
        }
    }

    checkHitSpot(entity) {//checks how badly target has been hit
        let vec3Target = new YUKA.Vector3() //help vec
        let vec3Self = new YUKA.Vector3() //help vec
        entity.getDirection(vec3Target) //get direction of target
        vec3Self.subVectors(entity.position, this.position).normalize();//get direction where fire comes from

        let distCoeff = 1 - this.distanceToTarget / this.vision.range // damage grows when distance to target shortens
        distCoeff > 0.8 ? (distCoeff = 1) : distCoeff //if close to target the coeff will always be max - 1

        let dot = vec3Self.dot(vec3Target) //calculates dot between directions of target and firing entity

        // if (entity.name === 'targetTigerI' && entity.side === this.enemySide) {//for type TigerI
        if (entity.side === this.enemySide) {

            if (dot < -0.80) {//if front of gun has been hit
                entity.lifePoints -= THREE.MathUtils.randFloat(5, 50) * distCoeff
                console.log('front hit', entity.lifePoints);
            } else if (dot > 0.80) {//if rear of gun has been hit
                entity.lifePoints -= THREE.MathUtils.randFloat(70, 140) * distCoeff
                entity.checkRearHit(this)///inform entity that it has been shot from rear
                console.log('rear hit', entity.lifePoints);
            } else {
                entity.lifePoints -= THREE.MathUtils.randFloat(25, 60) * distCoeff//if side has been hit
                console.log('side hit', entity.lifePoints);
                if (dot > 0) entity.checkRearHit(this)///inform entity that it has been shot from rear
            }

        }

        if ((entity.lifePoints < 0) && (entity.active == true)) {//if lifePoints reach 0 the entity considers as destroyed and deactivates
            entity.active = false
            entity.isDestroyed = true
            !entity.trackHasBeenHit && this.enemyPlatoons[entity.platoon].activeUnits--
            triggers.entityDestroyed = true, triggers.destroyedVehicle = entity;


            ///enemyPlatoon will ask for help if it has lost many platoon-members
            (this.enemyPlatoons[entity.platoon].side === 'allied')
                && (this.enemyPlatoons[entity.platoon].canAskHelp)///only if platoon may ask for help
                && (this.enemyPlatoons[entity.platoon].unitsAll / 2 > this.enemyPlatoons[entity.platoon].activeUnits)
                && (!this.enemyPlatoons[entity.platoon].needHelp)///shout for help only once
                && (console.log(`${entity.side} Platoon Nr ${entity.platoon} NEEDS HELP!!!`),
                    triggers.platoonNeedHelp = true, triggers.platoonToHelp = this.enemyPlatoons[entity.platoon],
                    this.enemyPlatoons[entity.platoon].needHelp = true);


            console.log(`${entity.side} ${entity._renderComponent.children[0].name} HAS BEEN DESTROYED`);
            this.memorySystem.deleteRecord(entity)
            this.targets.splice(this.targets.indexOf(entity), 1);

            if (entity.leader) {///if destroyed entity is leader, lets find next leader for given platoon

                for (let i = 0; i < this.enemyPlatoons[entity.platoon].length; i++) {
                    if (!this.enemyPlatoons[entity.platoon][i].trackHasBeenHit
                        && this.enemyPlatoons[entity.platoon][i].active) {
                        entity.leader = false
                        this.enemyPlatoons[entity.platoon][i].leader = true

                        break //new leader has been found and we stop looping further
                    }
                }
            }

            return
        }
    }

    checkDistanceTankAP() {//checks distance between vehicle and arrival point

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

    checkDistanceTankTargetPoint(behavior) {//checks distance between vehicle and target point (TP)

        let targetPosition = behavior._arrive.target.clone()

        let distance = this.position.distanceTo(targetPosition)

        if (distance < this.triggerDistance) {

            if (this.steering.behaviors[0].active == true) {
                this.steering.behaviors[0].active = false
                this.velocity.multiplyScalar(distance / this.triggerDistance * 0.7)  // brakes if vehicle within triggerDistance (close to AP)
            }

            if ((distance < this.triggerDistance * 0.7)
                // && (behavior.leader.velocity.length() < 0.1)
                && (!behavior.leader.steering.behaviors[1].active)
                && (!behavior.leader.rotateToTargetPointBeforeBehavior)) {
                this.velocity = new YUKA.Vector3(0, 0, 0)
                behavior.active = false
            }
        }

        else if (distance > this.triggerDistance
            && (this.steering.behaviors[0].active == false)
            && this.getSpeed() > 1.1) { ////check speed, otherwise when within obstacle radius - may result in unexpected behavior 

            this.steering.behaviors[0].active = true
        }

    }

    checkRearHit(enemy) {

        ///if entity senses right now other enemy, there is no need to turn around
        if (this.memoryRecords.length > 0 || this.rearHit) return
        this.lastTargetPosition = enemy.position.clone()
        this.rearHit = true
    }


    missExplosion(entity) {

        this.missPS.mesh.position.copy(entity.position)
        entity.getDirection(yukaHelperVector3)

        helperVector3.copy(yukaHelperVector3)

        ///lets make miss shot to explode randomly around the entity
        helperVector3.applyAxisAngle(new THREE.Vector3(0, 1, 0), MathUtils.randFloat(0, Math.PI * 2))
        this.missPS.mesh.position.add(helperVector3.multiplyScalar(MathUtils.randFloat(3, 14)))
        this.missPS.mesh.position.y += 100

        raycaster.set(this.missPS.mesh.position, new YUKA.Vector3(0, -1, 0))
        let intersects = raycaster.intersectObject(this.mainPlane, false);

        if (intersects.length > 0) {//places explosion on a plane below
            this.missPS.mesh.position.y = intersects[0].point.y + 0.23
        }

        this.missPS.start()
    }

    hitExplosion(entity) {

        this.hitPS.mesh.position.copy(entity.position)
        this.hitPS.mesh.position.y -= 1

        this.hitPS.start()
    }

    ///turns entity to enemy if becomes rear shot
    turnToEnemy(delta) {

        let hasTurned = true

        for (let i = 0; i < this.selfPlatoons[this.platoon].length; i++) {

            ///if entity already sees an enemy we turn off turnToEnemy()
            if (this.selfPlatoons[this.platoon][i].memoryRecords.length > 0) {
                continue
            }
            else {
                ///rotate to last known position of enemy. When pointed to position, hasTurn becomes true
                hasTurned = this.selfPlatoons[this.platoon][i].rotateTo(this.lastTargetPosition, delta * 2, 0.01);
            }

        }

        hasTurned && (this.rearHit = false)
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

    startCountTimeForNextStop() {

        if (this.regulatorReadyForNextStop()) {

            this.countForNextStop++
            this.countForNextStop > 2 ? this.stoppedForFire = true : this.countForNextStop
        }

    }

    regulatorReadyForNextStop() {//Returns true if Regulator fires new step

        return this.stopForFireRegulator.ready();
    }



}

export { Marder2Vehicle };

