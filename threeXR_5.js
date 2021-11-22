// import "./../styles/styles.css";

import * as THREE from "three";
import * as YUKA from 'yuka'
import { OrbitControls } from "./libs/OrbitControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";

import { CustomObstacleAvoidanceBehavior } from './libs/CustomObstacleAvoidanceBehavior.js'
import { CustomFollowPathBehavior } from './libs/CustomFollowPathBehavior.js'
import { CustomOffsetPursuitBehavior } from './libs/CustomOffsetPursuitBehavior'
import { TigerIVehicle } from './entitiesExtended/TigerIVehicle.js'
import { Marder2Vehicle } from './entitiesExtended/Marder2Vehicle.js'
import { T34Vehicle } from './entitiesExtended/t34Vehicle.js'
import { createSphereHelper } from './libs/BVHelper.js';
import { createVisionHelper } from './libs/VisionHelper.js'
import { ObstacleExtended } from './entitiesExtended/ObstacleExtended.js'
import { Pak38MovingEntity } from './entitiesExtended/Pak38MovingEntity.js'

import { inLineAttackFormation } from './battle/battleFormations.js'
import { enemiesSetup } from './battle/enemyStartSetup.js'
import { axisSetup } from './battle/axisStartSetup.js'


import CSG from './libs/three-csg.js'
import { SpriteMixer } from './libs/SpriteMixer.js'
import ParticleSystem from './libs/particleEmitter/system.js'
import TunnelEmitter from './libs/particleEmitter/tunnel.js'
import ExplodeEmitter from './libs/particleEmitter/explode1.js'
import ExplodeEmitter2 from './libs/particleEmitter/explode2.js'
import ExplodeEmitter3 from './libs/particleEmitter/explode3.js'
import ThreeMeshUI from "three-mesh-ui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";


import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import vertexAP from "./shaders/vertexAP.glsl";
import fragmentAP from "./shaders/fragmentAP.glsl";


import gsap from "gsap";
import palette from 'nice-color-palettes/500.json'

import FontJSON from "./fonts/Roboto-msdf.json";
import FontImage from "./fonts/Roboto-msdf.png";

import tankSignAxisImg from "./img/PanzerGame/tankSignAxis.png";
import gunSignAxisImg from "./img/PanzerGame/gunSignAxis.png";
import tankSignAlliedImg from "./img/PanzerGame/tankSignAllied.png";
import gunSignAlliedImg from "./img/PanzerGame/gunSignAllied.png";
import okopSignAlliedImg from "./img/PanzerGame/okopSignAllied.png";
import flare from "./img/light-flare-png.png";
import collapseCloud from "./img/SpriteSheets/big-Smoke.png";
import explodeTex1 from "./img/PanzerGame/SpriteSheets/explosion.png";


import t34 from "./3d/gltf-glb/tanks/t34PaintedAABB3.glb";
import tigerI from "./3d/gltf-glb/tanks/tigerIPaintedAABBv2.glb";
import pak38 from "./3d/gltf-glb/tanks/pak38PaintedAABB.glb";
import marder2 from "./3d/gltf-glb/tanks/marderIIPaintedAABB.glb";


import terrain from "./3d/blender/village1/village5-Trees4.glb";
import buildings from "./3d/gltf-glb/tanks/buildings/housesLowPoly.glb";
import trees2 from "./3d/blender/village1/trees6LowPoly2.glb";





import { DoubleSide, MathUtils, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry } from "three";


////////////////////////THREE.JS VARIABLES
let camera, scene, renderer, controls;
let geometry, material, normalMaterial, shaderMaterial;
let cameraGroup = new THREE.Group(); //attach a Camera for controllers to move with camera
let controller1, controller2, controllerGrip1, controllerGrip2;
let controllerModelFactory;
let mesh, mainPlane;
let loader = new GLTFLoader();
let loaderFBX = new FBXLoader();
let raycaster = new THREE.Raycaster();
let currentAxes2State = 0;



///////////////////////////////TACTICAL MAP STUFF
let tacticalMap, raycastTacticalMap
// let arrowPathHelper, arrowPathMaterial;
let axisLeadersArrowPath = []
let axisLeadersTacticalSigns = []
let alliedLeadersTacticalSigns = []
let axisClickableTacticalSigns = []
let axisTacticalSignsTexts = []
let alliedTacticalSignsTexts = []
let axisPlatoonsButtons = []
let clicked = 1


////////////////////////////////BUILDINGS
let terrainMesh, terrainMesh2
let terrainWidth, terrainHeight, numHouses
let village, arrivalPoint
let testHouse
let damageSprite, actionDamage //sprite and action for small damages of houses
let dustCloudSprite, actionDustCloud // big dust cloud when house collapses
let buildingsMesh
let treeMesh, treeMesh2
let terrainScale = 500 ///for duneTerrain - 100


////////////////////////////////PLATOONS PLAYER (AXIS)
let axisPlatoons = []
let axisACTIVEPLATOON    ///leader of that platoon is mouse-active
let axisACTIVELEADER     ///leader of mouse-active platoon (can point with mouse where to move next)
let axisPlatoonsNumber = 0
let axisBattleFormations = ['onmarchAndStop', 'inline', 'onmarchAndInlineInEnd', 'onmarchAndInlineIfSpotted', 'none']



////////////////////////////////ENTITIES PLAYER (AXIS)
let targetsAxis = []
let tigerIMesh
let marder2Mesh
let vehicleBShelper, gunBShelper




////////////////////////////////PLATOONS PLAYER (ALLIED)
let alliedPlatoons = []
let alliedACTIVEPLATOON    ///leader of that platoon is mouse-active
let alliedACTIVELEADER     ///leader of mouse-active platoon (can point with mouse where to move next)
let alliedPlatoonsNumber = 0
let alliedBattleFormations = ['onmarchAndStop', 'inline', 'onmarchAndInlineInEnd', 'onmarchAndInlineIfSpotted', 'none']


////////////////////////////////ENTITIES ENEMY (ALLIED)
let targetsAllied = []
let pak38Mesh
let t34Mesh



/////////////////////////////////SCG Variables
let meshresultsArray = [], scaleFactorsArray = []
let SCGmeshA, SCGmeshB // helper meshes for SCG (damaging houses)
let damageSpriteIsPlaying = false
let collapse = false, collapsingHouses = []
let damageSpriteTex = new THREE.TextureLoader().load(collapseCloud)
// let damageSpriteTex2 = new THREE.TextureLoader().load(dustCloudTex)
let damageSpriteTex2 = new THREE.TextureLoader().load(explodeTex1)
let collapsingHousesSprites = []



//////////////////////////////////Yuka's variables
let entityManager, time
let gunYuka;
let obstacles = new Array();
let bvObstacles = new Array();



///////////////////////////////HELPERS
let helperVector3 = new THREE.Vector3()
let yukaHelperVector3 = new YUKA.Vector3()
let helperMatrix4 = new THREE.Matrix4()
let pathHelper, pathMaterial;



///////////////////////////PARTICLE SYSTEMS
let tabVisible = true ///shows if the browser tab with game has been switched to other tab
let ps
let smokeEmmiters = []



let spriteMixer = SpriteMixer();



//////////////////////////////////MOUSE EVENTLISTENERS VARIABLES
let mouseCoordinates = new THREE.Vector2();
let mouseIsDown = false
let tacticalArrowPoints = []
let mousePoints = []
let mousePointsLength
let rotateCameraHorizontaly, rotateCameraVertically
let cameraRotationHorizontalSpeed = 0
let cameraRotationVerticalSpeed = 0
let cameraIsDown = false
let cameraIsUp = false
let cameraIsMoving = false
let angleVert



///////////////////////////////VARIABLES FROM IMPORT FILES
export let triggers = {

};


///////////////////////////////////////TESTS
let box







// RENDERER SCENE & CAMERA ////////////////////////////////////////

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMap.enabled = true;
// renderer.shadowMapSoft = true;
// renderer.shadowMap.type.PCFShadowMap; //Shadow
document.body.appendChild(renderer.domElement);
renderer.outputEncoding = THREE.sRGBEncoding
// renderer.outputEncoding = THREE.LinearEncoding
// renderer.toneMapping = THREE.ACESFilmicToneMapping
// renderer.toneMappingExposure = 0.85

renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  2000
);

camera.position.set(200, 62, -90);



scene = new THREE.Scene();

controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI / 2
controls.minPolarAngle = Math.PI / 3.5
controls.enablePan = false
controls.maxDistance = 150
controls.minDistance = 45
controls.rotateSpeed = 0.4




window.addEventListener(
  "resize",
  function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);

loadModels() //loads all models via THREE.LoadingManager()







/////////////INIT () //////////////////////////////////////////////////

function init() {
  cameraGroup.add(camera); //attach a Camera for controllers to move with Camera
  scene.add(cameraGroup); //attach a Camera for controllers to move with Camera

  // cameraGroup.position.y += 50
  // cameraGroup.position.z += 200
  // cameraGroup.position.x += 200

  scene.background = new THREE.Color(0xf0f4ff);



  terrainWidth = 300 // width of mainPlane
  terrainHeight = 300  // height of mainPlane
  numHouses = 2


  camera.getWorldDirection(helperVector3)
  // let targetVec = new THREE.Vector3(0, 0, -100)
  let targetVec = camera.position.clone().add(helperVector3.multiplyScalar(100))
  controls.target.x = targetVec.x
  controls.target.z = targetVec.z
  controls.target.y = targetVec.y

  controls.update()



  buildMainPlane()
  buildNewVillage()
  buildArrivalPoint()
  buildActionSprite()
  setBuildings()
  setTrees()

  yukaSetup()

  fillTacticalMap()

  setEventListeners()
  initParticles()
  setUniqeNumerToEntities()
  setPositionsToEntities()



  //Lights

  let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const ambiLight = new THREE.AmbientLight(0x404040); // soft white light
  // scene.add(ambiLight);

  var pointLight = new THREE.PointLight(new THREE.Color("white"), 1, 50);
  pointLight.position.set(10, 20, 20);
  // scene.add(pointLight);

  let light1 = new THREE.PointLight('orange', 0.5);
  light1.position.set(20, 40, 0);
  // scene.add(light1);

  let light2 = new THREE.PointLight();
  light2.position.set(-320, 250, -400);
  light2.intensity = 0.6
  scene.add(light2);

  // let light3 = new THREE.AmbientLight(0x404040); // soft white light
  // scene.add(light3);


  //End Lights

  addControllers();


  /////////////////Event Listeners

  spriteMixer.addEventListener('finished', function (event) {
    damageSpriteIsPlaying = false
    console.log('eventlistener spriteMixer fires on animation finished')
  });


}

let x = 0.01;

function animate() {
  renderer.setAnimationLoop(animate);

  x += 0.01;


  (cameraRotationHorizontalSpeed != 0) && updateCameraRotationHorizontal();

  renderer.render(scene, camera);
  gsap.ticker.tick(); ///FOR GSAP DOESNT WORK AUTOMATICLY WITH setAnimLoop()

  handleController(controller1);
  handleController(controller2);

  arrivalPoint.material.uniforms.time.value = x

  let delta = time.update().getDelta();
  entityManager.update(delta);

  // checkForSCG3() // checks intersections between vehicle and houses (obstacles)
  // if (collapse) doCollapse(delta) //turns on when house to be collapsed

  spriteMixer.update(delta); ///needed and used by spriteMixer.js library
  ThreeMeshUI.update(); ///needed and used by ThreeMeshUI.js library


  ///if tacticalMap is visible, then update coordinates of entities on it
  if (tacticalMap.visible) {
    updateTacticalMap()
    updateTacticalArrow()

    ///lets make active tactical sign pulsating on map
    axisLeadersTacticalSigns[axisACTIVELEADER.platoon] &&
      (axisLeadersTacticalSigns[axisACTIVELEADER.platoon].scale.z = 1 + (Math.sin(x * 12) / 10),
        axisLeadersTacticalSigns[axisACTIVELEADER.platoon].scale.x = 1 + (Math.sin(x * 12) / 10))
  }


  if (triggers.onmarchSpotted) {

    stopPlatoonIfLeaderSpotted(triggers.vehicle)
    triggers.onmarchSpotted = false
    triggers.vehicle = null
  }

  if (triggers.onmarchAndInlineIfSpotted) {

    continueInlinePlatoonSpotted(triggers.vehicle)
    triggers.onmarchAndInlineIfSpotted = false
    triggers.vehicle = null
  }

  if (triggers.entityDestroyed) {

    tankDestroyedSmoke(triggers.destroyedVehicle)
    triggers.entityDestroyed = false
    triggers.destroyedVehicle = null
  }

  if (triggers.platoonNeedHelp) {

    dispatchSupportToPlatoon(triggers.platoonToHelp)
    triggers.platoonNeedHelp = false
    triggers.platoonToHelp = null
  }



}






function addControllers() {
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('connected', onConnected);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  controller1.addEventListener("squeeze", onSqueeze);
  controller1.addEventListener("squeezestart", onSqueezeStart);
  controller1.addEventListener("squeezeend", onSqueezeEnd);
  controller1.name = "rightController";
  // scene.add(controller1);
  cameraGroup.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('connected', onConnected);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  controller2.addEventListener("squeeze", onSqueeze);
  controller2.addEventListener("squeezestart", onSqueezeStart);
  controller2.addEventListener("squeezeend", onSqueezeEnd);
  controller2.name = "leftController";
  // scene.add(controller2);
  cameraGroup.add(controller2);

  controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  // scene.add(controllerGrip1);
  cameraGroup.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  // scene.add(controllerGrip2);
  cameraGroup.add(controllerGrip2);
}

function onSelectStart() { }

function onSelectEnd() { }

function onSqueeze() { }
function onSqueezeStart() { }
function onSqueezeEnd() { }

function showPosCamera() {
  let tempVec3 = new THREE.Vector3();
  renderer.xr.getCamera(camera).getWorldPosition(tempVec3);
  console.log(tempVec3);
}

function onConnected(event) {

  cameraGroup.position.y += 50
  cameraGroup.position.z += 200
  cameraGroup.position.x += 200

  let controller = event.target;

  controller.userData.gamepad = event.data.gamepad;
  controller.userData.handedness = event.data.handedness;
}

function handleController(controller) {

  const gamepad = controller.userData.gamepad;

  switch (controller.userData.handedness) {

    case "left":

      let axes2State = Math.sign(- Math.round(gamepad.axes[2]));

      if (currentAxes2State !== axes2State) {
        cameraGroup.rotateY(axes2State * (Math.PI / 8));
        currentAxes2State = axes2State;
      }

      const translate = gamepad.axes[3] * 0.3;
      // const direction = Math.sin(translate);
      cameraGroup.translateZ(translate);

      // raycaster.ray.origin.copy(cameraGroup.position);
      // raycaster.ray.direction.set(0, 0, direction).applyQuaternion(cameraGroup.quaternion);

      // const intersections = raycaster.intersectObject(map.group.children[3]);
      // if (intersections.length > 0) {
      //   const intersection = intersections[0];
      //   if (intersection.distance > translate + 1) {
      //     cameraGroup.translateZ(translate);
      //   }
      // }

      break;

    case "right":

      // if (gamepad.buttons[0].pressed) {
      //   gun.shoot(controller);
      // }

      break;

  }

}






function loadModels() {   //loads all models

  const loadingManager = new THREE.LoadingManager(function () {

    console.log('LoadingManager says: ddddoooonnnee');
    console.log(tigerIMesh);
    console.log(pak38Mesh);
    console.log(marder2Mesh);
    console.log(t34Mesh);
    console.log(terrainMesh);
    console.log(buildingsMesh);
    console.log(treeMesh2);

    hideAABBBoxes()


    init()
    animate()
  });

  loader = new GLTFLoader(loadingManager);

  let models = [
    loader.load(tigerI, function (gltf) {

      tigerIMesh = gltf.scene
      tigerIMesh.name = 'tigerI'
    }),

    loader.load(pak38, function (gltf) {

      pak38Mesh = gltf.scene
      pak38Mesh.name = 'pak38'
    }),

    loader.load(marder2, function (gltf) {

      marder2Mesh = gltf.scene
      marder2Mesh.name = 'marder2'
    }),

    loader.load(t34, function (gltf) {

      t34Mesh = gltf.scene
      t34Mesh.name = 't34'
    }),

    loader.load(terrain, function (gltf) {

      terrainMesh = gltf.scene
      terrainMesh.name = 'terrain'
    }),

    loader.load(buildings, function (gltf) {

      buildingsMesh = gltf.scene
      buildingsMesh.name = 'building'
    }),

    // loader.load(trees, function (gltf) {

    //   treeMesh = gltf.scene.children[0]
    //   treeMesh.name = 'tree'
    // }),

    loader.load(trees2, function (gltf) {

      treeMesh2 = gltf.scene
      treeMesh2.name = 'tree2'
    }),

  ]

}

function hideAABBBoxes() {

  let tanks = [pak38Mesh, tigerIMesh, marder2Mesh, t34Mesh]

  for (let i = 0; i < tanks.length; i++) {

    for (let j = 0; j < tanks[i].children.length; j++) {

      if (tanks[i].children[j].name == 'aabbBox') {
        tanks[i].children[j].visible = false
      }
    }
  }

}

function sync(entity, renderComponent) { ///////Yuka's synchronization function
  renderComponent.matrix.copy(entity.worldMatrix);
}




function buildMainPlane() { ////builds main Terrain Plane

  let planeGeo = terrainMesh.children[7].geometry.clone()
  planeGeo.scale(terrainScale / 50, terrainScale / 50, terrainScale / 50)

  planeGeo.attributes.position.needsUpdate = true
  planeGeo.computeVertexNormals()
  console.log(planeGeo.boundingBox.max);
  let mat = terrainMesh.children[7].material.clone()

  // mat.metalness = 0.01 ///for wood - 0., for metall - 1
  mat.reflectivity = 0.59
  mat.roughness = 1.2 ///the more the value - the less reflectivity (sheen)
  // mat.normalScale.multiplyScalar(0.02) 
  // mat.displacementMap = new THREE.TextureLoader().load(villagDispMap)

  mainPlane = new THREE.Mesh(
    planeGeo,
    // new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load(field), side: DoubleSide, normalMap: new THREE.TextureLoader().load(fieldNormal) })
    mat
  )

  scene.add(mainPlane)
  buildTacticalMap()
}

function buildTacticalMap() { ///builds tactical map of all entities on global terrain



  let planeGeo = terrainMesh.children[7].geometry.clone()
  planeGeo.scale(5 / 50, 5 / 50, 5 / 50)
  // planeGeo.scale(1, 1, 1)

  console.log(planeGeo.boundingBox.max);
  let planeGeo2 = new THREE.PlaneGeometry(10.25, 10.25).rotateX(Math.PI / 2)//planeGeo for raycasting. UVs could not be given for custom Buffergeometry
  // let planeGeo2 = new THREE.PlaneGeometry(2, 2).rotateX(Math.PI / 2)//planeGeo for raycasting. UVs could not be given for custom Buffergeometry
  // let planeGeo2 = new THREE.PlaneGeometry(planeGeo.boundingBox.max.x * 2, planeGeo.boundingBox.max.z * 2).rotateX(Math.PI / 2)//planeGeo for raycasting. UVs could not be given for custom Buffergeometry

  tacticalMap = new THREE.Mesh(
    planeGeo,
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      wireframe: false,
      side: DoubleSide,
      transparent: true, opacity: 0.3
    })
  )

  raycastTacticalMap = new THREE.Mesh(
    planeGeo2,
    new THREE.MeshStandardMaterial({
      color: 0xffff00,
      wireframe: false,
      side: DoubleSide,
      transparent: true, opacity: 0.7
    })
  )


  tacticalMap.visible = false ///make tactical map visible when 'm' key pressed
  raycastTacticalMap.visible = false ///make it visible when 'm' key pressed

  camera.add(tacticalMap);///tactical map allways stays infront of camera
  camera.add(raycastTacticalMap);///tactical map allways stays infront of camera
  tacticalMap.position.set(0, 0, -12);
  raycastTacticalMap.position.set(0, 0, -12);
  tacticalMap.rotateX(Math.PI / 2)
  raycastTacticalMap.rotateX(Math.PI / 2)
}

function buildTacticalSign(entity, plNumber, numActiveUnits) {

  if (entity === 'axisPanzer') {

    const subContainer = new ThreeMeshUI.Block({
      height: 0.5,
      width: 0.25,
      // backgroundOpacity: 0.12,
      backgroundOpacity: 0.,
      padding: -0.15,
    });


    const imageBlock = new ThreeMeshUI.Block({
      height: 0.65,
      width: 1,
    });

    imageBlock.scale.set(0.3, 0.3, 0.3)

    const textBlock = new ThreeMeshUI.Block({
      height: 0.15,
      width: 0.18,
      margin: -0.17,
      backgroundOpacity: 0.0,
    });


    subContainer.add(imageBlock, textBlock);

    const loader = new THREE.TextureLoader();
    loader.load(tankSignAxisImg, (texture) => {
      imageBlock.set({ backgroundTexture: texture });
    });

    imageBlock.rotation.z = -Math.PI / 2;

    subContainer.set({
      fontFamily: FontJSON,
      fontTexture: FontImage,
    });

    const text = new ThreeMeshUI.Text({
      content: numActiveUnits + '', ///converts number to string
    });

    textBlock.add(text);

    text.set({
      fontColor: new THREE.Color(0xd2ffbd),
      fontSize: 0.19,
    });

    textBlock.set({
      alignContent: "center",
      justifyContent: "center",
    });

    textBlock.name = 'textBlock'
    textBlock.platoonNumber = plNumber
    imageBlock.name = 'imageBlock'
    imageBlock.platoonNumber = plNumber
    subContainer.name = 'subcontainer'
    subContainer.platoonNumber = plNumber

    return subContainer
  }

  if (entity === 'axisGun') {

    const subContainer = new ThreeMeshUI.Block({
      height: 0.5,
      width: 0.25,
      backgroundOpacity: 0.12,
      padding: -0.1,
    });


    const imageBlock = new ThreeMeshUI.Block({
      height: 0.5,
      width: 1,
    });

    imageBlock.scale.set(0.3, 0.3, 0.3)

    const textBlock = new ThreeMeshUI.Block({
      height: 0.15,
      width: 0.18,
      margin: -0.09,
      backgroundOpacity: 0.0,
    });


    subContainer.add(imageBlock, textBlock);

    const loader = new THREE.TextureLoader();
    loader.load(gunSignAxisImg, (texture) => {
      imageBlock.set({ backgroundTexture: texture });
    });

    imageBlock.rotation.z = -Math.PI / 2;

    subContainer.set({
      fontFamily: FontJSON,
      fontTexture: FontImage,
    });

    const text = new ThreeMeshUI.Text({
      content: numActiveUnits + '', ///converts number to string
    });

    textBlock.add(text);

    text.set({
      fontColor: new THREE.Color(0xd2ffbd),
      fontSize: 0.19,
    });

    textBlock.set({
      alignContent: "center",
      justifyContent: "center",
    });

    return subContainer
  }

  if (entity === 'alliedPanzer') {

    const subContainer = new ThreeMeshUI.Block({
      height: 0.5,
      width: 0.25,
      // backgroundOpacity: 0.12,
      backgroundOpacity: 0.,
      padding: -0.15,
    });


    const imageBlock = new ThreeMeshUI.Block({
      height: 0.65,
      width: 1,
    });

    imageBlock.scale.set(0.3, 0.3, 0.3)

    const textBlock = new ThreeMeshUI.Block({
      height: 0.15,
      width: 0.18,
      margin: -0.17,
      backgroundOpacity: 0.0,
    });


    subContainer.add(imageBlock, textBlock);

    const loader = new THREE.TextureLoader();
    loader.load(tankSignAlliedImg, (texture) => {
      imageBlock.set({ backgroundTexture: texture });
    });

    imageBlock.rotation.z = -Math.PI / 2;

    subContainer.set({
      fontFamily: FontJSON,
      fontTexture: FontImage,
    });

    const text = new ThreeMeshUI.Text({
      content: numActiveUnits + '', ///converts number to string
    });

    textBlock.add(text);

    text.set({
      fontColor: new THREE.Color(0xd2ffbd),
      fontSize: 0.19,
    });

    textBlock.set({
      alignContent: "center",
      justifyContent: "center",
    });

    textBlock.name = 'textBlock'
    textBlock.platoonNumber = plNumber
    imageBlock.name = 'imageBlock'
    imageBlock.platoonNumber = plNumber
    subContainer.name = 'subcontainer'
    subContainer.platoonNumber = plNumber

    return subContainer
  }

  if (entity === 'alliedGun') {

    const subContainer = new ThreeMeshUI.Block({
      height: 0.5,
      width: 0.25,
      backgroundOpacity: 0.12,
      padding: -0.1,
    });


    const imageBlock = new ThreeMeshUI.Block({
      height: 0.5,
      width: 1,
    });

    imageBlock.scale.set(0.3, 0.3, 0.3)

    const textBlock = new ThreeMeshUI.Block({
      height: 0.15,
      width: 0.18,
      margin: -0.09,
      backgroundOpacity: 0.0,
    });


    subContainer.add(imageBlock, textBlock);

    const loader = new THREE.TextureLoader();
    loader.load(gunSignAlliedImg, (texture) => {
      imageBlock.set({ backgroundTexture: texture });
    });

    imageBlock.rotation.z = -Math.PI / 2;

    subContainer.set({
      fontFamily: FontJSON,
      fontTexture: FontImage,
    });

    const text = new ThreeMeshUI.Text({
      content: numActiveUnits + '', ///converts number to string
    });

    textBlock.add(text);

    text.set({
      fontColor: new THREE.Color(0xd2ffbd),
      fontSize: 0.19,
    });

    textBlock.set({
      alignContent: "center",
      justifyContent: "center",
    });

    // buildOkopSign(entity)

    return subContainer
  }


}

function buildOkopSign(plNumber) {


  const imageBlock = new ThreeMeshUI.Block({
    height: 0.36,
    width: 0.18,
  });

  const loader = new THREE.TextureLoader();
  loader.load(okopSignAlliedImg, (texture) => {
    imageBlock.set({ backgroundTexture: texture });
  });

  imageBlock.rotation.x = -Math.PI / 2;
  imageBlock.rotation.z = Math.PI / 2;
  tacticalMap.add(imageBlock);


  for (let i = 0; i < alliedPlatoons[plNumber].length; i++) {
    if (alliedPlatoons[plNumber][i].leader) {

      imageBlock.position.copy(alliedPlatoons[plNumber][i].position.clone().divideScalar(terrainScale / 5))
      // imageBlock.quaternion.copy(alliedPlatoons[plNumber][i].rotation.clone())

      alliedPlatoons[plNumber][i].getDirection(yukaHelperVector3);
      imageBlock.position.add(yukaHelperVector3.multiplyScalar(0.3))

      imageBlock.position.y += 0.3
      break
    }
  }

}

function buildPlatoonButton(plNumber) {

  const subContainer = new ThreeMeshUI.Block({
    height: 1.,
    width: 1.,
    backgroundOpacity: 0.22,
    padding: -0.15,
  });


  const imageBlock = new ThreeMeshUI.Block({
    height: 0.65,
    width: 1,
  });

  imageBlock.scale.set(0.3, 0.3, 0.3)

  const textBlock = new ThreeMeshUI.Block({
    height: 0.15,
    width: 0.15,
    margin: -0.17,
    backgroundOpacity: 0.09,
  });


  subContainer.add(imageBlock, textBlock);

  const loader = new THREE.TextureLoader();
  loader.load(tankSignAxisImg, (texture) => {
    imageBlock.set({ backgroundTexture: texture });
  });

  imageBlock.rotation.z = -Math.PI / 2;

  subContainer.set({
    fontFamily: FontJSON,
    fontTexture: FontImage,
  });

  const text = new ThreeMeshUI.Text({
    content: "3",
  });

  textBlock.add(text);

  text.set({
    fontColor: new THREE.Color(0xd2ffbd),
    fontSize: 0.20,
  });

  textBlock.set({
    alignContent: "center",
    justifyContent: "center",
  });

  textBlock.name = 'textBlock'
  imageBlock.name = 'imageBlock'

  return subContainer
}

function fillTacticalMap() {///in the beginning we fill the tactical map with signs of each platoon-leader

  // box = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new MeshLambertMaterial({ color: 'green' }))
  // tacticalMap.add(box)

  for (let i = 0; i < axisPlatoons.length; i++) { ///set axis leaders as tactical signs on map

    ///lets make dummy object as a sign and put onto it an UIboard
    let dummyObject = new THREE.Object3D()

    let meshUI

    if (axisPlatoons[i].type === 'gun') meshUI = buildTacticalSign('axisGun', i, axisPlatoons[i].activeUnits)
    if (axisPlatoons[i].type === 'tank') meshUI = buildTacticalSign('axisPanzer', i, axisPlatoons[i].activeUnits)

    meshUI.rotation.z = -Math.PI;
    meshUI.rotation.x = -Math.PI / 2;

    dummyObject.add(meshUI)
    tacticalMap.add(dummyObject);

    axisLeadersTacticalSigns.push(dummyObject)
    if (axisPlatoons[i].type === 'tank') axisClickableTacticalSigns.push(dummyObject)

    ///lets make an array for platoon-texts in order to change number of active units dynamicaly
    axisTacticalSignsTexts.push(dummyObject.children[0].children[2].children[1])


    ///lets build arrowPointer for tactical map and push it to 
    let arrowPathMaterial = new THREE.LineDashedMaterial({
      color: 0xff0000,
      linewidth: 5,
      scale: 1,
      dashSize: 0.1,
      gapSize: 0.1,
    });

    let geometry = new THREE.BufferGeometry();
    let arrowPathHelper = new THREE.Line(geometry, arrowPathMaterial);
    tacticalMap.add(arrowPathHelper);

    let coneGeometry = new THREE.CylinderGeometry(0, 0.05, 0.2, 5, 1);
    let cone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000, toneMapped: false }));
    cone.visible = false
    tacticalMap.add(cone)

    axisLeadersArrowPath.push({ line: arrowPathHelper, arrow: cone, path: [], leadersNumber: null })
    ////lets add platoon-buttons (to choose) and put it above UIboard
    // let plButton = buildPlatoonButton(i)
    // plButton.rotation.x = -Math.PI / 2;
    // plButton.position.z -= 6;///above the tactical map
    // plButton.position.x -= 4;
    // plButton.position.y -= 0.1;

    // tacticalMap.add(plButton);

    // axisPlatoonsButtons.push(plButton)
    // console.log(dummyObject.children[0].children[2].children[1]);

  }


  for (let i = 0; i < alliedPlatoons.length; i++) {///set allied leaders as tactical signs on map

    ///lets make dummy object and put onto it an UIboard
    let dummyObject = new THREE.Object3D()

    let meshUI

    if (alliedPlatoons[i].type === 'gun') meshUI = buildTacticalSign('alliedGun', i, alliedPlatoons[i].activeUnits),
      buildOkopSign(i)

    if (alliedPlatoons[i].type === 'tank') meshUI = buildTacticalSign('alliedPanzer', i, alliedPlatoons[i].activeUnits)

    meshUI.rotation.z = -Math.PI;
    meshUI.rotation.x = -Math.PI / 2;

    dummyObject.add(meshUI)
    tacticalMap.add(dummyObject);

    alliedLeadersTacticalSigns.push(dummyObject)

    ///lets make an array for platoon-texts in order to change number of active units dynamicaly
    alliedTacticalSignsTexts.push(dummyObject.children[0].children[2].children[1])
  }



}

function updateTacticalMap() {///tactical map will be updated each frame if 'm' key has been pressed

  for (let i = 0; i < axisPlatoons.length; i++) { ///set axis leaders as tactical signs on map
    let platoonHasLeader = false
    for (let j = 0; j < axisPlatoons[i].length; j++) {
      if (axisPlatoons[i][j].leader && axisPlatoons[i][j].active && !axisPlatoons[i][j].trackHasBeenHit) {

        ///check if ACTIVLEADER still equals actual ACTIVEPLATOON.leader
        if ((axisPlatoons[i] === axisACTIVEPLATOON) && (axisPlatoons[i][j] !== axisACTIVELEADER)) {
          axisACTIVELEADER = axisPlatoons[i][j]
        }


        axisLeadersTacticalSigns[i].position.copy(axisPlatoons[i][j].position.clone().divideScalar(terrainScale / 5))
        axisLeadersTacticalSigns[i].quaternion.copy(axisPlatoons[i][j].rotation.clone())

        axisLeadersTacticalSigns[i].position.y += 0.5
        axisLeadersTacticalSigns[i].visible = true
        platoonHasLeader = true

        break
      }
    }

    ///sets number of units on tacticalsigns
    axisTacticalSignsTexts[i].set({ content: String(axisPlatoons[i].activeUnits) });

    if (!platoonHasLeader) axisLeadersTacticalSigns[i].visible = false ///if no leader in platoon, tactical sign is not visible
  }


  for (let i = 0; i < alliedPlatoons.length; i++) {///set allied leaders as tactical signs on map
    let platoonHasLeader = false
    for (let j = 0; j < alliedPlatoons[i].length; j++) {
      if (alliedPlatoons[i][j].leader && alliedPlatoons[i][j].active && !alliedPlatoons[i][j].trackHasBeenHit) {

        alliedLeadersTacticalSigns[i].position.copy(alliedPlatoons[i][j].position.clone().divideScalar(terrainScale / 5))
        alliedLeadersTacticalSigns[i].quaternion.copy(alliedPlatoons[i][j].rotation.clone())

        alliedLeadersTacticalSigns[i].position.y += 0.5
        alliedLeadersTacticalSigns[i].visible = true
        platoonHasLeader = true

        break
      }
    }


    ///sets number of units on tacticalsigns
    alliedTacticalSignsTexts[i].set({ content: String(alliedPlatoons[i].activeUnits) });

    if (!platoonHasLeader) alliedLeadersTacticalSigns[i].visible = false ///if no leader in platoon, tactical sign is not visible
  }

}





function yukaSetup() {

  entityManager = new YUKA.EntityManager();
  time = new YUKA.Time();

  const path = new YUKA.Path();
  pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  geometry = new THREE.BufferGeometry();
  pathHelper = new THREE.Line(geometry, pathMaterial);
  scene.add(pathHelper);

  // buildTigerPlatoon(3)
  buildAxis()
  buildAllied()



  setupObstacles();
}




//////////////////////////////SETUP AXIS ENTITIES/////////////////////

function buildAxis() {

  console.log('axisSetup: ', axisSetup);

  buildAxisTankPlatoons(axisSetup.platoons)

  console.log('axisPlatoons: ', axisPlatoons);
}

function buildAxisTankPlatoons(setupDatas) {

  ///lets build tanks
  for (let i = 0; i < setupDatas.tanks.length; i++) {

    let number = setupDatas.tanks[i].number
    let positions = setupDatas.tanks[i].positions

    buildAxisTankPlatoon(number, positions[0])

    axisPlatoonsNumber++
  }


  ///lets build guns
  for (let i = 0; i < setupDatas.guns.length; i++) {

    let number = setupDatas.guns[i].number
    let positions = setupDatas.guns[i].positions

    buildAxisGunPlatoon(number, positions[0])

    axisPlatoonsNumber++
  }

}

function buildAxisTankPlatoon(numTanks, position) { ///build a platoon of tanks

  let platoon = []
  platoon.activeUnits = 0
  platoon.unitsAll = 0
  // platoon.battleFormation = axisBattleFormations[0] ////onMarchAndStop - leader stops when hit by enemy
  // platoon.battleFormation = axisBattleFormations[1] ////inLine
  // platoon.battleFormation = axisBattleFormations[2] ////onmarchAndInlineInEnd - platoon switches to inline in proximity of its endpoint
  platoon.battleFormation = axisBattleFormations[3] ////onmarchAndInlineIfSpotted - platoon switches to inline when spotted by enemy

  platoon.side = 'axis'
  platoon.type = 'tank'

  if (typeof numTanks === 'object') {

    Object.entries(numTanks).forEach(([key, value], index) => {

      platoon.unitsAll += value

      if (key === 'tigerI') {
        for (let i = 0; i < value; i++) {
          let newPanzer = buildTigerI(position, 'axis')

          newPanzer.platoon = axisPlatoonsNumber
          newPanzer.side = 'axis'

          ////check if it is first tank in platoon array and make it a leader
          platoon.length < 1 ? (newPanzer.leader = true, axisACTIVELEADER = newPanzer, newPanzer.battleFormation = platoon.battleFormation)
            : (newPanzer.leader = false)
          platoon.activeUnits++
          platoon.push(newPanzer)
        }
      }

      if (key === 'marder2') {
        for (let i = 0; i < value; i++) {
          let newPanzer = buildMarder2(position, 'axis')

          newPanzer.platoon = axisPlatoonsNumber
          newPanzer.side = 'axis'

          ////check if it is first tank in platoon array and make it a leader
          platoon.length < 1 ? (newPanzer.leader = true, axisACTIVELEADER = newPanzer, newPanzer.battleFormation = platoon.battleFormation)
            : (newPanzer.leader = false)
          platoon.activeUnits++
          platoon.push(newPanzer)
        }
      }

      if (key === 't34') {
        for (let i = 0; i < value; i++) {
          let newPanzer = buildT34(position, 'axis')

          newPanzer.platoon = axisPlatoonsNumber
          newPanzer.side = 'axis'

          ////check if it is first tank in platoon array and make it a leader
          platoon.length < 1 ? (newPanzer.leader = true, axisACTIVELEADER = newPanzer, newPanzer.battleFormation = platoon.battleFormation)
            : (newPanzer.leader = false)
          platoon.activeUnits++
          platoon.push(newPanzer)
        }
      }
    }
    );
  }


  axisPlatoons.push(platoon)
  axisACTIVEPLATOON = platoon

}

function buildAxisGunPlatoon(numGuns, position) {

  let platoon = []
  platoon.activeUnits = 0
  platoon.unitsAll = 0
  platoon.battleFormation = axisBattleFormations[4] ////it's none BF
  platoon.side = 'axis'
  platoon.type = 'gun'

  if (typeof numGuns === 'object') {

    Object.entries(numGuns).forEach(([key, value], index) => {

      platoon.unitsAll += value

      if (key === 'pak38') {
        for (let i = 0; i < value; i++) {
          let newGun = buildPak38(position, 'axis')

          newGun.platoon = axisPlatoonsNumber
          newGun.side = 'axis'

          ////check if it is first gun in platoon array and make it a leader
          ///No ACTIVELEADER and no battleFormation if its a GUN
          i == Math.round((value - 1) / 2) ? (newGun.leader = true) : newGun.leader = false
          platoon.activeUnits++
          platoon.push(newGun)
        }
      }


    })
  }

  axisPlatoons.push(platoon)
  // axisACTIVEPLATOON = platoon

}

function setupAxisTankYuka(tankAxis, position, enemySide) {  //setups tigerI with Yuka
  let panzerYuka

  if (tankAxis.children[0].name === 'tigerI') {
    panzerYuka = new TigerIVehicle(mainPlane, targetsAllied, alliedPlatoons, enemySide, axisPlatoons);
    panzerYuka.name = 'targetTigerI'  //sets vehicle as a target for vision of other entities

    panzerYuka.maxSpeed = 5;
    panzerYuka.maxForce = 100;
    panzerYuka.maxTurnRate = 3.141592653589793 * 0.05;
  }
  else if (tankAxis.children[0].name === 'marder2') {
    panzerYuka = new Marder2Vehicle(mainPlane, targetsAllied, alliedPlatoons, enemySide, axisPlatoons);
    panzerYuka.name = 'targetTigerI'  //sets vehicle as a target for vision of other entities
    ///////////////////////need to change NAME!!!!!!!!!!!!!!   - tigerIYuka.name

    panzerYuka.maxSpeed = 4;
    panzerYuka.maxForce = 100;
    panzerYuka.maxTurnRate = 3.141592653589793 * 0.07;
  }
  else if (tankAxis.children[0].name === 't34') {
    panzerYuka = new T34Vehicle(mainPlane, targetsAllied, alliedPlatoons, enemySide, axisPlatoons);
    panzerYuka.name = 'targetTigerI'  //sets vehicle as a target for vision of other entities
    ///////////////////////need to change NAME!!!!!!!!!!!!!!   - tigerIYuka.name

    panzerYuka.maxSpeed = 5;
    panzerYuka.maxForce = 100;
    panzerYuka.maxTurnRate = 3.141592653589793 * 0.07;
  }


  ///let set a tiny randomness in speed and in turn rate of entities
  panzerYuka.maxSpeed *= MathUtils.randFloat(0.85, 1.1);
  panzerYuka.maxForce *= MathUtils.randFloat(0.85, 1.1);
  panzerYuka.maxTurnRate *= MathUtils.randFloat(0.85, 1.1);


  ///let set emitters for miss shot and for hit shot for each entity
  let missPS = new ParticleSystem({
    emitter: new ExplodeEmitter()
  })

  panzerYuka.missPS = missPS
  scene.add(missPS.mesh)
  missPS.mesh.scale.set(0.1, 0.1, 0.1)


  let hitPS = new ParticleSystem({
    emitter: new ExplodeEmitter2()
  })

  panzerYuka.hitPS = hitPS
  scene.add(hitPS.mesh)
  hitPS.mesh.scale.set(0.06, 0.06, 0.06)


  panzerYuka.setRenderComponent(tankAxis, sync);

  panzerYuka.boundingRadius = tankAxis.geometry.boundingSphere.radius;
  // tigerIYuka.smoother = new YUKA.Smoother(10); //problem: changes direction at start and after vehicle stops
  panzerYuka.updateNeighborhood = true
  panzerYuka.neighborhoodRadius = panzerYuka.boundingRadius * 3.5

  entityManager.add(panzerYuka);

  ///////////////////////add bounding sphere to vehicle
  // vehicleBShelper = createSphereHelper(new YUKA.BoundingSphere(tigerIYuka.position, tigerIYuka.boundingRadius))
  // tankAxis.add(vehicleBShelper)


  panzerYuka.position.y = 65.3 //rise it a bit up above ground
  panzerYuka.position.z = position.z //place it on field close to left side
  // panzerYuka.position.x = MathUtils.randFloatSpread(30) + position.x
  panzerYuka.position.x = position.x

  panzerYuka.start(panzerYuka.lookAt(new YUKA.Vector3(0, panzerYuka.position.y, -1000)))//rotates vehicle to center of field


  const helperVision = createVisionHelper(panzerYuka.vision, 'darksalmon');
  helperVision.name = 'helperVision'
  // tankAxis.add(helperVision);

  scene.add(panzerYuka.bullet)
  panzerYuka.bullet.position.y -= 20

  targetsAxis.push(panzerYuka) //let add an entity to axis targets array 


  setPanzerBehavior(panzerYuka)

  return panzerYuka
}

function setupAxisGunYuka(gun, position, enemySide) {

  let gunYuka

  if (gun.children[0].name === 'pak38') {
    gunYuka = new Pak38MovingEntity(mainPlane, targetsAllied, alliedPlatoons, enemySide, axisPlatoons);
    gunYuka.name = 'targetTigerI'  //sets gun as a target for vision of other entities

    gunYuka.maxTurnRate = 3.141592653589793 * 0.05;

  }


  ///let set emitters for miss shot and for hit shot for each entity
  let missPS = new ParticleSystem({
    emitter: new ExplodeEmitter()
  })

  gunYuka.missPS = missPS
  scene.add(missPS.mesh)
  missPS.mesh.scale.set(0.1, 0.1, 0.1)


  let hitPS = new ParticleSystem({
    emitter: new ExplodeEmitter2()
  })

  gunYuka.hitPS = hitPS
  scene.add(hitPS.mesh)
  hitPS.mesh.scale.set(0.06, 0.06, 0.06)



  gunYuka.setRenderComponent(gun, sync);
  gunYuka.boundingRadius = gun.geometry.boundingSphere.radius;

  entityManager.add(gunYuka);


  gunYuka.position.y = 25.3 //rise it a bit up above ground
  gunYuka.position.z = position.z //place it on field close to left side
  // gunYuka.position.x = MathUtils.randFloatSpread(30) + position.x
  gunYuka.position.x = position.x

  gunYuka.start(gunYuka.lookAt(new YUKA.Vector3(0, gunYuka.position.y, -1000)))//rotates vehicle to center of field


  const helper2 = createVisionHelper(gunYuka.vision, 'darksalmon');
  // gun.add(helper2);

  scene.add(gunYuka.bullet)
  gunYuka.bullet.position.y -= 20

  targetsAxis.push(gunYuka) //let add an entity to axis targets array 

  return gunYuka
}

function setPanzerBehavior(tankYuka) {

  ///behaviors[0]
  // const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(obstacles);
  const obstacleAvoidanceBehavior = new CustomObstacleAvoidanceBehavior(obstacles);
  obstacleAvoidanceBehavior.dBoxMinLength = 2.5
  obstacleAvoidanceBehavior.brakingWeight = 22
  obstacleAvoidanceBehavior.weight = 0.1
  tankYuka.steering.add(obstacleAvoidanceBehavior);

  obstacleAvoidanceBehavior.active = false //for debugging only!!!!!!!!


  ///behaviors[1]
  // const followPathBehavior = new YUKA.FollowPathBehavior();
  const followPathBehavior = new CustomFollowPathBehavior();
  followPathBehavior.weight = 0.5
  followPathBehavior.nextWaypointDistance = 3
  tankYuka.steering.add(followPathBehavior);
  followPathBehavior.active = false


  ///behaviors[2]
  const offsetPursuitBehavior = new CustomOffsetPursuitBehavior(mainPlane);
  offsetPursuitBehavior.name = 'CustomOffsetPursuitBehavior'
  offsetPursuitBehavior.weight = 0.5
  offsetPursuitBehavior.nextWaypointDistance = 3
  tankYuka.steering.add(offsetPursuitBehavior);
  offsetPursuitBehavior.active = false

}





//////////////////////////////SETUP ALLIED ENTITIES/////////////////////

function buildAllied() {

  console.log('enemySetup: ', enemiesSetup);

  buildAlliedPlatoons(enemiesSetup.platoons)

  console.log('enemyPlatoons: ', alliedPlatoons);
}

function buildAlliedPlatoons(setupDatas) {

  ///lets build tanks
  for (let i = 0; i < setupDatas.tanks.length; i++) {

    let number = setupDatas.tanks[i].number
    let positions = setupDatas.tanks[i].positions

    buildAlliedTankPlatoon(number, positions[0])

    alliedPlatoonsNumber++
  }

  ///lets build guns
  for (let i = 0; i < setupDatas.guns.length; i++) {

    let number = setupDatas.guns[i].number
    let positions = setupDatas.guns[i].positions

    buildAlliedGunPlatoon(number, positions[0])

    alliedPlatoonsNumber++
  }

}

function buildAlliedTankPlatoon(numTanks, position) {

  let platoon = []
  platoon.activeUnits = 0
  platoon.unitsAll = 0
  platoon.battleFormation = alliedBattleFormations[4] ////it's none BF
  platoon.side = 'allied'
  platoon.type = 'tank'
  platoon.support = false
  platoon.canAskHelp = false

  if (typeof numTanks === 'object') {

    Object.entries(numTanks).forEach(([key, value], index) => {

      ///check if value is a number, because it could be a string (e.g. platoonSupport: true)
      if (typeof (value) === 'number') platoon.unitsAll += value

      if (key === 't34') {
        for (let i = 0; i < value; i++) {
          let newTank = buildT34(position, 'allied')

          newTank.platoon = alliedPlatoonsNumber
          newTank.side = 'allied'

          ////check if it is first tank in platoon array and make it a leader
          i == Math.round((value - 1) / 2) ? (newTank.leader = true, alliedACTIVELEADER = newTank,
            newTank.battleFormation = platoon.battleFormation)
            : newTank.leader = false
          platoon.activeUnits++
          platoon.push(newTank)
        }
      }

      if (key === 'tigerI') {

        for (let i = 0; i < value; i++) {
          let newTank = buildTigerI(position, 'allied')

          newTank.platoon = alliedPlatoonsNumber
          newTank.side = 'allied'

          ////check if it is first tank in platoon array and make it a leader
          i == Math.round((value - 1) / 2) ? (newTank.leader = true, alliedACTIVELEADER = newTank,
            newTank.battleFormation = platoon.battleFormation)
            : newTank.leader = false
          platoon.activeUnits++
          platoon.push(newTank)
        }
      }

      if (key === 'marder2') {

        for (let i = 0; i < value; i++) {
          let newTank = buildMarder2(position, 'allied')

          newTank.platoon = alliedPlatoonsNumber
          newTank.side = 'allied'

          ////check if it is first tank in platoon array and make it a leader
          i == Math.round((value - 1) / 2) ? (newTank.leader = true, alliedACTIVELEADER = newTank,
            newTank.battleFormation = platoon.battleFormation)
            : newTank.leader = false
          platoon.activeUnits++
          platoon.push(newTank)
        }
      }

      if (key === 'supportPlatoon') {
        platoon.support = true
      }

      if (key === 'canAskHelp') {
        platoon.canAskHelp = true
      }

    })
  }

  alliedPlatoons.push(platoon)
  alliedACTIVEPLATOON = platoon
}

function buildAlliedGunPlatoon(numGuns, position) {

  let platoon = []
  platoon.activeUnits = 0
  platoon.unitsAll = 0
  platoon.battleFormation = alliedBattleFormations[4] ////it's none BF
  platoon.side = 'allied'
  platoon.type = 'gun'
  platoon.support = false
  platoon.canAskHelp = false

  if (typeof numGuns === 'object') {

    Object.entries(numGuns).forEach(([key, value], index) => {

      ///check if value is a number, because it could be a string (e.g. platoonSupport: true)
      if (typeof (value) === 'number') platoon.unitsAll += value

      if (key === 'pak38') {
        for (let i = 0; i < value; i++) {
          let newGun = buildPak38(position, 'allied')

          newGun.platoon = alliedPlatoonsNumber
          newGun.side = 'allied'

          ////check if it is first gun in platoon array and make it a leader
          ///No ACTIVELEADER and no battleFormation if its a GUN
          i == Math.round((value - 1) / 2) ? (newGun.leader = true) : newGun.leader = false
          platoon.activeUnits++
          platoon.push(newGun)
        }
      }

      if (key === 'canAskHelp') {
        platoon.canAskHelp = true
      }


    })
  }

  alliedPlatoons.push(platoon)
  // alliedACTIVEPLATOON = platoon

}

function setupAlliedTankYuka(tankMesh, position, enemySide) {  //setup tanks with Yuka

  let panzerYuka

  if (tankMesh.children[0].name === 't34') {
    panzerYuka = new T34Vehicle(mainPlane, targetsAxis, axisPlatoons, enemySide, alliedPlatoons);
    panzerYuka.name = 'targetPak38'  //sets vehicle as a target for vision of other entities
    ///////////////////////need to change NAME!!!!!!!!!!!!!!

    panzerYuka.maxSpeed = 5;
    panzerYuka.maxForce = 100;
    panzerYuka.maxTurnRate = 3.141592653589793 * 0.07;
  }
  if (tankMesh.children[0].name === 'tigerI') {
    panzerYuka = new TigerIVehicle(mainPlane, targetsAxis, axisPlatoons, enemySide, alliedPlatoons);
    panzerYuka.name = 'targetPak38'  //sets vehicle as a target for vision of other entities
    ///////////////////////need to change NAME!!!!!!!!!!!!!!

    panzerYuka.maxSpeed = 5;
    panzerYuka.maxForce = 100;
    panzerYuka.maxTurnRate = 3.141592653589793 * 0.07;
  }
  if (tankMesh.children[0].name === 'marder2') {
    panzerYuka = new Marder2Vehicle(mainPlane, targetsAxis, axisPlatoons, enemySide, alliedPlatoons);
    panzerYuka.name = 'targetPak38'  //sets vehicle as a target for vision of other entities
    ///////////////////////need to change NAME!!!!!!!!!!!!!!

    panzerYuka.maxSpeed = 4;
    panzerYuka.maxForce = 100;
    panzerYuka.maxTurnRate = 3.141592653589793 * 0.07;
  }


  ///let set a tiny randomness in speed and in turn rate of entities
  panzerYuka.maxSpeed *= MathUtils.randFloat(0.85, 1.1);
  panzerYuka.maxForce *= MathUtils.randFloat(0.85, 1.1);
  panzerYuka.maxTurnRate *= MathUtils.randFloat(0.85, 1.1);


  ///let set emitters for miss shot and for hit shot for each entity
  let missPS = new ParticleSystem({
    emitter: new ExplodeEmitter()
  })

  panzerYuka.missPS = missPS
  scene.add(missPS.mesh)
  missPS.mesh.scale.set(0.1, 0.1, 0.1)


  let hitPS = new ParticleSystem({
    emitter: new ExplodeEmitter2()
  })

  panzerYuka.hitPS = hitPS
  scene.add(hitPS.mesh)
  hitPS.mesh.scale.set(0.06, 0.06, 0.06)



  panzerYuka.setRenderComponent(tankMesh, sync);

  panzerYuka.boundingRadius = tankMesh.geometry.boundingSphere.radius;
  // tigerIYuka.smoother = new YUKA.Smoother(10); //problem: changes direction at start and after vehicle stops
  panzerYuka.updateNeighborhood = true
  panzerYuka.neighborhoodRadius = panzerYuka.boundingRadius * 3.5

  entityManager.add(panzerYuka);


  panzerYuka.position.y = 40 //rise it a bit up above ground befor finding a y-intersection with mainplane
  panzerYuka.position.z = position.z //place it on field
  // panzerYuka.position.x = MathUtils.randFloatSpread(30) + position.x
  panzerYuka.position.x = position.x

  ///rotates vehicle to center of field (for leftside player)
  // panzerYuka.start(panzerYuka.lookAt(new YUKA.Vector3(0, panzerYuka.position.y, -1000)))


  const helperVision = createVisionHelper(panzerYuka.vision, 'cornflowerblue');
  helperVision.name = 'helperVision'
  // tankMesh.add(helperVision);

  scene.add(panzerYuka.bullet)
  panzerYuka.bullet.position.y -= 20

  targetsAllied.push(panzerYuka) //let add an entity to axis targets array 


  setPanzerBehavior(panzerYuka)

  return panzerYuka
}

function setupAlliedGunYuka(gun, position, enemySide) {

  let gunYuka

  if (gun.children[0].name === 'pak38') {
    gunYuka = new Pak38MovingEntity(mainPlane, targetsAxis, axisPlatoons, enemySide, alliedPlatoons);
    gunYuka.name = 'targetPak38'  //sets gun as a target for vision of other entities

    gunYuka.maxTurnRate = 3.141592653589793 * 0.05;

  }


  ///let set emitters for miss shot and for hit shot for each entity
  let missPS = new ParticleSystem({
    emitter: new ExplodeEmitter()
    // emitter: new ExplodeEmitter()
  })

  gunYuka.missPS = missPS
  scene.add(missPS.mesh)
  missPS.mesh.scale.set(0.1, 0.1, 0.1)


  let hitPS = new ParticleSystem({
    emitter: new ExplodeEmitter2()
  })

  gunYuka.hitPS = hitPS
  scene.add(hitPS.mesh)
  hitPS.mesh.scale.set(0.16, 0.16, 0.16)



  gunYuka.setRenderComponent(gun, sync);
  gunYuka.boundingRadius = gun.geometry.boundingSphere.radius;

  entityManager.add(gunYuka);


  gunYuka.position.y = 25.3 //rise it a bit up above ground
  gunYuka.position.z = position.z //place it on field close to left side
  // gunYuka.position.x = MathUtils.randFloatSpread(30) + position.x
  gunYuka.position.x = position.x


  const helper2 = createVisionHelper(gunYuka.vision, 'cornflowerblue');
  // gun.add(helper2);

  scene.add(gunYuka.bullet)
  gunYuka.bullet.position.y -= 20

  targetsAllied.push(gunYuka) //let add an entity to allied targets array 

  return gunYuka
}





////////////////TYPES OF ENTITIES TO BUILD////////////////////////

function buildTigerI(position, side) {

  let vehScale = 0.7

  let vehicleGeometry = new THREE.ConeBufferGeometry(0.5, 2, 8);
  vehicleGeometry.scale(vehScale, vehScale, vehScale)
  vehicleGeometry.rotateX(Math.PI * 0.5);
  vehicleGeometry.computeBoundingSphere();
  const vehicleMaterial = new THREE.MeshNormalMaterial();

  let tank = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
  tank.matrixAutoUpdate = false;
  scene.add(tank);
  tank.material.visible = false ///hides parent-cone mesh



  let tankMesh = tigerIMesh.clone()
  tankMesh.name = 'tigerI'
  tankMesh.position.y -= 0.3
  tankMesh.scale.set(0.04, 0.04, 0.04)//2,1 meters - it means 1/3 of real scale
  tank.add(tankMesh)

  tankMesh.children[1].material.wireframe = true
  // tankMesh.children[1].visible = false //let hide 'firebox' in gun

  let newTank

  if (side === 'axis') { newTank = setupAxisTankYuka(tank, position, 'allied') }///last is - enemySide
  if (side === 'allied') { newTank = setupAlliedTankYuka(tank, position, 'axis') }///last is - enemySide

  return newTank
}

function buildT34(position, side) {

  let vehScale = 0.7

  let vehicleGeometry = new THREE.ConeBufferGeometry(0.5, 2, 8);
  vehicleGeometry.scale(vehScale, vehScale, vehScale)
  vehicleGeometry.rotateX(Math.PI * 0.5);
  vehicleGeometry.computeBoundingSphere();
  const vehicleMaterial = new THREE.MeshNormalMaterial();

  let tank = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
  tank.matrixAutoUpdate = false;
  scene.add(tank);
  tank.material.visible = false ///hides parent-cone mesh


  let tankMesh = t34Mesh.clone()
  tankMesh.name = 't34'
  tankMesh.position.y -= 0.3
  tankMesh.scale.set(0.04, 0.04, 0.04)//2,1 meters - it means 1/3 of real scale
  tank.add(tankMesh)

  tankMesh.children[0].material.wireframe = true

  let newTank

  if (side === 'axis') { newTank = setupAxisTankYuka(tank, position, 'allied') }///last is - enemySide
  if (side === 'allied') { newTank = setupAlliedTankYuka(tank, position, 'axis') }///last is - enemySide

  return newTank
}

function buildMarder2(position, side) {

  let vehScale = 0.7

  let vehicleGeometry = new THREE.ConeBufferGeometry(0.5, 1, 8);
  vehicleGeometry.scale(vehScale, vehScale, vehScale)
  vehicleGeometry.rotateX(Math.PI * 0.5);
  vehicleGeometry.computeBoundingSphere();
  const vehicleMaterial = new THREE.MeshNormalMaterial();

  let tank = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
  tank.matrixAutoUpdate = false;
  scene.add(tank);
  tank.material.visible = false ///hides parent-cone mesh


  let tankMesh = marder2Mesh.clone()
  tankMesh.name = 'marder2'
  tankMesh.position.y -= 0.3
  tankMesh.scale.set(0.04, 0.04, 0.04)//2,1 meters - it means 1/3 of real scale
  tank.add(tankMesh)

  tankMesh.children[3].material.wireframe = true
  tankMesh.children[0].visible = false //let hide 'firebox' in gun

  let newTank

  if (side === 'axis') { newTank = setupAxisTankYuka(tank, position, 'allied') }///last is - enemySide
  if (side === 'allied') { newTank = setupAlliedTankYuka(tank, position, 'axis') }///last is - enemySide

  return newTank
}

function buildPak38(position, side) {

  let gunScale = 0.7

  let gunGeometry = new THREE.ConeBufferGeometry(0.5, 2, 8);
  gunGeometry.scale(gunScale, gunScale, gunScale)
  gunGeometry.rotateX(Math.PI * 0.5);
  gunGeometry.computeBoundingSphere();
  const gunMaterial = new THREE.MeshNormalMaterial();

  let gun = new THREE.Mesh(gunGeometry, gunMaterial);
  gun.matrixAutoUpdate = false;
  scene.add(gun);
  gun.material.visible = false ///hides parent-cone mesh

  let pak38MeshClone = pak38Mesh.clone()
  pak38MeshClone.position.y -= 0.12
  pak38MeshClone.position.z -= .1
  pak38MeshClone.rotateY(Math.PI)
  pak38MeshClone.scale.set(0.26, 0.26, 0.26)
  pak38MeshClone.children[2].material.wireframe = true
  gun.add(pak38MeshClone)


  let newGun

  if (side === 'axis') { newGun = setupAxisGunYuka(gun, position, 'allied') }///last is - enemySide
  if (side === 'allied') { newGun = setupAlliedGunYuka(gun, position, 'axis') }///last is - enemySide

  return newGun
}







function setupObstacles() {

  for (let i = 0; i < village.children.length; i++) {
    const vertices = village.children[i].geometry.attributes.position.array;
    const geometry = new YUKA.MeshGeometry(vertices);

    // let obstacle = new YUKA.GameEntity();
    let obstacle = new ObstacleExtended(geometry);
    obstacle.position.copy(village.children[i].position);
    obstacle.boundingRadius = village.children[i].geometry.boundingSphere.radius * 1;
    obstacle.id = i
    obstacle.status = 'house'
    entityManager.add(obstacle);
    obstacles.push(obstacle);

    let bvObstacle = createSphereHelper(new YUKA.BoundingSphere(obstacle.position, obstacle.boundingRadius))
    bvObstacles.push(bvObstacle)
    scene.add(bvObstacle)

  }

  //setting terrain as obstacle
  const vertices = mainPlane.geometry.attributes.position.array;
  const indices = mainPlane.geometry.index.array;
  const geometry = new YUKA.MeshGeometry(vertices, indices);
  let obstacle = new ObstacleExtended(geometry);
  obstacle.setRenderComponent(mainPlane, sync);
  obstacle.status = 'terrain'
  entityManager.add(obstacle);
  obstacles.push(obstacle)


  // pak38Yuka.setObstaclesForVision(obstacles) ///entity can't see what is behind obstacles
  // tigerIYuka.setObstaclesForVision(obstacles)  ///entity can't see what is behind obstacles

  for (let i = 0; i < axisPlatoons.length; i++) {

    for (let j = 0; j < axisPlatoons[i].length; j++) {

      axisPlatoons[i][j].setObstaclesForVision(obstacles)
      // axisPlatoons[i][j].test = `platoon ${i} number ${j}`
    }
  }

  for (let i = 0; i < alliedPlatoons.length; i++) {

    for (let j = 0; j < alliedPlatoons[i].length; j++) {

      alliedPlatoons[i][j].setObstaclesForVision(obstacles)
      // alliedPlatoons[i][j].test = `platoon ${i} number ${j}`
    }
  }

}

function buildNewVillage() {

  let houseScale = 0.5
  let houseScaleX = 1.5
  let houseScaleZ = 1.2

  let villagePalette = palette[Math.round(Math.random() * palette.length)]
  // console.log(villagePalette);
  village = new THREE.Group();
  scene.add(village)

  // house profile
  let shape = new THREE.Shape();
  shape.moveTo(2, 0);
  shape.lineTo(2, 4);
  shape.lineTo(2.5, 4);
  shape.lineTo(0, 6);
  shape.lineTo(-2.5, 4);
  shape.lineTo(-2, 4);
  shape.lineTo(-2, 0);
  shape.lineTo(2, 0);

  // 3D house geometry
  let extrudeSettings = {
    depth: 6,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 2,
    bevelSize: 0.1,
    bevelThickness: 0.1
  }


  let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  geometry.scale(houseScaleX, houseScale, houseScaleZ)
  geometry.center()
  geometry.computeBoundingSphere()



  for (let i = 0; i < numHouses; i++) {
    let house = new THREE.Mesh(geometry.clone(), new THREE.MeshPhongMaterial({
      side: DoubleSide,
      color: villagePalette[Math.round(Math.random() * villagePalette.length - 0.5)]
    }));

    house.position.set(
      // THREE.MathUtils.randFloatSpread(terrainWidth),
      THREE.MathUtils.randFloatSpread(40) + 40,//for debug
      1.5,
      THREE.MathUtils.randFloat(-terrainHeight / 2 + 40, terrainHeight / 2));
    house.geometry.rotateY(Math.PI / 2 * Math.round(Math.random()))
    house.idd = i
    house.collapsed = false

    village.add(house);

  }

  testHouse = new THREE.Mesh(geometry.clone(), new THREE.MeshPhongMaterial({
    color: 'grey', wireframe: false
  }));

  testHouse.position.set(30, 1.5, 0);
  testHouse.idd = numHouses


  village.add(testHouse);
}

function setBuildings() {

  for (let i = 0; i < terrainMesh.children[1].children.length; i++) {

    let house = buildingsMesh.children[MathUtils.randInt(0, buildingsMesh.children.length - 1)].clone()
    house.scale.multiplyScalar(90)
    house.position.copy(terrainMesh.children[1].children[i].position.multiplyScalar(terrainScale / 50))
    house.quaternion.copy(terrainMesh.children[1].children[i].quaternion)
    house.rotation.z -= Math.PI / 2

    scene.add(house)
  }

  for (let i = 0; i < terrainMesh.children[4].children.length; i++) {

    let house = buildingsMesh.children[MathUtils.randInt(0, buildingsMesh.children.length - 1)].clone()
    house.scale.multiplyScalar(90)
    house.position.copy(terrainMesh.children[4].children[i].position.multiplyScalar(terrainScale / 50))
    // house.quaternion.copy(terrainMesh.children[4].children[i].quaternion)
    house.rotation.y -= Math.PI / 2

    scene.add(house)
  }

  for (let i = 0; i < terrainMesh.children[6].children.length; i++) {

    let house = buildingsMesh.children[MathUtils.randInt(0, buildingsMesh.children.length - 1)].clone()
    house.scale.multiplyScalar(90)
    house.position.copy(terrainMesh.children[6].children[i].position.multiplyScalar(terrainScale / 50))
    // house.quaternion.copy(terrainMesh.children[4].children[i].quaternion)
    house.rotation.y -= Math.PI / 2

    scene.add(house)
  }

  // for (let i = 0; i < terrainMesh.children[1].children.length; i++) {

  //   let house = buildingsMesh.children[MathUtils.randInt(0, buildingsMesh.children.length - 1)].clone()
  //   house.scale.set(0.004, 0.004, 0.004)
  //   // house.position.copy(terrainMesh.children[1].children[i].position.multiplyScalar(100))
  //   house.quaternion.copy(terrainMesh.children[1].children[i].quaternion)
  //   house.rotation.y += Math.PI / 2

  //   // scene.add(house)
  // }

}

function setTrees() {

  let cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 'red' }))
  cube.position.copy(terrainMesh.children[2].children[2].position.multiplyScalar(terrainScale / 50))
  cube.scale.set(5, 5, 5)
  scene.add(cube)

  // let tree = treeMesh.clone()
  // tree.scale.set(0.25, 0.25, 0.25)
  // let tree = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 'red' }))
  // tree.scale.set(2.5, 2.5, 2.5)

  // console.log(terrainMesh.children[0].children[360].children.length);
  // tree.position.copy(terrainMesh.children[0].children[1].position.multiplyScalar(terrainScale / 50))
  // // tree.position.copy(terrainMesh.children[1].position.multiplyScalar(terrainScale * 50))

  // tree.quaternion.copy(terrainMesh.children[0].children[1].quaternion)
  // tree.rotation.y += Math.PI / 2
  // tree.position.y += 44

  // scene.add(tree)

  for (let i = 0; i < terrainMesh.children[2].children.length; i++) {

    let tree = treeMesh2.children[MathUtils.randInt(0, 3)].clone()
    tree.scale.set(1.25, 1.25, 1.25)

    tree.position.copy(terrainMesh.children[2].children[i].position.multiplyScalar(terrainScale / 50))
    // tree.quaternion.copy(terrainMesh.children[0].children[i].quaternion)
    // tree.rotation.z += Math.PI / 2

    scene.add(tree)
  }

  for (let i = 0; i < terrainMesh.children[3].children.length; i++) {

    let tree = treeMesh2.children[MathUtils.randInt(0, 3)].clone()
    tree.scale.set(1.25, 1.25, 1.25)

    tree.position.copy(terrainMesh.children[3].children[i].position.multiplyScalar(terrainScale / 50))
    // tree.quaternion.copy(terrainMesh.children[0].children[i].quaternion)
    // tree.rotation.z += Math.PI / 2

    scene.add(tree)
  }

  for (let i = 0; i < terrainMesh.children[5].children.length; i++) {

    let tree = treeMesh2.children[MathUtils.randInt(0, 3)].clone()
    tree.scale.set(1.25, 1.25, 1.25)

    tree.position.copy(terrainMesh.children[5].children[i].position.multiplyScalar(terrainScale / 50))
    // tree.quaternion.copy(terrainMesh.children[0].children[i].quaternion)
    // tree.rotation.z += Math.PI / 2

    scene.add(tree)
  }
}

function setUniqeNumerToEntities() {

  for (let i = 0; i < axisPlatoons.length; i++) {

    for (let j = 0; j < axisPlatoons[i].length; j++) {

      axisPlatoons[i][j].uniqeNumber = i + j / 100
    }
  }

  for (let i = 0; i < alliedPlatoons.length; i++) {

    for (let j = 0; j < alliedPlatoons[i].length; j++) {

      alliedPlatoons[i][j].uniqeNumber = i + j / 100

    }
  }
}

function setPositionsToEntities() {

  let rowDist = 4
  let numInRow = 5
  let minLeaderDist = 5
  let maxLeaderDist = 8

  for (let i = 0; i < axisPlatoons.length; i++) {

    for (let j = 0; j < axisPlatoons[i].length; j++) {

      ///let set distance of each member of platoon to leader
      let distFromLeader = MathUtils.randFloat(minLeaderDist, maxLeaderDist) * Math.round((j % (numInRow)) / 2)

      ///let set platoon no more than numInRow in row
      let row = Math.floor(j / numInRow)

      j % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1

      axisPlatoons[i][j].position.x += distFromLeader
      axisPlatoons[i][j].position.z += rowDist * row
      axisPlatoons[i][j].position.y += 100

      raycaster.set(axisPlatoons[i][j].position, new THREE.Vector3(0, -1, 0))
      const intersects = raycaster.intersectObject(mainPlane, false);

      if (intersects.length > 0) {//places entity on a plane below
        axisPlatoons[i][j].position.y = intersects[0].point.y + 0.23

      }
    }
  }

  for (let i = 0; i < alliedPlatoons.length; i++) {

    for (let j = 0; j < alliedPlatoons[i].length; j++) {

      ///let set distance of each member of platoon to leader
      let distFromLeader = MathUtils.randFloat(minLeaderDist, maxLeaderDist) * Math.round((j % (numInRow)) / 2)

      ///let set platoon no more than numInRow in row
      let row = Math.floor(j / numInRow)

      j % 2 == 0 ? distFromLeader *= 1 : distFromLeader *= -1

      alliedPlatoons[i][j].position.x += distFromLeader
      alliedPlatoons[i][j].position.z += rowDist * row
      alliedPlatoons[i][j].position.y += 100

      raycaster.set(alliedPlatoons[i][j].position, new THREE.Vector3(0, -1, 0))
      const intersects = raycaster.intersectObject(mainPlane, false);

      if (intersects.length > 0) {//places entity on a plane below
        alliedPlatoons[i][j].position.y = intersects[0].point.y + 0.23

      }
    }
  }
}




//////////EVENTS FUNCTIONS
function setEventListeners() {

  ////dont forget to disable Orbitcontrols before using most of the mouse events (controls.enabled = false)
  document.addEventListener('click', onMouseClick, false)
  window.addEventListener('mousemove', onMouseMove, false)
  document.addEventListener('mousedown', onMouseDown, false)
  document.addEventListener('mouseup', onMouseUp, false)
  document.addEventListener('keydown', pressKey);
  document.addEventListener('dblclick', onDblMouseClick, false);
  document.addEventListener('contextmenu', onLeftMouseClick, false);

  document.addEventListener('visibilitychange', handleVisibilityChange, false); ///fires when switching browser tabs

}

function onMouseClick(event) {

  mouseCoordinates.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouseCoordinates.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouseCoordinates, camera);
  let intersects

  //////check if players entity has been clicked. Then choose it as axisACTIVELEADER and as axisACTIVEPLATOON
  ////each object (tactical sign) has 2 intersections. So next object (sign) will be +2 ... +2 and so on.
  intersects = raycaster.intersectObjects(axisClickableTacticalSigns, true);
  if (intersects.length > 1) {
    if (intersects.length < 4) clicked = 1

    axisLeadersTacticalSigns[axisACTIVELEADER.platoon].scale.z = 1 ///let set scale of previous tacticalsign back to 1
    axisLeadersTacticalSigns[axisACTIVELEADER.platoon].scale.x = 1 ///let set scale of previous tacticalsign back to 1

    axisACTIVEPLATOON = axisPlatoons[intersects[clicked].object.parent.platoonNumber]
    for (let i = 0; i < axisACTIVEPLATOON.length; i++) {
      if (axisACTIVEPLATOON[i].leader) {
        axisACTIVELEADER = axisACTIVEPLATOON[i]
        break
      }
    }

    if (intersects.length > 3) {
      clicked += 2
      if (clicked > intersects.length - 1) clicked = 1
    }

    return null
  }




  intersects = raycaster.intersectObject(raycastTacticalMap, false);
  if ((intersects.length > 0 && !controls.enabled && mousePointsLength < 2)
    && axisACTIVELEADER.active && !axisACTIVELEADER.trackHasBeenHit) {

    let halfPlain = 10.2 / 2

    ///lets limit pointerPosition. Platoon's tanks are set randomly (with offset) around leader (pointerPosition)
    ////and they could be set out of map
    if (intersects[0].uv.x < 0.07) intersects[0].uv.x = 0.07
    if (intersects[0].uv.y < 0.07) intersects[0].uv.y = 0.07
    if (intersects[0].uv.x > 0.93) intersects[0].uv.x = 0.93
    if (intersects[0].uv.y > 0.93) intersects[0].uv.y = 0.93

    let uvX = (intersects[0].uv.x - 0.5) * 2
    let uvZ = (intersects[0].uv.y - 0.5) * 2

    ///transform tactical map coord to main plain coord
    let pointerPosition = new THREE.Vector3(halfPlain * uvX * terrainScale / 5, terrainScale / 5, halfPlain * uvZ * terrainScale / 5)

    raycaster.set(pointerPosition, new THREE.Vector3(0, -1, 0))
    intersects = raycaster.intersectObject(mainPlane, false);

    if (intersects.length > 0) {//places vehicle on a plane below
      pointerPosition.y = intersects[0].point.y
    }

    findPathTo(new YUKA.Vector3().copy(pointerPosition));

    tacticalArrowPoints.push(pointerPosition.clone().divideScalar(terrainScale / 5))
    drawTacticalArrow()

    mousePoints = []
    tacticalArrowPoints = []

  } else if ((intersects.length > 0 && !controls.enabled && mousePointsLength > 1)
    && axisACTIVELEADER.active && !axisACTIVELEADER.trackHasBeenHit) {

    findPathTo(mousePoints);
    drawTacticalArrow()


    mousePoints = []
    tacticalArrowPoints = []
  }





}

function onMouseMove(event) {

  mouseCoordinates.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouseCoordinates.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouseCoordinates, camera);

  let intersects = raycaster.intersectObject(tacticalMap, false);

  ///disables Orbitcontrol if tacticalMap is visible and mouse within it
  if (intersects.length > 0 && tacticalMap.visible) {
    controls.enabled = false
  } else {
    controls.enabled = true
  }


  if (mouseIsDown && tacticalMap.visible && axisACTIVELEADER.active && !axisACTIVELEADER.trackHasBeenHit) {

    intersects = raycaster.intersectObject(raycastTacticalMap, false);
    if (intersects.length > 0) {

      let halfPlain = 10.2 / 2

      ///lets limit pointerPosition within map boundaries. Platoon's tanks are set randomly (with offset) around leader (pointerPosition)
      ////and they could be set out of map
      if (intersects[0].uv.x < 0.07) intersects[0].uv.x = 0.07
      if (intersects[0].uv.y < 0.07) intersects[0].uv.y = 0.07
      if (intersects[0].uv.x > 0.93) intersects[0].uv.x = 0.93
      if (intersects[0].uv.y > 0.93) intersects[0].uv.y = 0.93

      let uvX = (intersects[0].uv.x - 0.5) * 2
      let uvZ = (intersects[0].uv.y - 0.5) * 2

      ///transform tactical map coord to main plain coord
      let pointerPosition = new THREE.Vector3(halfPlain * uvX * terrainScale / 5, terrainScale / 5, halfPlain * uvZ * terrainScale / 5)

      raycaster.set(pointerPosition, new THREE.Vector3(0, -1, 0))
      intersects = raycaster.intersectObject(mainPlane, false);

      ///find a y-coordinate for positioning
      if (intersects.length > 0) {
        pointerPosition.y = intersects[0].point.y
      }


      ///if mousePoints-array is empty we push a first point to it
      if (mousePoints.length < 1) mousePoints.push(new YUKA.Vector3().copy(pointerPosition.clone()))

      let newPoint = pointerPosition.clone().divideScalar(terrainScale / 5)
      let distSquared = newPoint.distanceToSquared(mousePoints[mousePoints.length - 1].clone().divideScalar(terrainScale / 5))


      if (distSquared > 0.1115) {///we push a new point for route only if it far enough from previous point

        mousePoints.push(new YUKA.Vector3().copy(pointerPosition.clone()))

        tacticalArrowPoints.push(pointerPosition.clone().divideScalar(terrainScale / 5))
        drawTacticalArrow()

      }

    }

  }




  ///set alternative user control
  if (!tacticalMap.visible) {

    const container = getContainerDimensions();
    const halfWidth = container.size[0] / 2;
    const halfHeight = container.size[1] / 2;

    rotateCameraHorizontaly = - ((event.pageX - container.offset[0]) - halfWidth) / halfWidth;
    rotateCameraVertically = ((event.pageY - container.offset[1]) - halfHeight) / halfHeight;

    if (Math.abs(rotateCameraHorizontaly) > 0.7) {

      cameraRotationHorizontalSpeed = rotateCameraHorizontaly
    } else {
      cameraRotationHorizontalSpeed = 0
    }


    if ((Math.abs(rotateCameraVertically) > 0.8) && !cameraIsMoving) {

      let angle = rotateCameraVertically

      if ((cameraIsDown && angle > 0) || (cameraIsUp && angle < 0)) {
        return
      }



      cameraIsDown = true, cameraIsUp = true
      // updateCameraRotationVertical()

    } else if (!cameraIsMoving && (cameraIsDown || cameraIsUp) && (Math.abs(rotateCameraVertically) < 0.3)) {

      ///if mouse rapidly moved down-screen while camera auto-moved up
      if (Math.sign(rotateCameraVertically) == angleVert) {
        rotateCameraVertically *= -1
      }

      cameraIsDown = false, cameraIsUp = false
      // updateCameraRotationVertical()
    } else if (!cameraIsMoving && (cameraIsDown || cameraIsUp) && (Math.abs(rotateCameraVertically) > 0.7)) {

      ///if mouse rapidly moved down-screen while camera auto-moved up
      if (Math.sign(rotateCameraVertically) == angleVert) {
        rotateCameraVertically *= -1
      }

      cameraIsDown = false, cameraIsUp = false
      // updateCameraRotationVertical()
    }

  }


}

function onMouseDown(event) {

  if (event.button == 0) {///if left-button is down
    mouseCoordinates.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouseCoordinates.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    mouseIsDown = true
  }

}

function onLeftMouseClick(event) {

  event.preventDefault();

  ///move camera to chosen point by clicking
  if (controls.enabled) {


    ////check intersection point with mainplain if no tactical map
    let intersects = raycaster.intersectObject(mainPlane, false);
    if (intersects.length > 0) {

      camera.getWorldDirection(helperVector3)

      let newPos = intersects[0].point.sub(helperVector3.clone().multiplyScalar(70))

      gsap.to(camera.position, {
        duration: 1,
        x: newPos.x,
        z: newPos.z,
        y: newPos.y += 35,

        onStart: function () {
          controls.enabled = false;
        },

        onUpdate: function (value) {
          controls.enabled = false;
        },

        onComplete: function () {
          controls.enabled = true;

          let targetVec = camera.position.clone().add(helperVector3.multiplyScalar(100))
          controls.target.x = targetVec.x
          controls.target.z = targetVec.z
          controls.target.y = targetVec.y / 1
          controls.update()
        }

      });

    }
  }


  if (tacticalMap.visible) {

    let intersects = raycaster.intersectObject(raycastTacticalMap, false);
    if (intersects.length > 0 && !controls.enabled) {

      let halfPlain = 10.2 / 2

      let uvX = (intersects[0].uv.x - 0.5) * 2
      let uvZ = (intersects[0].uv.y - 0.5) * 2

      ///transform tactical map coord to main plain coord
      let pointerPosition = new THREE.Vector3(halfPlain * uvX * terrainScale / 5, terrainScale / 5, halfPlain * uvZ * terrainScale / 5)

      raycaster.set(pointerPosition, new THREE.Vector3(0, -1, 0))
      intersects = raycaster.intersectObject(mainPlane, false);

      if (intersects.length > 0) {//places camera on main plain below
        // pointerPosition.y = intersects[0].point.y

        camera.getWorldDirection(helperVector3)

        let newPos = intersects[0].point.sub(helperVector3.clone().multiplyScalar(70))

        gsap.to(camera.position, {
          duration: 1,
          x: newPos.x,
          z: newPos.z,
          y: newPos.y += 35,

          onStart: function () {
            controls.enabled = false;
          },

          onUpdate: function (value) {
            controls.enabled = false;
          },

          onComplete: function () {
            controls.enabled = true;

            let targetVec = camera.position.clone().add(helperVector3.multiplyScalar(100))
            controls.target.x = targetVec.x
            controls.target.z = targetVec.z
            controls.target.y = targetVec.y / 1
            controls.update()
          }

        });

      }

    }

  }

}

function onMouseUp(event) {
  mouseIsDown = false
  mousePointsLength = mousePoints.length
}

function onDblMouseClick() {///for pointing on mainmap only dbl click will work

  let intersects

  ////check intersection point with mainplain if no tactical map
  intersects = raycaster.intersectObject(mainPlane, false);
  if (intersects.length > 0 && controls.enabled) {

    findPathTo(new YUKA.Vector3().copy(intersects[0].point));
  }
}

function pressKey(e) { ///makes tacticalMap visible or not
  if (e.code === 'KeyM') {
    tacticalMap.visible = !tacticalMap.visible
  }

  if (e.code === 'KeyZ') {
    // ps.start()
    // explosion()

    console.log(getContainerDimensions());
  }
}

let getContainerDimensions = function () { ///helps to find offset for viewport

  if (renderer.domElement != document) {

    return {
      size: [renderer.domElement.offsetWidth, renderer.domElement.offsetHeight],
      offset: [renderer.domElement.offsetLeft, renderer.domElement.offsetTop]
    };

  } else {

    return {
      size: [window.innerWidth, window.innerHeight],
      offset: [0, 0]
    };

  }

}

function updateCameraRotationHorizontal() {


  // camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.005)
  camera.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), cameraRotationHorizontalSpeed * 0.01)

  camera.getWorldDirection(helperVector3)
  let targetVec = camera.position.clone().add(helperVector3.multiplyScalar(100))
  controls.target.x = targetVec.x
  controls.target.z = targetVec.z
  controls.target.y = targetVec.y / 1
  controls.update()

}

function updateCameraRotationVertical() {


  ///rotates down/up once when mouse is down/up
  camera.getWorldDirection(helperVector3)
  let targetVec = camera.position.clone().add(helperVector3.multiplyScalar(100))
  angleVert = Math.sign(rotateCameraVertically)


  gsap.to(controls.target, {
    duration: 1,
    // x: newPos.x,
    // z: newPos.z,
    y: targetVec.y / 1 - (20 * angleVert),

    onStart: function () {
      cameraIsMoving = true
    },

    onUpdate: function (value) {
      controls.update()
    },

    onComplete: function () {
      cameraIsMoving = false
    }

  });


}






function findPathTo(target) {

  if (axisACTIVELEADER.trackHasBeenHit || !axisACTIVELEADER.active) {//if leader has lost track or inactive - choose next leader

    for (let i = 0; i < axisACTIVEPLATOON.length; i++) {
      if (!axisACTIVEPLATOON[i].trackHasBeenHit && axisACTIVEPLATOON[i].active) {
        axisACTIVEPLATOON[i].leader = true
        axisACTIVELEADER = axisACTIVEPLATOON[i]
        break //new leader has been found and we stop looping further
      }
    }
  }


  const from = axisACTIVELEADER.position;
  let path
  let to

  Array.isArray(target) ? (to = target, path = [from, ...target]) : (to = target, path = [from, to])

  let lastWayPoint = path.length - 1
  path[lastWayPoint].y += 0.3

  pathHelper.geometry.dispose();
  pathHelper.geometry = new THREE.BufferGeometry().setFromPoints(path);

  const followPathBehavior = axisACTIVELEADER.steering.behaviors[1];
  followPathBehavior.path.clear();


  for (const point of path) {

    followPathBehavior.path.add(point);
  }


  /////////////set arrival point
  arrivalPoint.position.copy(followPathBehavior.path._waypoints[lastWayPoint])
  arrivalPoint.position.y -= 0.2
  if (!arrivalPoint.visible) arrivalPoint.visible = true



  axisACTIVELEADER.steering.behaviors[1]._arrive.deceleration = 1.5
  axisACTIVELEADER.rotateToTargetPoint(target, followPathBehavior)
  axisACTIVELEADER.leaderWasUnderFire = false
  axisACTIVELEADER.leaderIsUnderFire = false


  let counter = 1

  for (let i = 0; i < axisACTIVEPLATOON.length; i++) {//// set followpath for NOT-Leaders of ACTIVEPLATOON

    ///battleFormation - 'onmarchAndStop' with FollowpathBehavior. Instructions for platoon members only to foolow its leader.
    if (axisACTIVEPLATOON.battleFormation === 'onmarchAndStop') {

      // if (axisACTIVEPLATOON[i].leader == false && axisACTIVEPLATOON[i].active == true && axisACTIVEPLATOON[i].trackHasBeenHit == false) {


      //   let delay = MathUtils.randInt(1000, 1500)  ///1000 - is one second of delay
      //   window.setTimeout(function () { ////let tank rotate and follow path randomly

      //     let offset = new YUKA.Vector3(0.5, 0, - 8.5 * i)

      //     ///target could be an array. In that case we choose a first point of the array
      //     let targetFroMember
      //     Array.isArray(target) ? (targetFroMember = target[0])
      //       : (targetFroMember = target)

      //     axisACTIVEPLATOON[i].steering.behaviors[2].offset = offset
      //     axisACTIVEPLATOON[i].steering.behaviors[2].leader = axisACTIVELEADER
      //     axisACTIVEPLATOON[i].steering.behaviors[2].leaderTarget = targetFroMember


      //     ///lets rotate vehicle on spot before moving
      //     ///we have to calculate target point (otherwise it will be 0,0,0)
      //     axisACTIVEPLATOON[i].steering.behaviors[2].calculate(axisACTIVEPLATOON[i], new YUKA.Vector3(0, 0, 0));
      //     axisACTIVEPLATOON[i].rotateToTargetPoint(
      //       axisACTIVEPLATOON[i].steering.behaviors[2]._arrive.target,
      //       axisACTIVEPLATOON[i].steering.behaviors[2])


      //     counter++

      //   }, delay);



      // }
    }


    ///battleFormation - 'inline'. Instructions for platoon members only.
    if (axisACTIVEPLATOON.battleFormation === 'inline') {
      if (axisACTIVEPLATOON[i].leader == false && axisACTIVEPLATOON[i].active == true && axisACTIVEPLATOON[i].trackHasBeenHit == false) {
        let memberTarget = inLineAttackFormation(target, axisACTIVELEADER, mainPlane, counter, 'inline')
        counter++

        let delay = MathUtils.randInt(1000, 1500)  ///1000 - is one second of delay
        let currentPlatoon = axisPlatoons[axisACTIVEPLATOON[i].platoon]
        window.setTimeout(function () { ////let tank rotate and follow path randomly
          findPathPlatoonMembers(currentPlatoon[i], memberTarget)
        }, delay);
      }

    }

    ///battleFormation - 'onmarchAndInlineInEnd'. Instructions for platoon members only.
    if (axisACTIVEPLATOON.battleFormation === 'onmarchAndInlineInEnd') {
      if (axisACTIVEPLATOON[i].leader == false && axisACTIVEPLATOON[i].active == true && axisACTIVEPLATOON[i].trackHasBeenHit == false) {
        let memberTarget = inLineAttackFormation(target, axisACTIVELEADER, mainPlane, counter, 'onmarchAndInlineInEnd')
        counter++

        let delay = MathUtils.randInt(1000, 1500)  ///1000 - is one second of delay
        let currentPlatoon = axisPlatoons[axisACTIVEPLATOON[i].platoon]
        window.setTimeout(function () { ////let tank rotate and follow path randomly
          findPathPlatoonMembers(currentPlatoon[i], memberTarget)
        }, delay);
      }
    }

    ///battleFormation - 'onmarchAndInlineIfSpotted'. Instructions for platoon members only.
    if (axisACTIVEPLATOON.battleFormation === 'onmarchAndInlineIfSpotted') {
      if (axisACTIVEPLATOON[i].leader == false && axisACTIVEPLATOON[i].active == true && axisACTIVEPLATOON[i].trackHasBeenHit == false) {
        let memberTarget = inLineAttackFormation(target, axisACTIVELEADER, mainPlane, counter, 'onmarchAndInlineIfSpotted')
        counter++

        let delay = MathUtils.randInt(1000, 2000)  ///1000 - is one second of delay
        let currentPlatoon = axisPlatoons[axisACTIVEPLATOON[i].platoon]
        window.setTimeout(function () { ////let tank rotate and follow path randomly
          findPathPlatoonMembers(currentPlatoon[i], memberTarget)
        }, delay);
      }
    }

    ///battleFormation - 'onmarchAndStop'. Instructions for platoon members only.
    if (axisACTIVEPLATOON.battleFormation === 'onmarchAndStop') {
      if (axisACTIVEPLATOON[i].leader == false && axisACTIVEPLATOON[i].active == true && axisACTIVEPLATOON[i].trackHasBeenHit == false) {
        let memberTarget = inLineAttackFormation(target, axisACTIVELEADER, mainPlane, counter, 'onmarchAndStop')
        counter++

        let delay = MathUtils.randInt(1000, 2000)  ///1000 - is one second of delay
        let currentPlatoon = axisPlatoons[axisACTIVEPLATOON[i].platoon]
        window.setTimeout(function () { ////let tank rotate and follow path randomly
          findPathPlatoonMembers(currentPlatoon[i], memberTarget)
        }, delay);
      }
    }

  }

  counter = 1
}

function findPathPlatoonMembers(platoonMember, target) { ///find and follow path function for members of platoon

  let from = platoonMember.position;
  let path
  let to

  Array.isArray(target) ? (to = target, path = [from, ...target]) : (to = target, path = [from, to])
  // let lastWayPoint = path.length - 1
  // path[lastWayPoint].y += 0.3

  let followPathBehaviorPlatoon = platoonMember.steering.behaviors[1];
  followPathBehaviorPlatoon.path.clear();


  for (const point of path) {

    followPathBehaviorPlatoon.path.add(point);
  }

  platoonMember.steering.behaviors[1]._arrive.deceleration = 1.5
  platoonMember.rotateToTargetPoint(target, followPathBehaviorPlatoon)
}




////////////////////BEHAVIORS IF PLATOON IS SPOTTED//////////////////////////////
function stopPlatoonIfLeaderSpotted(vehicle) {////for triggers.onmarchSpotted=true (for onmarchAndStop battleformation).Lets stop all platoonmembers

  let platoon = axisPlatoons[vehicle.platoon]

  for (let i = 0; i < platoon.length; i++) {
    if (!platoon[i].trackHasBeenHit && platoon[i].active) {
      platoon[i].velocity = new YUKA.Vector3(0, 0, 0)
      platoon[i].steering.behaviors[2].active = false
      platoon[i].steering.behaviors[1].active = false
      console.log('Behaviors for platoonmembers are turned off!!!!!');
    }
  }
}

function continueInlinePlatoonSpotted(vehicle) {////for triggers.onmarchAndInlineInEndSpotted=true (for onmarchAndInlineInEndSpotted battleformation)

  let platoon
  vehicle.side === 'axis' ? platoon = axisPlatoons[vehicle.platoon] : platoon = alliedPlatoons[vehicle.platoon]

  if (!vehicle.steering.behaviors[1].active) {
    platoon.battleFormation === 'inline'
  } else {

    // platoon = axisPlatoons[vehicle.platoon]
    let index = vehicle.steering.behaviors[1].path._index
    let target = vehicle.steering.behaviors[1].path._waypoints.slice(index)


    let counter = 1

    for (let i = 0; i < platoon.length; i++) {//// set followpath for NOT-Leaders of platoon

      if (platoon[i] !== vehicle && platoon[i].active == true && platoon[i].trackHasBeenHit == false) {
        let memberTarget = inLineAttackFormation(target, vehicle, mainPlane, counter, 'fromOnmarchToInline')
        counter++

        let delay = MathUtils.randInt(1000, 1500)  ///1000 - is one second of delay
        window.setTimeout(function () { ////let tank rotate and follow path randomly
          findPathPlatoonMembers(platoon[i], memberTarget)
        }, delay);
      }
    }

  }


}




////////////////////BEHAVIORS IF PLATOON NEEDS HELP//////////////////////////////
function dispatchSupportToPlatoon(platoonToHelp) {

  let target, supportPlatoon = false, leader
  let counter = 1

  ///lets find a platoon for support
  for (let i = 0; i < alliedPlatoons.length; i++) {
    if (alliedPlatoons[i].support) {
      supportPlatoon = alliedPlatoons[i]
      alliedPlatoons[i].support = false ///it could be asked for help only once
      break
    }
  }

  if (!supportPlatoon) {
    console.log('NO SUPPORTING PLATOON FOR HELP!!')
    return ///if no more supporting platoons, do nothing
  }


  ///lets find the position to send the support to
  for (let i = 0; i < platoonToHelp.length; i++) {
    if (platoonToHelp[i].leader) {
      target = platoonToHelp[i].position.clone()
      break
    }
  }


  ///lets find a platoon leader (it doesn't matter if it is real platoon.leader=true)
  for (let i = 0; i < supportPlatoon.length; i++) {
    if (supportPlatoon[i].leader) {
      leader = supportPlatoon[i]
      break
    }
  }


  console.log('DISPATCH SUPPORT!!!!!');

  ///battleFormation - 'onmarchAndInlineInEnd'. Instructions for all platoon members.
  supportPlatoon.battleFormation === 'onmarchAndInlineInEnd'
  for (let i = 0; i < supportPlatoon.length; i++) {

    if (supportPlatoon[i].active == true && supportPlatoon[i].trackHasBeenHit == false) {
      let memberTarget = inLineAttackFormation(target, leader, mainPlane, counter, 'onmarchAndInlineInEnd')
      counter++

      let delay = MathUtils.randInt(500, 1000)  ///1000 - is one second of delay
      let currentPlatoon = alliedPlatoons[supportPlatoon[i].platoon]
      window.setTimeout(function () { ////let tank rotate and follow path randomly
        findPathPlatoonMembers(currentPlatoon[i], memberTarget)
      }, delay);
    }

  }
}





function buildArrivalPoint() { //building an arrival point with shader

  let APscale = 4.
  let geo = new THREE.PlaneGeometry(1, 1)
  geo.rotateX(-Math.PI / 2)
  geo.scale(APscale, APscale, APscale)

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      // uTexture: { value: new THREE.TextureLoader().load(lupa) },
      uTexture: { value: new THREE.TextureLoader().load(flare) },
      time: { value: 0.01 },
    },
    vertexShader: vertexAP,
    fragmentShader: fragmentAP,
    transparent: true
  });

  arrivalPoint = new THREE.Mesh(geo, shaderMaterial)

  //add bounding sphere of the vehicle
  arrivalPoint.geometry.computeBoundingSphere();
  let APhelper = createSphereHelper(new YUKA.BoundingSphere(
    arrivalPoint.position, arrivalPoint.geometry.boundingSphere.radius * 0.8
  ))
  arrivalPoint.add(APhelper)
  APhelper.material.color.set(0x0011FF)
  arrivalPoint.position.y += 0.02
  arrivalPoint.visible = false

  scene.add(arrivalPoint)

}


function checkForSCG3() {   ///reconstructs geometry if house is damaged

  ///////checking neighbours 
  if (tigerIYuka.neighbors.length) {

    ///////if a neighbour is close, start checking intersections
    tigerIYuka.neighbors.forEach((neib, index) => {

      if (neib.status !== 'house') return //only house in village have status='house'; otherwise - skip that neighbour

      vehicleBShelper.getWorldPosition(helperVector3)
      let distance = helperVector3.distanceTo(obstacles[neib.id].position)

      if (distance < 2.2 && !village.children[neib.id].isCollapsing) { //if vehicle came closer than 1.5 to center of house (obstacle) - collapse
        collapse = true
        collapsingHouses.push(village.children[neib.id])
      }


      if (distance < 2.7 && !collapse) { //if vehicle closer than 2.7 to center of house, but not collapsing (closer than 1.5) - do subtract part from mesh

        let scaleFactor = 1 + ((1 - distance / 2.7) * 1.9)
        neib.done = false


        if (!damageSpriteIsPlaying && (tigerIYuka.getSpeed() > 0.1)) {

          let tempVector3 = obstacles[neib.id].position.clone()
          tempVector3.sub(helperVector3)
          tempVector3.normalize()
          damageSprite.position.copy(helperVector3)
          damageSprite.position.addScaledVector(tempVector3, 0.1)
          damageSprite.position.y += 1.

          village.children[neib.id].material.length ? // if already house.material is an array
            (damageSprite.material.color = village.children[neib.id].material[0].color) :
            (damageSprite.material.color = village.children[neib.id].material.color)

          damageSpriteIsPlaying = true
          damageSprite.scale.set(1, 1, 1)
          damageSprite.material.opacity = 1.5
          actionDamage.playOnce();
        }

        if (damageSpriteIsPlaying) {
          damageSprite.scale.addScalar(0.03);
          damageSprite.material.opacity -= 0.01
        }

        if (scaleFactorsArray.length) {
          if (scaleFactorsArray[index] > scaleFactor) {
            return;
          } else {
            scaleFactorsArray[index] = scaleFactor
          }
        } scaleFactorsArray[index] = scaleFactor


        if (meshresultsArray[index]) {

          meshresultsArray[index].parent.remove(meshresultsArray[index])
          meshresultsArray[index].geometry.dispose()

          meshresultsArray.splice(index, 1);
        }


        SCGmeshA = village.children[neib.id]
        SCGmeshB = new THREE.Mesh(new THREE.SphereGeometry(1, 4, 4),
          new THREE.MeshPhongMaterial({ color: '#0c0c0c' }))

        // SCGmeshB.scale.multiplyScalar(scaleFactorsArray[index])
        SCGmeshB.scale.x *= scaleFactorsArray[index] * 1.2
        SCGmeshB.scale.z *= scaleFactorsArray[index] * 1.2

        SCGmeshB.position.copy(helperVector3)


        ///////Make sure the .matrix of each mesh is current
        SCGmeshA.updateMatrix()
        SCGmeshB.updateMatrix()

        ///////Create a bsp tree from each of the meshes
        let bspA = CSG.fromMesh(SCGmeshA, 0)
        let bspB = CSG.fromMesh(SCGmeshB, 1)

        ////// Subtract one bsp from the other via .subtract... other supported modes are .union and .intersect
        let bspResult = bspA.subtract(bspB)

        ///////Get the resulting mesh from the result bsp, and assign meshA.material to the resulting mesh
        let meshResult = CSG.toMesh(bspResult, SCGmeshA.matrix)

        meshResult.material = [SCGmeshA.material, SCGmeshB.material].flat();

        meshresultsArray.splice(index, 0, meshResult);

        village.children[neib.id].visible = false

        scene.add(meshResult)

      } else {  //if vehicle is further than 2.7 from house (obstacle) after doing substraction - fix the last shape (neib.done = true)

        if (meshresultsArray[index] && !neib.done) {

          village.children[neib.id].geometry.dispose()
          village.children[neib.id].geometry = meshresultsArray[index].geometry.clone()
          village.children[neib.id].material = meshresultsArray[index].material.flat()
          village.children[neib.id].visible = true

          meshresultsArray[index].parent.remove(meshresultsArray[index])
          meshresultsArray[index].geometry.dispose()

          meshresultsArray.splice(index, 1);
          scaleFactorsArray.splice(index, 1);
          neib.done = true
        }

      }
    });
  }

}

function buildActionSprite() {   //building sprites for dust and explosions

  // new THREE.TextureLoader().load(dustCloudTex, (texture) => {

  //   damageSprite = spriteMixer.ActionSprite(texture, 12, 7.01); /// NicePng_smoke.png
  //   damageSprite.setFrame(0);
  //   damageSprite.name = 'damage_Sprite'

  //   actionDamage = spriteMixer.Action(damageSprite, 10, 60, 60); /// NicePng_smoke.png

  //   // damageSprite.visible = false
  //   scene.add(damageSprite);

  //   damageSprite.position.y -= 6 // move Sprite out sight

  //   // action1.playLoop();
  //   actionDamage.playOnce();
  //   actionDamage.stop();
  //   actionDamage.hideWhenFinished = true;
  // });


  // new THREE.TextureLoader().load(collapseCloud, (texture) => {
  //   // dustCloudSprite = spriteMixer.ActionSprite(texture, 5, 3); /// DustCloudSprSheet
  //   // dustCloudSprite = spriteMixer.ActionSprite(texture, 8, 8); /// DustCloudSprSheet2
  //   dustCloudSprite = spriteMixer.ActionSprite(texture, 4, 4); /// 222
  //   dustCloudSprite.setFrame(0);

  //   // actionDustCloud = spriteMixer.Action(dustCloudSprite, 0, 14, 80); /// DustCloudSprSheet
  //   // actionDustCloud = spriteMixer.Action(dustCloudSprite, 0, 56, 50); /// DustCloudSprSheet2 - good and long
  //   actionDustCloud = spriteMixer.Action(dustCloudSprite, 0, 18, 60); /// 222
  //   // actionDustCloud2 = spriteMixer.Action(dustCloudSprite, 4, 24, 100); /// 222

  //   // dustCloudSprite.visible = false
  //   scene.add(dustCloudSprite);

  //   dustCloudSprite.position.y += 16
  //   dustCloudSprite.position.x += 4
  //   dustCloudSprite.scale.multiplyScalar(6)

  //   // action1.playLoop();
  //   actionDustCloud.playOnce();
  //   actionDustCloud.stop();

  //   actionDustCloud.hideWhenFinished = true;
  // });



}

function explosion(entity) {

  // if (!house.isCollapsing) { //checks if a collapseSprite for specific house has already been built

  let tex = damageSpriteTex2.clone()
  tex.needsUpdate = true;

  // let dustCloudSprite = spriteMixer.ActionSprite(tex, 8, 8);
  let dustCloudSprite = spriteMixer.ActionSprite(tex, 17, 3);
  dustCloudSprite.setFrame(0);
  collapsingHousesSprites.push(dustCloudSprite)

  // let actionDustCloud = spriteMixer.Action(dustCloudSprite, 0, 18, 60);
  let actionDustCloud = spriteMixer.Action(dustCloudSprite, 35, 51, 40);
  actionDustCloud.hideWhenFinished = true;

  dustCloudSprite.visible = false
  scene.add(dustCloudSprite);

  // dustCloudSprite.position.copy(obstacles[house.idd].position)
  // dustCloudSprite.position.copy(entity.position)
  dustCloudSprite.position.set(145, 20, -100)
  dustCloudSprite.position.y += 0.4

  // village.children[house.idd].material.length ? // if already house.material is an array
  //   (dustCloudSprite.material.color = village.children[house.idd].material[0].color) :
  //   (dustCloudSprite.material.color = village.children[house.idd].material.color)

  dustCloudSprite.material.opacity += 1.
  dustCloudSprite.scale.set(6, 6, 6)
  actionDustCloud.playOnce();

  // house.isCollapsing = true

  // } else if (house.isCollapsing) {

  //   collapsingHousesSprites[index].material.opacity -= 0.04;
  // }




  //   if (house.scale.y < 0.1) {

  //     collapsingHousesSprites[index].geometry.dispose()
  //     collapsingHousesSprites[index].parent.remove(collapsingHousesSprites[index])

  //     collapsingHouses.splice(index, 1);
  //     collapsingHousesSprites.splice(index, 1);
  //  }

}

function doCollapse(delta) { //collapses houses using RAF and delta

  collapsingHouses.forEach((house, index) => {

    if (!house.collapsed) {

      if (!house.isCollapsing) { //checks if a collapseSprite for specific house has already been built
        bvObstacles[house.idd].visible = false
        obstacles[house.idd].active = false

        let tex = damageSpriteTex.clone()
        tex.needsUpdate = true;

        let dustCloudSprite = spriteMixer.ActionSprite(tex, 4, 4);
        dustCloudSprite.setFrame(0);
        collapsingHousesSprites.push(dustCloudSprite)

        let actionDustCloud = spriteMixer.Action(dustCloudSprite, 0, 18, 60);
        actionDustCloud.hideWhenFinished = true;

        dustCloudSprite.visible = false
        scene.add(dustCloudSprite);

        dustCloudSprite.position.copy(obstacles[house.idd].position)
        dustCloudSprite.position.y += 0.4

        village.children[house.idd].material.length ? // if already house.material is an array
          (dustCloudSprite.material.color = village.children[house.idd].material[0].color) :
          (dustCloudSprite.material.color = village.children[house.idd].material.color)

        dustCloudSprite.material.opacity += 1.
        dustCloudSprite.scale.set(6, 6, 6)
        actionDustCloud.playOnce();

        house.isCollapsing = true

      } else if (house.isCollapsing) {

        collapsingHousesSprites[index].material.opacity -= 0.04;
      }


      let pos = house.geometry.attributes.position.array
      house.scale.y -= delta / 1

      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += MathUtils.randFloatSpread(0.2)
        pos[i + 1] += MathUtils.randFloatSpread(0.4)
        pos[i + 2] += MathUtils.randFloatSpread(0.2)
      }

      house.position.y -= (delta + delta / 2.4)
      house.geometry.attributes.position.needsUpdate = true;

      if (house.scale.y < 0.1) {
        bvObstacles[house.idd].geometry.dispose()
        bvObstacles[house.idd].parent.remove(bvObstacles[house.idd])

        collapsingHousesSprites[index].geometry.dispose()
        collapsingHousesSprites[index].parent.remove(collapsingHousesSprites[index])

        collapsingHouses.splice(index, 1);
        collapsingHousesSprites.splice(index, 1);

        house.collapsed = true
        gunYuka.updateObstacles(obstacles[house.idd]) //removes obstacle from vision's obstacles array
        if (collapsingHouses.length == 0) collapse = false
      }
    } else {
      // collapse = false
      // collapsingHouses.splice(index, 1);
    }

  });

}




function drawTacticalArrow() {

  let arrowDir
  let path = [axisLeadersTacticalSigns[axisACTIVELEADER.platoon].position, ...tacticalArrowPoints]

  if (tacticalArrowPoints.length > 1) {

    ///lets find direction of arrow if there many points in tacticalArrowPoints-array
    arrowDir = path[tacticalArrowPoints.length - 1].clone().sub(path[tacticalArrowPoints.length - 0].clone())
    arrowDir.normalize();

    let axis = new THREE.Vector3()
    axis.set(arrowDir.z, 0, - arrowDir.x).normalize();
    const radians = Math.acos(arrowDir.y);

    axisLeadersArrowPath[axisACTIVELEADER.platoon].arrow.quaternion.setFromAxisAngle(axis, -radians);
    axisLeadersArrowPath[axisACTIVELEADER.platoon].leadersNumber = axisACTIVELEADER.uniqeNumber
  } else if (tacticalArrowPoints.length > 0) {

    ///lets find direction of arrow if there only two points in path-array (simgle click on tactical map)
    arrowDir = path[path.length - 2].clone().sub(path[path.length - 1].clone())
    arrowDir.normalize();

    let axis = new THREE.Vector3()
    axis.set(arrowDir.z, 0, - arrowDir.x).normalize();
    const radians = Math.acos(arrowDir.y);

    axisLeadersArrowPath[axisACTIVELEADER.platoon].arrow.quaternion.setFromAxisAngle(axis, -radians);
    axisLeadersArrowPath[axisACTIVELEADER.platoon].leadersNumber = axisACTIVELEADER.uniqeNumber
  }


  axisLeadersArrowPath[axisACTIVELEADER.platoon].line.geometry.dispose();
  axisLeadersArrowPath[axisACTIVELEADER.platoon].line.geometry = new THREE.BufferGeometry().setFromPoints(path);
  axisLeadersArrowPath[axisACTIVELEADER.platoon].line.computeLineDistances();
  axisLeadersArrowPath[axisACTIVELEADER.platoon].path = path

  axisLeadersArrowPath[axisACTIVELEADER.platoon].arrow.visible = true
  axisLeadersArrowPath[axisACTIVELEADER.platoon].arrow.position.copy(path[path.length - 1])
}

function updateTacticalArrow() {

  ///looking for platoon with active path among axisLeadersTacticalSigns.
  for (let i = 0; i < axisLeadersTacticalSigns.length; i++) {

    /// 'i'of axisLeadersArrowPath will coincide with 'i' of axisLeadersTacticalSigns
    if (axisLeadersArrowPath[i].path.length > 1) {

      ///if platoon has been destroyed, erase line and arrow of it path
      if (axisPlatoons[i].activeUnits < 1) {
        axisLeadersArrowPath[i].path = []
        axisLeadersArrowPath[i].line.geometry.dispose();
        axisLeadersArrowPath[i].line.geometry = new THREE.BufferGeometry().setFromPoints(axisLeadersArrowPath[i].path);
        axisLeadersArrowPath[i].arrow.visible = false

        return
      }



      let index

      ///when platoon is found we are looking for a leader-entity of the platoon
      for (let j = 0; j < axisPlatoons[i].length; j++) {

        if (axisPlatoons[i][j].leader) {

          if (axisPlatoons[i][j].trackHasBeenHit) {
            axisLeadersArrowPath[i].path = []
            axisLeadersArrowPath[i].line.geometry.dispose();
            axisLeadersArrowPath[i].line.geometry = new THREE.BufferGeometry().setFromPoints(axisLeadersArrowPath[i].path);
            axisLeadersArrowPath[i].arrow.visible = false

            return
          }

          ///check if ACTIVLEADER still equals actual ACTIVEPLATOON.leader
          if ((axisPlatoons[i] === axisACTIVEPLATOON) && (axisPlatoons[i][j] !== axisACTIVELEADER)) {
            axisACTIVELEADER = axisPlatoons[i][j]
          }



          ///looking for index - it shows which point of path the entity is approaching
          let leaderPath = axisPlatoons[i][j].steering.behaviors[1].path
          leaderPath._index < 1 ? index = 1 : index = leaderPath._index


          ///if leader has been changed, we should reset axisLeadersArrowPath (each entity in platoon has slightly different path-point)
          if (axisPlatoons[i][j].uniqeNumber !== axisLeadersArrowPath[i].leadersNumber) {
            axisLeadersArrowPath[i].path = []
            leaderPath._waypoints.forEach(point => {
              axisLeadersArrowPath[i].path.push(point.clone().divideScalar(terrainScale / 5))
              axisLeadersArrowPath[i].leadersNumber = axisPlatoons[i][j].uniqeNumber
            });

            ///lets delete [0]-point because further we add as [0]-point axisLeadersTacticalSigns[i].position
            axisLeadersArrowPath[i].path.shift()
            axisLeadersArrowPath[i].arrow.position.copy(axisLeadersArrowPath[i].path[axisLeadersArrowPath[i].path.length - 1])



          }


          ///if entity is moving to the endpoint, lets check if it has already arrived to endpoint 
          if (index == leaderPath._waypoints.length - 1) {

            let arrivalPointPosition = leaderPath._waypoints[leaderPath._waypoints.length - 1]
            let distance = axisPlatoons[i][j].position.distanceTo(arrivalPointPosition)

            ///if it has arrived to the endpoint, lets erase line and an arrow on the tactical map
            if ((distance < axisPlatoons[i][j].triggerDistance) && axisPlatoons[i][j].steering.behaviors[1].active) {
              axisLeadersArrowPath[i].path = []
              axisLeadersArrowPath[i].line.geometry.dispose();
              axisLeadersArrowPath[i].line.geometry = new THREE.BufferGeometry().setFromPoints(axisLeadersArrowPath[i].path);
              axisLeadersArrowPath[i].arrow.visible = false

              return
            }
          }


          break
        };
      }



      let path = [axisLeadersTacticalSigns[i].position,
      ...axisLeadersArrowPath[i].path.slice(index - 0)]

      axisLeadersArrowPath[i].line.geometry.dispose();
      axisLeadersArrowPath[i].line.geometry = new THREE.BufferGeometry().setFromPoints(path);
      axisLeadersArrowPath[i].line.computeLineDistances();
    }
  }


}




function tankDestroyedSmoke(entity) {

  let ps = new ParticleSystem({
    emitter: new TunnelEmitter()
  })

  smokeEmmiters.push(ps)
  scene.add(ps.mesh)
  ps.mesh.scale.set(0.1, 0.1, 0.1)
  ps.mesh.position.copy(entity.position)
  ps.start()
}

function initParticles() {
  ps = new ParticleSystem({
    // emitter: new TunnelEmitter()
    emitter: new ExplodeEmitter()
  })
  scene.add(ps.mesh)
  ps.mesh.scale.set(0.1, 0.1, 0.1)
  ps.mesh.position.set(140, 20, -100)
  ps.start()
}

///stops execution of emitter if browser tab switches. Switching causes lag in dt calculations
function handleVisibilityChange() {

  tabVisible = !tabVisible

  tabVisible ? smokeEmmiters.forEach(ps => { ps.start() }) : smokeEmmiters.forEach(ps => { ps.stop() })
  // tabVisible ? ps.start() : ps.stop()
}



