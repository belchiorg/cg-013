import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let cameras = {
    //Should be like a map with all the cameras
    top_camera: null,
    front_camera: null,
    side_camera: null,
    perspective_camera: null,
    orthographic_camera: null,
    claw_camera: null,
    orbit_camera: null
}

let scene_objects = {
    grua_in_english: null,
    top_part: null,
    car: null,
    claw: null,
    lower_finger: null,
}

let current_camera, scene, renderer;

let controls;

let geometry, material, mesh;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();


    scene.add(new THREE.AxesHelper(20));

    scene_objects.grua_in_english = new THREE.Object3D();

    createBase(scene_objects.grua_in_english);
    scene.add(scene_objects.grua_in_english);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
    'use strict';

    // Largura e altura da área de visualização
    const aspectRatio = window.innerWidth / window.innerHeight;
    const viewHeight = 30; // Ajuste conforme necessário
    const viewWidth = aspectRatio * viewHeight;

    cameras.top_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 1, 150);
    cameras.top_camera.position.set(0, 30, 0);
    cameras.top_camera.lookAt(scene.position);

    cameras.side_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 1, 150);
    cameras.side_camera.position.set(0, 0, 30);
    cameras.side_camera.lookAt(scene.position);

    cameras.front_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 1, 150);
    cameras.front_camera.position.set(30, 0, 0);
    cameras.front_camera.lookAt(scene.position);

    cameras.perspective_camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 150);
    cameras.perspective_camera.position.set(30, 30, 30);
    cameras.perspective_camera.lookAt(scene.position);

    cameras.orthographic_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 1, 150);
    cameras.orthographic_camera.position.set(30, 30, 30);
    cameras.orthographic_camera.lookAt(scene.position);

    cameras.claw_camera = new THREE.PerspectiveCamera(70, aspectRatio, 1, 150); // Ajuste conforme necessário
    cameras.claw_camera.position.set(30, 30, 30);
    cameras.claw_camera.lookAt(scene.position);

    cameras.orbit_camera = new THREE.PerspectiveCamera(70, aspectRatio, 1, 300); // Ajuste conforme necessário
    cameras.orbit_camera.position.set(30, 30, 30);
    cameras.orbit_camera.lookAt(scene.position);

    // Define a câmera inicial
    current_camera = cameras.side_camera;

    controls = new OrbitControls( cameras.orbit_camera, renderer.domElement );
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createLowerFinger(lowerFinger){
    geometry = new THREE.BoxGeometry(0.2,1.2,0.6);
    material = new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe: true});
    let lower_finger = new THREE.Mesh(geometry, material);
    lower_finger.position.set(0,0.6,0);
    lower_finger.rotation.y = -Math.PI / 4; // TODO: as rotacoes são em eixos diferentes
    lowerFinger.add(lower_finger);
}

function createFingers(claw){
    let fingerParams = [ // tive de ajustar as medidas
        {position: new THREE.Vector3(-0.85, -0.65, 0), rotation: new THREE.Euler(0, 0, -Math.PI / 4), dimensions: {width: 0.2, height: 1.2, depth: 0.6}},
        {position: new THREE.Vector3(0.85, -0.65, 0), rotation: new THREE.Euler(0, 0, Math.PI / 4), dimensions: {width: 0.2, height: 1.2, depth: 0.6}},
        {position: new THREE.Vector3(0, -0.65, -0.85), rotation: new THREE.Euler(Math.PI / 4, 0, 0), dimensions: {width: 0.6, height: 1.2, depth: 0.2}},
        {position: new THREE.Vector3(0, -0.65, 0.85), rotation: new THREE.Euler(-Math.PI / 4, 0, 0), dimensions: {width: 0.6, height: 1.2, depth: 0.2}}
    ];

    for (var i = 0; i < fingerParams.length; i++) {
        geometry = new THREE.BoxGeometry(fingerParams[i].dimensions.width, fingerParams[i].dimensions.height, fingerParams[i].dimensions.depth);
        material = new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe: true});
        let finger = new THREE.Mesh(geometry, material);
        finger.position.copy(fingerParams[i].position);
        finger.rotation.copy(fingerParams[i].rotation);
        claw.add(finger);

        /*scene_objects.lower_finger = new THREE.Object3D();
        createLowerFinger(scene_objects.lower_finger);
        scene_objects.lower_finger.position.set(-0.46,-0.36,0); // estas medidas estao erradas provavelmente
        claw.add(scene_objects.lower_finger);*/
    }
}


function createClaw(claw) {
    geometry = new THREE.BoxGeometry( 1, 0.6, 1 );
    material = new THREE.MeshBasicMaterial( {color: 0x0000FF, wireframe: true} );
    let base_garra = new THREE.Mesh( geometry, material );

    claw.add(base_garra)
    
    createFingers(claw);
}

function createCar(car) {
    geometry = new THREE.BoxGeometry( 2, 1, 1 );
    material = new THREE.MeshBasicMaterial( {color: 0x0000FF, wireframe: true} );
    mesh = new THREE.Mesh( geometry, material );

    car.add(mesh);

    //Add Cables
    geometry = new THREE.CylinderGeometry( 0.1, 0.1, 8, 32 ); // raio de 0.01 fica melhor
    material = new THREE.MeshBasicMaterial( {color: 0x0000FF, wireframe: true} );

    let cable1 = new THREE.Mesh( geometry, material );
    cable1.position.set(-0.2, -4.5, 0);
    car.add(cable1);

    let cable2 = new THREE.Mesh( geometry, material );
    cable2.position.set(0.2, -4.5, 0);
    car.add(cable2);
    
    scene_objects.claw = new THREE.Object3D();
    createClaw(scene_objects.claw);
    scene_objects.claw.position.set(0, -8.8, 0); // TODO: esta posicao ta meio confusa
    car.add(scene_objects.claw);
}

function createTopPart(topPart) {

    // cilindro
    let geometry = new THREE.CylinderGeometry( 1, 1, 1.4, 32 ); 
    let material = new THREE.MeshBasicMaterial( {color: 0x006C67, wireframe: true} ); 
    let cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(0, 0.7, 0);
    topPart.add( cylinder );

    // cubo
    geometry = new THREE.BoxGeometry(3,2,2);
    material = new THREE.MeshBasicMaterial({color: 0x006C67, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(0.5,2.4,0);
    topPart.add(cylinder);

    // mais um cubo
    geometry = new THREE.BoxGeometry(2,0.4,2);
    material = new THREE.MeshBasicMaterial({color: 0x006C67, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(0,3.6,0);
    topPart.add(cylinder);

    // piramide quadrangular
    geometry = new THREE.CylinderGeometry(0,Math.sqrt(2), 5, 4);
    material = new THREE.MeshBasicMaterial({color: 0x006C67, wireframe: true});
    cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(0, 6.3 , 0);
    cylinder.rotation.y = Math.PI / 4;
    topPart.add( cylinder );

    // mais um cubo
    geometry = new THREE.BoxGeometry(10,2,2);
    material = new THREE.MeshBasicMaterial({color: 0x006C67, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(-6,4.8,0);
    topPart.add(cylinder);

    // mais um cubo
    geometry = new THREE.BoxGeometry(30,2,2);
    material = new THREE.MeshBasicMaterial({color: 0x006C67, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(16,4.8,0);
    topPart.add(cylinder);

    // adicionar objetos dependentes
    scene_objects.car = new THREE.Object3D();
    createCar(scene_objects.car);
    scene_objects.car.position.set(30,3.3,0);
    topPart.add(scene_objects.car);
}

function createBase(grua) {
    let geometry = new THREE.BoxGeometry( 3, 4, 6 ); 
    let material = new THREE.MeshBasicMaterial( {color: 0xFFB100 , wireframe: true}); 
    let cube = new THREE.Mesh( geometry, material ); 
    cube.position.set(0, -2, 0);
    grua.add( cube );

    geometry = new THREE.BoxGeometry( 2, 24, 2 ); 
    material = new THREE.MeshBasicMaterial( {color: 0xFFB100 , wireframe: true}); 
    cube = new THREE.Mesh( geometry, material ); 
    cube.position.set(0, 12, 0);
    grua.add( cube );

    scene_objects.top_part = new THREE.Object3D();
    createTopPart(scene_objects.top_part);
    scene_objects.top_part.position.set(0,24,0);
    grua.add(scene_objects.top_part);
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';

}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';
    renderer.render(scene, current_camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB, 1);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCameras();

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    /*grua_in_english = new THREE.Object3D();

    createBase(grua_in_english);
    scene.add(grua_in_english);

    render();*/
    
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    render();

    controls.update();

    requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        current_camera.aspect = window.innerWidth / window.innerHeight;
        current_camera.updateProjectionMatrix();
    }

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

    //Keys from 1 to 6 change the camera 
    switch (e.keyCode) {
        case 49:
            current_camera = cameras.top_camera;
            break;
        case 50:
            current_camera = cameras.side_camera;
            break;
        case 51:
            current_camera = cameras.front_camera;
            break;
        case 52:
            current_camera = cameras.perspective_camera;
            break;
        case 53:
            current_camera = cameras.orthographic_camera;
            break;
        case 54:
            current_camera = cameras.claw_camera;
            break;
        // Space key changes to orbit controls
        case 32:
            current_camera = cameras.orbit_camera;
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
}

init();
animate();