import * as YUKA from 'yuka'
import * as THREE from "three";
import { MathUtils } from 'yuka';

let raycaster = new THREE.Raycaster();
let magicNumber = 5 ///how many points before last-point a platoon should gradually switch to 'inline' formation
let rowDist = 8
let numInRow = 5
let minLeaderDist = 15
let maxLeaderDist = 30

function inLineAttackFormation(targetPoint, leader, mainPlane, counter, formation) {

    let memberTarget

    if (formation === 'inline') {
        if (Array.isArray(targetPoint)) {
            console.log('inline, array');
            memberTarget = findArrayTargets(targetPoint, leader, mainPlane, counter)

        } else {
            console.log('inline, point');
            memberTarget = findPointTarget(targetPoint, leader, mainPlane, counter)
        }

    }


    if (formation === 'onmarchAndInlineInEnd') {
        if (Array.isArray(targetPoint)) {
            if (targetPoint.length > (magicNumber - 1)) {
                console.log(`onmarchAndInlineInEnd, array > ${magicNumber}`);
                memberTarget = findArrayTargets2(targetPoint, leader, mainPlane, counter)
            } else {
                console.log(`onmarchAndInlineInEnd, array <= ${magicNumber}`);
                memberTarget = findArrayTargets3(targetPoint, leader, mainPlane, counter)
            }

        } else {
            console.log(`onmarchAndInlineInEnd, point`);
            memberTarget = findPointTarget(targetPoint, leader, mainPlane, counter)
        }
    }


    if (formation === 'onmarchAndInlineIfSpotted') {
        if (Array.isArray(targetPoint)) {
            console.log(`onmarchAndInlineIfSpotted, array`);
            memberTarget = findArrayTargets4(targetPoint, leader, mainPlane, counter)

        } else {
            console.log(`onmarchAndInlineIfSpotted, point`);
            memberTarget = findPointTarget2(targetPoint, leader, mainPlane, counter)
        }
    }


    if (formation === 'onmarchAndStop') {
        if (Array.isArray(targetPoint)) {
            console.log(`onmarchAndStop, array`);
            memberTarget = findArrayTargets4(targetPoint, leader, mainPlane, counter)

        } else {
            console.log(`onmarchAndStop, point`);
            memberTarget = findPointTarget2(targetPoint, leader, mainPlane, counter)
        }
    }

    ///it triggers from 'onmarchAndInlineIfSpotted' when platoon is spotted
    if (formation === 'fromOnmarchToInline') {
        if (Array.isArray(targetPoint)) {
            console.log(`fromOnmarchToInline, array`);
            memberTarget = findArrayTargets3(targetPoint, leader, mainPlane, counter)
        } else {
            console.log(`fromOnmarchToInline, point`);
            memberTarget = findPointTarget(targetPoint, leader, mainPlane, counter)
        }

    }


    return memberTarget

}


function findPointTarget(targetPoint, leader, mainPlane, counter) {///inline when only 1 point has been set

    let target, dir, newDir
    target = targetPoint

    ///let set distance of each member of platoon to leader
    let distFromLeader = MathUtils.randFloat(minLeaderDist, maxLeaderDist) * Math.round((counter % (numInRow)) / 2)

    ///let set platoon no more than numInRow in row
    let row = Math.floor(counter / numInRow)

    counter % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1

    dir = new THREE.Vector3().copy(target.clone().sub(leader.position.clone()))

    newDir = dir.clone()

    ///lets find opposite to dir vector for making a row 
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).normalize();
    dir = new THREE.Vector3().copy(target.clone().add(dir.multiplyScalar(row * rowDist)))

    ///lets find perpendicular to dir vector
    newDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).normalize();
    dir = dir.add(newDir.multiplyScalar(distFromLeader))

    ///lets raycast from above and find an intersection point with mainplain (y-coord is diffrent on terrain) 
    raycaster.set(dir.add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObject(mainPlane, false);
    let memberTarget

    if (intersects.length > 0) {

        memberTarget = new YUKA.Vector3().copy(intersects[0].point)
        memberTarget.add(new YUKA.Vector3(0, 0.3, 0))

        return memberTarget
    } else {

        console.log('Cant find intersection with Mainplain');
        return null
    }
}

function findPointTarget2(targetPoint, leader, mainPlane, counter) {///onmarchAndInlineIfSpotted when only 1 point has been set

    let target, newTarget
    target = targetPoint

    ///let set distance of each member of platoon to leader
    let distFromLeader = MathUtils.randFloat(2, 4) * Math.round(counter / 2)
    counter % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1

    newTarget = target.clone().add(new THREE.Vector3(distFromLeader, 0, distFromLeader))

    ///lets raycast from above and find an intersection point with mainplain (y-coord is diffrent on terrain) 
    raycaster.set(newTarget.add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObject(mainPlane, false);
    let memberTarget

    if (intersects.length > 0) {

        memberTarget = new YUKA.Vector3().copy(intersects[0].point)
        memberTarget.add(new YUKA.Vector3(0, 0.3, 0))

        return memberTarget
    } else {

        console.log('Cant find intersection with Mainplain');
        return null
    }
}

function findArrayTargets(targetPoint, leader, mainPlane, counter) {///inline from start to the end

    ///let set distance of each member of platoon to leader
    let distFromLeader = MathUtils.randFloat(minLeaderDist, maxLeaderDist) * Math.round((counter % (numInRow)) / 2)

    ///let set platoon no more than numInRow in row
    let row = Math.floor(counter / numInRow)

    counter % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1
    let resultArray = []

    for (let i = 0; i < targetPoint.length; i++) {

        let target, dir, newDir
        target = targetPoint[i]


        if (i == 0) {
            ///if its a first point, lets find direction of vehicle to the first point
            dir = new THREE.Vector3().copy(target.clone().sub(leader.position.clone()))
        } else {
            ///if its not a first point, lets find direction between previous point and next point
            dir = new THREE.Vector3().copy(target.clone().sub(targetPoint[i - 1].clone()))
        }

        newDir = dir.clone()

        ///lets find opposite to dir vector for making a row 
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).normalize();
        dir = new THREE.Vector3().copy(target.clone().add(dir.multiplyScalar(row * rowDist)))

        ///lets find perpendicular to dir vector
        newDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).normalize();
        dir = dir.add(newDir.multiplyScalar(distFromLeader))

        ///lets raycast from above and find an intersection point with mainplain (y-coord is diffrent on terrain) 
        raycaster.set(dir.add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0))
        const intersects = raycaster.intersectObject(mainPlane, false);
        let memberTarget

        if (intersects.length > 0) {

            memberTarget = new YUKA.Vector3().copy(intersects[0].point)
            memberTarget.add(new YUKA.Vector3(0, 0.3, 0))

            resultArray.push(memberTarget)

        } else {

            console.log('Cant find intersection with Mainplain');
            return null
        }
    }////end for

    return resultArray

}

///if targetPointArray.length is more then 'magicNumber' 
function findArrayTargets2(targetPoint, leader, mainPlane, counter) {///onmarch and gradually to inline when 'magicNumer-points' before end-point

    ///let set distance of each member of platoon to leader
    let distFromLeader = MathUtils.randFloat(minLeaderDist, maxLeaderDist) * Math.round((counter % (numInRow)) / 2)

    ///let set platoon no more than numInRow in row
    let row = Math.floor(counter / numInRow)

    counter % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1
    let resultArray = [...targetPoint]
    let divider = 1

    for (let i = (targetPoint.length - 1); i > (targetPoint.length - magicNumber); i--) {

        let target, dir, newDir
        target = targetPoint[i]

        if (i == 0) {
            ///if its a first point, lets find direction of vehicle to the first point
            dir = new THREE.Vector3().copy(target.clone().sub(leader.position.clone()))
        } else {
            ///if its not a first point, lets find direction of between previous point and next point
            dir = new THREE.Vector3().copy(target.clone().sub(targetPoint[i - 1].clone()))
        }


        newDir = dir.clone()

        ///lets find opposite to dir vector for making a row 
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).normalize();
        dir = new THREE.Vector3().copy(target.clone().add(dir.multiplyScalar(row * rowDist * divider)))

        ///lets find perpendicular to dir vector
        newDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).normalize();
        dir = dir.add(newDir.multiplyScalar(distFromLeader * divider))

        ///lets raycast from above and find an intersection point with mainplain (y-coord is diffrent on terrain) 
        raycaster.set(dir.add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0))
        const intersects = raycaster.intersectObject(mainPlane, false);
        let memberTarget

        if (intersects.length > 0) {

            memberTarget = new YUKA.Vector3().copy(intersects[0].point)
            memberTarget.add(new YUKA.Vector3(0, 0.3, 0))

            resultArray[i] = memberTarget

        } else {

            console.log('Cant find intersection with Mainplain');
            return null
        }

        divider = (divider - (1 / magicNumber))
    }////end for

    return resultArray
}

///if targetPointArray.length is less then 'magicNumber' 
function findArrayTargets3(targetPoint, leader, mainPlane, counter) {///onmarch and gradually to inline when 'magicNumer-points' before end-point

    ///let set distance of each member of platoon to leader
    let distFromLeader = MathUtils.randFloat(minLeaderDist, maxLeaderDist) * Math.round((counter % (numInRow)) / 2)

    ///let set platoon no more than numInRow in row
    let row = Math.floor(counter / numInRow)

    counter % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1
    let resultArray = [...targetPoint]
    let divider = 1

    for (let i = (targetPoint.length - 1); i >= 0; i--) {

        let target, dir, newDir
        target = targetPoint[i]

        if (i == 0) {
            ///if its a first point, lets find direction of vehicle to the first point
            dir = new THREE.Vector3().copy(target.clone().sub(leader.position.clone()))
        } else {
            ///if its not a first point, lets find direction of between previous point and next point
            dir = new THREE.Vector3().copy(target.clone().sub(targetPoint[i - 1].clone()))
        }


        newDir = dir.clone()

        ///lets find opposite to dir vector for making a row 
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).normalize();
        dir = new THREE.Vector3().copy(target.clone().add(dir.multiplyScalar(row * rowDist * divider)))

        ///lets find perpendicular to dir vector
        newDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).normalize();
        dir = dir.add(newDir.multiplyScalar(distFromLeader * divider))

        ///lets raycast from above and find an intersection point with mainplain (y-coord is diffrent on terrain) 
        raycaster.set(dir.add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0))
        const intersects = raycaster.intersectObject(mainPlane, false);
        let memberTarget

        if (intersects.length > 0) {

            memberTarget = new YUKA.Vector3().copy(intersects[0].point)
            memberTarget.add(new YUKA.Vector3(0, 0.3, 0))

            resultArray[i] = memberTarget

        } else {

            console.log('Cant find intersection with Mainplain');
            return null
        }

        divider = (divider - (1 / targetPoint.length))
    }////end for

    return resultArray
}


function findArrayTargets4(targetPoint, leader, mainPlane, counter) {///onmarch from start to the end

    let target, newTarget
    target = targetPoint[targetPoint.length - 1]

    ///let set distance of each member of platoon to leader
    let distFromLeader = MathUtils.randFloat(2, 4) * Math.round(counter / 2)
    counter % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1
    let resultArray = [...targetPoint]

    newTarget = target.clone().add(new THREE.Vector3(distFromLeader, 0, distFromLeader))

    ///lets raycast from above and find an intersection point with mainplain (y-coord is diffrent on terrain) 
    raycaster.set(newTarget.add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObject(mainPlane, false);
    let memberTarget

    if (intersects.length > 0) {

        memberTarget = new YUKA.Vector3().copy(intersects[0].point)
        memberTarget.add(new YUKA.Vector3(0, 0.3, 0))

        resultArray[resultArray.length - 1] = memberTarget

    } else {

        console.log('Cant find intersection with Mainplain');
        return null
    }


    return resultArray

}





export { inLineAttackFormation };
