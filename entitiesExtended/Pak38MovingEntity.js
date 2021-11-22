import * as THREE from "three";
import { MathUtils } from "three";
import * as YUKA from 'yuka'
import { Bullet } from './Bullet.js'
import { triggers } from '../threeXR_5.js'
import { CustomVision } from '../libs/CustomVision.js'

let helperVector3 = new THREE.Vector3()
let yukaHelperVector3 = new YUKA.Vector3()
let raycaster = new THREE.Raycaster();


class Pak38MovingEntity extends YUKA.MovingEntity {

    constructor(mainPlane, targetsArray, enemyPlatoons, enemySide, selfPlatoons) {

        super();

        this.memorySystem = new YUKA.MemorySystem();
        this.memorySystem.memorySpan = 2;

        this.vision = new CustomVision(this);
        this.vision.range = 250;//how far entities can see. Real case - appr.1100 meters (so - 1/3 in our case with scale)
        this.vision.fieldOfView = Math.PI * 1.2;
        // this.vision.fieldOfView = Math.PI * 0.6;

        this.maxTurnRate = Math.PI * 0.5;

        this.currentTime = 0;
        this.memoryRecords = new Array();

        this.target = null;
        this.fireCube

        this.obstacles = []
        this.targets = targetsArray
        this.enemyPlatoons = enemyPlatoons
        this.selfPlatoons = selfPlatoons
        this.enemySide = enemySide

        this.bullet = new Bullet(0.7) // set scale to 0.7 for a gun
        this.bulletVelocity = 1.5
        this.maxBulletFlight = 300
        this.reloadTime = 3
        this.aimingTime = 3
        this.timeElapsedAfterFire = 0
        this.lifePoints = 100
        this.rearHit = false

        this.hasFired = false
        this.isDestroyed = false
        this.bulletIsOutOfRange = false
        this.hasAimed = false;

        this.distanceToTarget = null
        // this.targetMoved = 5


        // this.helperVector3 = new THREE.Vector3()
        // this.yukaHelperVector3 = new YUKA.Vector3()
        this.lastTargetPosition
        // this.ray = new YUKA.Ray();
        // this.raycaster = new THREE.Raycaster();
        this.bulletCollisionPoint = new THREE.Vector3()

        this.mainPlane = mainPlane


        this.debugRegulator = new YUKA.Regulator(1);//how many times regulator fires in one second. The higher the value, the faster fires.

    }




    setBulletOnStart() {

        this._renderComponent.children[0].children[1].getWorldPosition(helperVector3) //gets position of gun's muzzle and copies it to helperVector
        this.bullet.position.copy(helperVector3) // copies position of helperVector  
        this.getDirection(yukaHelperVector3) //gets direction and copies it to yukaHelperVector3


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

    updateObstacles(obstacle) {
        this.vision.removeObstacle(obstacle);
    }



    start() {

        raycaster.set(this.position, new YUKA.Vector3(0, -1, 0))
        const intersects = raycaster.intersectObject(this.mainPlane, false);

        if (intersects.length > 0) {//places vehicle on a plane below
            this.position.y = intersects[0].point.y + 0.23
        }

        this.setMemorySystem()
        this.fireCube = this._renderComponent.children[0].children[1]
    }

    update(delta) {

        super.update(delta);


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


        this.currentTime += delta;

        // In many scenarios it is not necessary to update the vision in each
        // simulation step. A regulator could be used to restrict the update rate.
        if (this.isReadyForNextStep()) this.updateVision();

        // get a list of all recently sensed game entities
        this.memorySystem.getValidMemoryRecords(this.currentTime, this.memoryRecords);

        if (this.memoryRecords.length > 0) {

            // Pick the first one. It's highly application specific what record is chosen
            // for further processing.
            const record = this.memoryRecords[0];
            const entity = record.entity;


            if (!this.hasAimed) {//when target is first time seen, time lapses for aiming
                this.timeElapsedAfterFire += delta

                if (this.timeElapsedAfterFire > this.aimingTime) {
                    this.hasAimed = true;
                    this.timeElapsedAfterFire = 0
                }

            }

            // if the game entity is visible, directly rotate towards it. Otherwise, focus
            // the last known position
            if (record.visible === true) {

                let isFacingTarget = this.rotateTo(entity.position, delta, 0.004); //let face target not precise for fire, but with little tolerance (0.05)

                if (!this.hasFired && isFacingTarget && this.hasAimed) {//sets bullet on fire start position

                    // this.targetMoved = entity.position.distanceTo(this.lastTargetPosition) //increases hit chance if target has not moved
                    // this.lastTargetPosition.copy(entity.position)

                    this.bullet.visible = true
                    this.bulletIsOutOfRange = false
                    this.setBulletOnStart()

                    this.lookAt(entity.position)
                    raycaster.set(this.bullet.position, yukaHelperVector3)
                    let ar = raycaster.intersectObject(entity._renderComponent.getObjectByName('aabbBox'))


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

            // rotate back to default
            // this.rotateTo(this.forward, delta);

            this.hasAimed = false;//sets need for aiming back
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

            triggers.shot = true, triggers.aimedVehicle = entity

            if (Math.random() > 0.08) { //if track did not has been hit (should be less 0.08 chance)
                console.log(`${entity.side} ${entity._renderComponent.children[0].name} has been hit`);

                this.hitExplosion(entity)

                this.checkHitSpot(entity)//checks how badly target has been hit

            } else { //if track has been hit the entity (target) will not move any more
                console.log(`${entity.side} ${entity._renderComponent.children[0].name} TRACK has been hit`);
                !entity.trackHasBeenHit && this.enemyPlatoons[entity.platoon].activeUnits--;
                entity.trackHasBeenHit = true

                if (entity.leader) {///if damaged entity is leader, lets find next leader for given platoon
                    for (let i = 0; i < this.enemyPlatoons[entity.platoon].length; i++) {
                        if (!this.enemyPlatoons[entity.platoon][i].trackHasBeenHit
                            && this.enemyPlatoons[entity.platoon][i].active) {
                            entity.leader = false
                            this.enemyPlatoons[entity.platoon][i].leader = true

                            console.log('Found new leader');
                            break //new leader has been found and we stop looping further
                        }
                    }
                }
            }


        } else {
            this.missExplosion(entity)
            // console.log('missed tank');
        }
    }

    checkHitSpot(entity) {//checks how badly target has been hit

        let vec3Target = new YUKA.Vector3() //help vec
        let vec3Self = new YUKA.Vector3() //help vec
        entity.getDirection(vec3Target) //get direction of target
        vec3Self.subVectors(entity.position, this.position).normalize();//get direction where fire comes from

        let distCoeff = 1 - this.distanceToTarget / this.vision.range // damage grows when distance to target shortens
        distCoeff > 0.8 ? (distCoeff = 1) : distCoeff //if close to target the coeff will always be max - 1

        let dot = vec3Self.dot(vec3Target) //calculates dot between diections of target and firing entity

        // if (entity.name === 'targetTigerI' && entity.side === this.enemySide) {//for type TigerI
        if (entity.side === this.enemySide) {

            if (dot < -0.80) {//if front of tank has been hit
                entity.lifePoints -= THREE.MathUtils.randFloat(5, 50) * distCoeff
                console.log('front hit', entity.lifePoints);
            } else if (dot > 0.80) {//if rear of tank has been hit
                entity.lifePoints -= THREE.MathUtils.randFloat(60, 110) * distCoeff
                console.log('rear hit', entity.lifePoints);
                entity.checkRearHit(this)///inform entity that it has been shot from rear
            } else {
                entity.lifePoints -= THREE.MathUtils.randFloat(25, 60) * distCoeff//if side has been hit
                console.log('side hit', entity.lifePoints);
                if (dot > 0) entity.checkRearHit(this)///inform entity that it has been shot from rear
            }
        }

        if ((entity.lifePoints < 0) && (entity.active == true)) {//if lifePoints reach 0 the entity considers as destroyed and deactivates
            entity.active = false
            entity.isDestroyed = true
            !entity.trackHasBeenHit && this.enemyPlatoons[entity.platoon].activeUnits--;
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

    setMemorySystem() {//sets targets for memory of entity from this.targets array

        for (let i = 0; i < this.targets.length; i++) {

            if (this.memorySystem.hasRecord(this.targets[i]) === false) {

                this.memorySystem.createRecord(this.targets[i]);
            }

        }

    }



    isReadyForNextStep() { //Returns true if Regulator fires new step

        return this.debugRegulator.ready();
    }

}

export { Pak38MovingEntity };