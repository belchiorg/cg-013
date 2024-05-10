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
    container: null,
    cargas: []
}

let hud, keysMap, cameraKeys = ["1","2","3","4","5","6"," "], keysState = { "1": false,"2": false, "3": false, "4": false, "5": false, "6": false, " ": false, "W": false, "S": false, "Q": false, "A": false, "E": false, "D": false, "R": false, "F": false, "0": true
};

let current_camera, scene, renderer;

let controls;

let geometry, material, mesh;

let is_top_rotating = 0;
let is_car_moving = 0;
let is_claw_moving = 0;
let is_claw_closing = 0;
let toggle_wireframe = true;
let toggle_wireframe_changed = false;

let is_colliding = -1;
let esfera_garra, esfera_cargas=[];

let is_animating = false;

let clock = new THREE.Clock(true);

let animation_state = {
    "grabbing": false,
    "lifting": false,
    "rotating": false,
    "centering": false, //car should be centered with the container
    "lowering": false,
    "releasing": false,
    "resetting": false
}

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();


    scene.add(new THREE.AxesHelper(20));

    scene_objects.grua_in_english = new THREE.Object3D();

    createBase(scene_objects.grua_in_english);
    createContentor();
    createCargas();
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
    lower_finger.position.set(0.55,-0.55,0);
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
        
        lowerFingerContainer.position.set(-1.4, -1.1, 0);
        createLowerFinger(lowerFingerContainer, fingerParams.dimensions);
        lowerFingerContainer.rotation.z = - Math.PI / 2;
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
    esfera_garra = new THREE.Box3().setFromObject(claw);
}

function createCar(car) {
    geometry = new THREE.BoxGeometry( 2, 1, 1 );
    material = new THREE.MeshBasicMaterial( {color: 0x0000FF, wireframe: true} );
    mesh = new THREE.Mesh( geometry, material );

    car.add(mesh);

    //Add Cables
    geometry = new THREE.CylinderGeometry( 0.1, 0.1, 1, 8 );
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
    scene_objects.claw.position.set(0, -8.8, 0);
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
    cylinder.position.set(-3.3, 7.3, 0);
    cylinder.rotation.z = - Math.PI / 2.7 ;
    topPart.add(cylinder);

    // tirante 2
    geometry = new THREE.CylinderGeometry( 0.01, 0.01, 15.9, 32 );
    material = new THREE.MeshBasicMaterial( {color: 0x000000, wireframe: true} );
    cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(7.8, 7.3, 0);
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

function createContentor() {

    scene_objects.container = new THREE.Object3D();

    scene_objects.container.position.set(0, 5, -25);

    material = new THREE.MeshBasicMaterial( {color: 0x7A82AB, wireframe: true});

    geometry = new THREE.BoxGeometry( 0.5, 10, 20 );
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(5, 0, 0);
    scene_objects.container.add(mesh);
    
    geometry = new THREE.BoxGeometry( 10, 10, 0.5 );
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, 0, 10);
    scene_objects.container.add(mesh);

    geometry = new THREE.BoxGeometry( 10, 10, 0.5 );
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, 0, -10);
    scene_objects.container.add(mesh);

    geometry = new THREE.BoxGeometry( 0.5, 10, 20 );
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(-5, 0, 0);
    scene_objects.container.add(mesh);

    //floor
    geometry = new THREE.BoxGeometry( 10, 0.5, 20 );
    material = new THREE.MeshBasicMaterial( {color: 0x3C3C3B, wireframe: true});
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, -5, 0);
    scene_objects.container.add(mesh);

    scene.add(scene_objects.container);
}

function createCargas() {
    const geometries = [ new THREE.DodecahedronGeometry(2, 1), new THREE.IcosahedronGeometry(2, 0), new THREE.TorusGeometry(1, 0.3), new THREE.TorusKnotGeometry(1, 0.2, 100, 2) ];
    const material = new THREE.MeshBasicMaterial({ color: 0x0000AA, wireframe: true });

    const contentorBoundingBox = new THREE.Box3().setFromObject(scene_objects.container);
    const baseBoundingBox = new THREE.Box3( new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 24, 1));

    for (let i = 0; i < 4; i++) {
        let carga;
        let validPosition = false;
        while (!validPosition) {
            const position = new THREE.Vector3(
                Math.random() * 40 - 20,
                2,
                Math.random() * 40 - 20
            );
            carga = new THREE.Mesh(geometries[i], material);
            carga.position.copy(position);
            let random_scale = 0.5 + Math.random() * 1.5;
            carga.scale.set(random_scale, random_scale, random_scale);
            const cargaBoundingBox = new THREE.Box3().setFromObject(carga);

            // verificar se ha colisoes
            let collides = false;
            if (contentorBoundingBox.intersectsBox(cargaBoundingBox) || baseBoundingBox.intersectsBox(cargaBoundingBox)) {
                collides = true;
            } else {
                for (const existingCarga of scene_objects.cargas) {
                    const existingCargaBoundingBox = new THREE.Box3().setFromObject(existingCarga);
                    if (existingCargaBoundingBox.intersectsBox(cargaBoundingBox)) {
                        collides = true;
                        break;
                    }
                }
            }

            // ha colisao --> mudar posicao da carga
            if (collides) {
                carga.position.set(
                    Math.random() * 40 - 20,
                    2,
                    Math.random() * 40 - 20
                );
            } else {
                validPosition = true;
            }
        }
        scene.add(carga);
        scene_objects.cargas.push(carga);
        esfera_cargas.push(new THREE.Box3().setFromObject(carga));
    }
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';
    //check if the finger is colliding with a box
    esfera_garra.setFromObject(scene_objects.claw);
    is_colliding = -1;
    for (var i = 0; i < 4; i++){
        esfera_cargas[i].setFromObject(scene_objects.cargas[i]);
        if (esfera_garra.intersectsBox(esfera_cargas[i])) {
            is_colliding = i;
        }
    }
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';
    console.log("Colliding with box " + is_colliding);
    is_animating = true;
    scene_objects.cargas[is_colliding].position.set(0,-3,0);
    scene_objects.claw.add(scene_objects.cargas[is_colliding])
    animation_state.grabbing = true;
}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

    let delta = clock.getDelta();

    // Update the car position

    if(is_car_moving !== 0){
        if ((scene_objects.car.position.x < 30 && is_car_moving > 0) || (scene_objects.car.position.x > 3 && is_car_moving < 0)){
        scene_objects.car.position.x += is_car_moving * delta * 10;
        }
    }

    // Update the top part rotation
    if(is_top_rotating !== 0){
        scene_objects.top_part.rotation.y += is_top_rotating * delta;
    }

    // Update the claw position
    if(is_claw_moving !== 0){
        if ((scene_objects.claw.position.y < -0.9 && is_claw_moving > 0) || ( scene_objects.claw.position.y > -25 && is_claw_moving<0 && is_colliding < 0)){

        scene_objects.claw.position.y += is_claw_moving * delta *10;
        let cable1 = scene_objects.cable1;
        let cable2 = scene_objects.cable2;

        // Update cable so that it still connects the car and the claw
        cable1.position.y += is_claw_moving * delta/2 *10;
        cable2.position.y += is_claw_moving * delta/2 *10 ;

        cable1.scale.y -= is_claw_moving * delta *10;
        cable2.scale.y -= is_claw_moving * delta*10;
        }
    }

    // Update the claw closing
    let claw_rotation = scene_objects.lower_finger[0].rotation.z;
    
    // should only rotate around the max and min values of rotation (between 0 and PI)
    if(is_claw_closing !== 0){
        if (is_claw_closing > 0 && claw_rotation < 0){
            if (is_colliding >= 0) handleCollisions();
            scene_objects.lower_finger.forEach(function(finger){
                finger.rotation.z += is_claw_closing * delta;
            });
        }
        else if (is_claw_closing < 0 && claw_rotation > -Math.PI / 2){
            scene_objects.lower_finger.forEach(function(finger){
                finger.rotation.z += is_claw_closing * delta;
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

    checkCollisions();
}

function updateAnimation(){
    let delta = clock.getDelta();
    //Should make an animation of grabbing the box, lift it, rotate to where the container is, lower the box and release it
    if (animation_state.grabbing){
        //Should animate the claw closing
        scene_objects.lower_finger.forEach(function(finger){
            finger.rotation.z += delta;
        });
        if (scene_objects.lower_finger[0].rotation.z >= 0){
            animation_state.grabbing = false;
            animation_state.lifting = true;
        }
    }
    else if (animation_state.lifting){
        //Should animate the claw moving up
        scene_objects.claw.position.y += delta *10;
        let cable1 = scene_objects.cable1;
        let cable2 = scene_objects.cable2;

        // Update cable so that it still connects the car and the claw
        cable1.position.y += delta/2 *10;
        cable2.position.y += delta/2 *10 ;

        cable1.scale.y -= delta *10;
        cable2.scale.y -= delta*10;

        if (scene_objects.claw.position.y >= -0.9){
            animation_state.lifting = false;
            animation_state.rotating = true;
        }
    }
    else if (animation_state.rotating){
        //Should animate the top part rotating to where the container is
        scene_objects.top_part.rotation.y += delta;
        scene_objects.top_part.rotation.y = scene_objects.top_part.rotation.y % (2 * Math.PI);
        if (scene_objects.top_part.rotation.y >= Math.PI/2 -0.01 && scene_objects.top_part.rotation.y <= Math.PI/2 + 0.01){
            animation_state.rotating = false;
            animation_state.centering = true;
        }
    }
    else if (animation_state.centering){
        //Should animate the car moving to the center of the container
        if (scene_objects.car.position.x < 24.9){
            scene_objects.car.position.x += delta *10;
        }
        else if (scene_objects.car.position.x > 25.1){
            scene_objects.car.position.x -= delta *10;
        }
        else{
            animation_state.centering = false;
            animation_state.lowering = true;
        }
    }
    else if (animation_state.lowering){
        //Should animate the claw moving down
        scene_objects.claw.position.y -= delta *10;
        let cable1 = scene_objects.cable1;
        let cable2 = scene_objects.cable2;

        // Update cable so that it still connects the car and the claw
        cable1.position.y -= delta/2 *10;
        cable2.position.y -= delta/2 *10 ;

        cable1.scale.y += delta *10;
        cable2.scale.y += delta*10;

        if (scene_objects.claw.position.y <= -22){
            animation_state.lowering = false;
            animation_state.releasing = true;
        }
    }
    else if (animation_state.releasing){
        //Should animate the claw opening
        scene_objects.lower_finger.forEach(function(finger){
            finger.rotation.z -= delta;
        });
        if (scene_objects.lower_finger[0].rotation.z <= -Math.PI / 2){
            animation_state.releasing = false;
            animation_state.resetting = true
            scene_objects.claw.remove(scene_objects.cargas[is_colliding]);
            scene_objects.container.add(scene_objects.cargas[is_colliding]);
        }
    }
    else if (animation_state.resetting){
        //just lifts a little bit the claw
        scene_objects.claw.position.y += delta *10;
        let cable1 = scene_objects.cable1;
        let cable2 = scene_objects.cable2;

        // Update cable so that it still connects the car and the claw
        cable1.position.y += delta/2 *10;
        cable2.position.y += delta/2 *10 ;
        
        cable1.scale.y -= delta *10;
        cable2.scale.y -= delta*10;
        if (scene_objects.claw.position.y >= -10){
            animation_state.resetting = false;
            is_animating = false;
            is_colliding = -1;
        }
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

    if (!is_animating) {
        update();
    } else {
        updateAnimation();
    }

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
        // camaras
        if (cameraKeys.includes(key)){
            cameraKeys.forEach(camKey => {
                keysState[camKey] = false;
            });
        }

        // movimentos da grua
        switch (key){
            case "Q":
                keysState["A"]=false;
                break;
            case "A":
                keysState["Q"]=false;
                break;
            case "W":
                keysState["S"]=false;
                break;
            case "S":
                keysState["W"]=false;
                break;
            case "E":
                keysState["D"]=false;
                break;
            case "D":
                keysState["E"]=false;
                break;
            case "F":
                keysState["R"]=false;
                break;
            case "R":
                keysState["F"]=false;
                break;
        }
        keysState[key] = true;
        updateHUD();
    }

    //Keys from 1 to 6 change the camera 
    switch (e.keyCode) {
        case 49:
            current_camera = cameras.front_camera;
            break;
        case 50:
            current_camera = cameras.side_camera;
            break;
        case 51:
            current_camera = cameras.top_camera;
            break;
        case 52:
            current_camera = cameras.orthographic_camera;
            break;
        case 53:
            current_camera = cameras.perspective_camera;
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
    if (keysState[key] !== undefined && !cameraKeys.includes(key) && !(key === "0" && toggle_wireframe)) {
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
    hud.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    hud.style.border = '1px solid black';
    hud.style.fontFamily = 'Arial';
    hud.style.fontSize = '13px';
    hud.style.color = 'white';
    document.body.appendChild(hud);

    // Mapeamento das teclas para exibição no HUD
    keysMap = {
        "1": "Front Camera (1)",
        "2": "Side Camera (2)",
        "3": "Top Camera (3)",
        "4": "Orthographic Camera (4)",
        "5": "Perspective Camera (5)",
        "6": "Claw Camera (6)",
        " ": "Orbit Controls (space)",
        "W": "Move Car Forward (W)",
        "S": "Move Car Backward (S)",
        "Q": "Rotate Top Part Counter Clockwise (Q)",
        "A": "Rotate Top Part Clockwise (A)",
        "E": "Move Claw Up (E)",
        "D": "Move Claw Down (D)",
        "R": "Open Claw (R)",
        "F": "Close Claw (F)",
        "0": "Toggle wireframe (0)"
    };

    updateHUD();
}

function updateHUD() {
    hud.innerHTML = '';
    for (const key in keysMap) {
        const keyDiv = document.createElement('div');
        keyDiv.textContent = keysMap[key] + (keysState[key] ? ' [Active]' : '');
        if (keysState[key]) {
            keyDiv.style.color = 'green'; // Change color to green when active
        }
        hud.appendChild(keyDiv);
    }
}

init();
animate();