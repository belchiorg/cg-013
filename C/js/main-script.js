import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;
let scene_objects = {
    carrossel: null,
    rings: []
};
let cameras = {
    perspective_camera: null
};
let ringMovements = [false, false, false], ringMoving = [false, false, false];
let current_camera;
let ambientLight, directionalLight, directionalLightOn;

let controls


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(20));

    scene_objects.carrossel = new THREE.Object3D();
    createCarrossel(scene_objects.carrossel);
    scene.add(scene_objects.carrossel);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
    cameras.perspective_camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight);
    cameras.perspective_camera.position.set(40,40,40);
    cameras.perspective_camera.lookAt(scene.position);
    
    current_camera = cameras.perspective_camera;

    controls = new OrbitControls(cameras.perspective_camera, renderer.domElement);
}


/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLights() {
    ambientLight = new THREE.AmbientLight(0xffa500, 0.3);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 20);
    directionalLight.position.set(50,50,-50);
    scene.add(directionalLight); // nao entendi a parte do angulo diferente de 0 em relacao a normal ns do que

    directionalLightOn = true;
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCarrossel(carrossel){
    // Criar cilindro
    let geometry = new THREE.CylinderGeometry(3, 3, 30, 32);
    let material = new THREE.MeshPhongMaterial({ color: 0xff0000, wireframe: true}); // trocar para os varios tipos de material
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,15,0);
    carrossel.add(mesh);

    // Adicionar 3 anéis
    let ring = createRing(5);
    ring.position.set(0, 1.5,0);
    carrossel.add(ring);
    scene_objects.rings.push(ring);

    ring = createRing(7);
    ring.position.set(0, 7,0);
    carrossel.add(ring);
    scene_objects.rings.push(ring);

    ring = createRing(9);
    ring.position.set(0, 14,0);
    carrossel.add(ring);
    scene_objects.rings.push(ring);

    
    /*for (let i = 5; i<  10; i++){
        ring = createRing(i);
        ring.position.set(0, 1.5,0);
        carrossel.add(ring);
        scene_objects.rings.push(ring);
    }*/ 
    

    scene.add(carrossel);
}

function createRing(radius) {
    let ringGroup = new THREE.Object3D();

    // Criar anel superior
    let geometry = new THREE.RingGeometry(3, radius, 32);
    let material = new THREE.MeshPhongMaterial({ color: 0x17C3B2, wireframe: true }); // mudar para permitir os outros materiais
    let mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, 3, 0);
    ringGroup.add(mesh);


    // Criar anel inferior
    geometry = new THREE.RingGeometry(3, radius, 32);
    material = new THREE.MeshPhongMaterial({ color: 0x17C3B2, wireframe: true }); // mudar para permitir os outros materiais
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, 0, 0);
    ringGroup.add(mesh);

    // Criar cilindro entre os anéis
    geometry = new THREE.CylinderGeometry(radius, radius, 3, 32, 1, true);
    material = new THREE.MeshPhongMaterial({ color: 0x17C3B2, wireframe: true }); // mudar para permitir os outros materiais
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1.5, 0);
    ringGroup.add(mesh);

    return ringGroup;
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

    // Rotate the central cylinder
    if (scene_objects.carrossel) {
        scene_objects.carrossel.cylinder.rotation.y += 0.01;
    }

    // Move the rings
    for (let i = 0; i < 3; i++) {
        if (ringMoving[i]) {
            if (ringMovements[i]) {
                scene_objects.rings[i].position.y += 0.1;
                if (scene_objects.rings[i].position.y > 28.5) {
                    ringMovements[i] = false; // Reverse direction
                }
            } else {
                scene_objects.rings[i].position.y -= 0.1;
                if (scene_objects.rings[i].position.y < 1.5) {
                    ringMovements[i] = true; // Reverse direction
                }
            }
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
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xD3D3D3, 1);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCameras();
    createLights();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
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

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';
    switch (e.keyCode) {
        case 68:
            directionalLightOn = !directionalLightOn;
            directionalLight.visible = directionalLightOn; // nao funciona isto
            break;
        case 49: // Key '1'
            ringMoving[0] = true;
            break;
        case 50: // Key '2'
            ringMoving[1] = true;
            break;
        case 51: // Key '3'
            ringMoving[2] = true;
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
    switch (e.keyCode) {
        case 49: // Key '1'
            ringMoving[0] = false;
            break;
        case 50: // Key '2'
            ringMoving[1] = false;
            break;
        case 51: // Key '3'
            ringMoving[2] = false;
            break;
    }
}

init();
animate();