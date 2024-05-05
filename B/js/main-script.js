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
    lower_finger: [],
    cable1: null,
    cable2: null,
    containers: []
}
let keysState = { "1": false,"2": false, "3": false, "4": false, "5": false, "6": false, " ": false, "W": false, "S": false, "Q": false, "A": false, "E": false, "D": false, "R": false, "F": false, "0": false
};
let hud, keysMap;

let current_camera, scene, renderer;

let controls;

let geometry, material, mesh;

let is_top_rotating = 0;
let is_car_moving = 0;
let is_claw_moving = 0;
let is_claw_closing = 0;
let toggle_wireframe = true;
let toggle_wireframe_changed = false;

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
    const viewHeight = 80; // Ajuste conforme necessário
    const viewWidth = aspectRatio * viewHeight;

    cameras.top_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2);
    cameras.top_camera.position.set(0, 30, 0);
    cameras.top_camera.lookAt(scene.position);

    cameras.side_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2);
    cameras.side_camera.position.set(0, 0, 30);
    cameras.side_camera.lookAt(scene.position);

    cameras.front_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2);
    cameras.front_camera.position.set(30, 0, 0);
    cameras.front_camera.lookAt(scene.position);

    cameras.perspective_camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight);
    cameras.perspective_camera.position.set(40, 40, 40);
    cameras.perspective_camera.lookAt(scene.position);

    cameras.orthographic_camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2);
    cameras.orthographic_camera.position.set(30, 30, 30);
    cameras.orthographic_camera.lookAt(scene.position);

    cameras.claw_camera = new THREE.PerspectiveCamera(70, aspectRatio); // Ajuste conforme necessário
    scene_objects.claw.add(cameras.claw_camera);
    cameras.claw_camera.position.set(0, -0.65, 0);
    cameras.claw_camera.rotation.x = -Math.PI / 2;

    cameras.orbit_camera = new THREE.PerspectiveCamera(70, aspectRatio); // Ajuste conforme necessário
    cameras.orbit_camera.position.set(40, 40, 40);
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

function createLowerFinger(lowerFinger, dimensions){
    geometry = new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.depth);
    material = new THREE.MeshBasicMaterial({color: 0x264653, wireframe: true});
    let lower_finger = new THREE.Mesh(geometry, material);
    lowerFinger.add(lower_finger);
    lower_finger.position.set(0.55,-0.55,0); // TODO: mudar esta medida provavelmente
    lower_finger.rotation.z = Math.PI / 4;
    geometry = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 8);
    material = new THREE.MeshBasicMaterial({color: 0x3C3C3B, wireframe: true});
    let cylinder = new THREE.Mesh(geometry, material);
    cylinder.rotation.x = Math.PI / 2;
    lowerFinger.add(cylinder);
}

function createFingers(claw) {
    let fingerParams = {
        position: new THREE.Vector3(-0.85, -0.65, 0), rotation: new THREE.Euler(0, 0, -Math.PI / 4), dimensions: {width: 0.2, height: 1.2, depth: 0.6},
    }

    let geometry = new THREE.BoxGeometry(fingerParams.dimensions.width, fingerParams.dimensions.height, fingerParams.dimensions.depth);
    let material = new THREE.MeshBasicMaterial({color: 0x264653, wireframe: true});
    
    for (let i = 0; i < 4; i++) {
        let finger = new THREE.Mesh(geometry, material);

        let fingerContainer = new THREE.Object3D();
        fingerContainer.add(finger);
        finger.position.set(fingerParams.position.x, fingerParams.position.y, fingerParams.position.z);
        finger.rotation.copy(fingerParams.rotation);
        let lowerFingerContainer = new THREE.Object3D();
        
        lowerFingerContainer.position.set(-1.4, -1.1, 0); // TODO: mudar esta medida provavelmente (x e y)
        createLowerFinger(lowerFingerContainer, fingerParams.dimensions);
        scene_objects.lower_finger.push(lowerFingerContainer);
        
        fingerContainer.rotation.y = Math.PI / 2 * i;
        claw.add(fingerContainer);
        fingerContainer.add(scene_objects.lower_finger[i]);
        
    }
    
}

function createClaw(claw) {
    geometry = new THREE.BoxGeometry( 1, 0.6, 1 );
    material = new THREE.MeshBasicMaterial( {color: 0x264653, wireframe: true} );
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
    geometry = new THREE.CylinderGeometry( 0.1, 0.1, 1, 8 ); // raio de 0.01 fica melhor
    material = new THREE.MeshBasicMaterial( {color: 0x3C3C3B, wireframe: true} );

    scene_objects.cable1 = new THREE.Mesh( geometry, material );
    scene_objects.cable1.position.set(-0.2, -4.5, 0);
    scene_objects.cable1.scale.y = 8;
    car.add(scene_objects.cable1);

    scene_objects.cable2 = new THREE.Mesh( geometry, material );
    scene_objects.cable2.position.set(0.2, -4.5, 0);
    scene_objects.cable2.scale.y = 8;
    car.add(scene_objects.cable2);
    
    scene_objects.claw = new THREE.Object3D();
    createClaw(scene_objects.claw);
    scene_objects.claw.position.set(0, -8.8, 0); // TODO: esta posicao ta meio confusa
    car.add(scene_objects.claw);
}

function createTopPart(topPart) {

    // cilindro
    let geometry = new THREE.CylinderGeometry( 1, 1, 1.4, 32 ); 
    let material = new THREE.MeshBasicMaterial( {color: 0x3C3C3B, wireframe: true} ); 
    let cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(0, 0.7, 0);
    topPart.add(cylinder);

    // cubo
    geometry = new THREE.BoxGeometry(3,2,2);
    material = new THREE.MeshBasicMaterial({color: 0xEBEBD3, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(0.5,2.4,0);
    topPart.add(cylinder);

    // mais um cubo
    geometry = new THREE.BoxGeometry(2,0.4,2);
    material = new THREE.MeshBasicMaterial({color: 0x3C3C3B, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(0,3.6,0);
    topPart.add(cylinder);

    // piramide quadrangular
    geometry = new THREE.CylinderGeometry(0,Math.sqrt(2), 5, 4);
    material = new THREE.MeshBasicMaterial({color: 0x3C3C3B, wireframe: true});
    cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(0, 6.3 , 0);
    cylinder.rotation.y = Math.PI / 4;
    topPart.add( cylinder );

    // mais um cubo
    geometry = new THREE.BoxGeometry(10,2,2);
    material = new THREE.MeshBasicMaterial({color: 0xFFB100, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(-6,4.8,0);
    topPart.add(cylinder);

    // mais um cubo
    geometry = new THREE.BoxGeometry(30,2,2);
    material = new THREE.MeshBasicMaterial({color: 0xFFB100, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(16,4.8,0);
    topPart.add(cylinder);

    // contrapeso
    geometry = new THREE.BoxGeometry(2,2,2);
    material = new THREE.MeshBasicMaterial({color: 0xFFB100, wireframe: true});
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(-8,2.8,0);
    topPart.add(cylinder);

    // tirante
    geometry = new THREE.CylinderGeometry( 0.01, 0.01, 7.2, 32 );
    material = new THREE.MeshBasicMaterial( {color: 0x000000, wireframe: true} );
    cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(-3.3, 7.3, 0); // TODO: corrigir estas medidas
    cylinder.rotation.z = - Math.PI / 2.7 ;
    topPart.add(cylinder);

    // tirante 2
    geometry = new THREE.CylinderGeometry( 0.01, 0.01, 15.9, 32 );
    material = new THREE.MeshBasicMaterial( {color: 0x000000, wireframe: true} );
    cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(7.8, 7.3, 0); // TODO: corrigir estas medidas
    cylinder.rotation.z = Math.PI / 2.25 ;
    topPart.add(cylinder);

    // adicionar objetos dependentes
    scene_objects.car = new THREE.Object3D();
    createCar(scene_objects.car);
    scene_objects.car.position.set(30,3.3,0);
    topPart.add(scene_objects.car);
}

function createBase(grua) {
    let geometry = new THREE.BoxGeometry( 4, 4, 4 ); 
    let material = new THREE.MeshBasicMaterial( {color: 0x3C3C3B , wireframe: true}); 
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

    //check if the finger is colliding with a box


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

    // Update the car position

    if(is_car_moving !== 0){
        if ((scene_objects.car.position.x < 30 && is_car_moving > 0) || (scene_objects.car.position.x > 3 && is_car_moving < 0)){
        scene_objects.car.position.x += is_car_moving * 0.1;
        }
    }

    // Update the top part rotation
    if(is_top_rotating !== 0){
        scene_objects.top_part.rotation.y += is_top_rotating * 0.01;
    }

    // Update the claw position
    if(is_claw_moving !== 0){
        if ((scene_objects.claw.position.y < -0.9 && is_claw_moving > 0) || is_claw_moving<0){
        // TODO: mudar os valores para os atributos da grua
        // TODO: limitar o movimento da garra para nao ir alem do chao
        // Move the claw
        scene_objects.claw.position.y += is_claw_moving * 0.1;
        let cable1 = scene_objects.cable1;
        let cable2 = scene_objects.cable2;

        // Update cable so that it still connects the car and the claw
        cable1.position.y += is_claw_moving * 0.05;
        cable2.position.y += is_claw_moving * 0.05;

        cable1.scale.y -= is_claw_moving * 0.1;
        cable2.scale.y -= is_claw_moving * 0.1;}
    }

    // Update the claw closing
    let claw_rotation = scene_objects.lower_finger[0].rotation.z;
    
    // should only rotate around the max and min values of rotation (between 0 and PI)
    if(is_claw_closing !== 0){
        if ((is_claw_closing > 0 && claw_rotation < 0) || (is_claw_closing < 0 && claw_rotation > -Math.PI / 2)){
            scene_objects.lower_finger.forEach(function(finger){
                finger.rotation.z += is_claw_closing * 0.01;
            });
        }
    }

    // toggle wireframe
    if (toggle_wireframe_changed){
        scene.traverse(function(object) {
            if (object instanceof THREE.Mesh) { // Verifica se o objeto é um mesh
                object.material.wireframe = toggle_wireframe; // Define o modo de wireframe
            }
        });
    }
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
    createHUD();

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize); 
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    update();

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
    
    const key = e.key.toUpperCase();
    if (keysState[key] !== undefined) {
        keysState[key] = true;
        updateHUD();
    }

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
        
        // W key moves the car forward and S to move it backwards
        case 87:
            is_car_moving = 1;
            break;
        case 83:
            is_car_moving = -1;
            break;
        
        // Q and A keys to rotate the top part of the crane
        case 81:
            is_top_rotating = 1;
            break;
        case 65:
            is_top_rotating = -1;
            break;
        
        // E and D keys to move the claw
        case 69:
            is_claw_moving = 1;
            break;
        case 68:
            is_claw_moving = -1;
            break;
        
        // R and F keys to close and open the claw
        case 82:
            is_claw_closing = -1;
            break;
        case 70:
            is_claw_closing = 1;
            break;
        
        // key '0' to toggle wireframe
        case 48:
            toggle_wireframe = !toggle_wireframe;
            toggle_wireframe_changed = true;
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';

    const key = e.key.toUpperCase();
    if (keysState[key] !== undefined) {
        keysState[key] = false;
        updateHUD();
    }

    switch (e.keyCode) {
        case 87:
            is_car_moving = 0;
            break;
        case 83:
            is_car_moving = 0;
            break;
        case 81:
            is_top_rotating = 0;
            break;
        case 65:
            is_top_rotating = 0;
            break;
        case 69:
            is_claw_moving = 0;
            break;
        case 68:
            is_claw_moving = 0;
            break;
        case 82:
            is_claw_closing = 0;
            break;
        case 70:
            is_claw_closing = 0;
            break;
    }
}

function createHUD() {
    hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.position = 'absolute';
    hud.style.top = '10px';
    hud.style.left = '10px';
    hud.style.padding = '10px';
    hud.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    hud.style.border = '1px solid black';
    hud.style.fontFamily = 'Arial';
    hud.style.fontSize = '13px';
    hud.style.color = 'white';
    document.body.appendChild(hud);

    // Mapeamento das teclas para exibição no HUD
    keysMap = {
        "1": "Top Camera",
        "2": "Side Camera",
        "3": "Front Camera",
        "4": "Perspective Camera",
        "5": "Orthographic Camera",
        "6": "Claw Camera",
        " ": "Orbit Controls",
        "W": "Move Car Forward",
        "S": "Move Car Backward",
        "Q": "Rotate Top Part Counter Clockwise",
        "A": "Rotate Top Part Clockwise",
        "E": "Move Claw Up",
        "D": "Move Claw Down",
        "R": "Open Claw",
        "F": "Close Claw",
        "0": "Toggle wireframe"
    };

    updateHUD();
}

function updateHUD() {
    hud.innerHTML = '';
    for (const key in keysMap) {
        const keyDiv = document.createElement('div');
        keyDiv.textContent = keysMap[key] + (keysState[key] ? ' [Active]' : '');
        hud.appendChild(keyDiv);
    }
}

init();
animate();