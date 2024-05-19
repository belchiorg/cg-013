import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene, renderer;
let ringRadius = [5, 7, 9];
let scene_objects = {
    carrossel: null,
    rings: []
};
let cameras = {
    perspective_camera: null
};
let materials = [
    new THREE.MeshLambertMaterial({ wireframe: false , side: THREE.DoubleSide}),
    new THREE.MeshPhongMaterial({ wireframe: false , side: THREE.DoubleSide }),
    new THREE.MeshToonMaterial({ wireframe: false , side: THREE.DoubleSide }),
    new THREE.MeshNormalMaterial({ wireframe: false , side: THREE.DoubleSide }),
]
let parametricFunctions = [
    function (u, v, target) { // Create a cone
        if (u < 0.1) {
            // Base of the cone
            const radius = u * 10; // Scale u to create the radius
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = 0; // Base at z = 0
            target.set(x, y, z);
        } else {
            // Body of the cone
            const coneU = (u - 0.1) / 0.9; // Adjust u to range from 0 to 1
            const radius = 1 - coneU; // Radius decreases as coneU increases
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = coneU * 2; // Height of the cone
            target.set(x, y, z);
        }
    },
    function (u, v, target) {
        if (u < 0.1) {
            // Base of the cone
            const radius = u * 10; // Scale u to create the radius
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = 0; // Base at z = 0
            target.set(x, y, z);
        }
        else if (u < 0.9) {
            const radius = 1; // Radius of the cylinder
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = u * 2; // Height of the cylinder (scaled to 2 units)
            target.set(x, y, z);
        }
        else {
            // Base of the cone
            const radius = u * 0.1; // Scale u to create the radius
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = 0; // Base at z = 0
            target.set(x, y, z);
        }
    },
    function (u, v, target) {
        let x = u - 0.5;
        let y = v - 0.5;
        let z = Math.cos(v * Math.PI * 2);
        target.set(x, y, z);
    },
    function (u, v, target) {
        let x = u - 0.5;
        let y = v - 0.5;
        let z = Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI * 2);
        target.set(x, y, z);
    },
    function (u, v, target) {
        let x = u - 0.5;
        let y = v - 0.5;
        let z = Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2);
        target.set(x, y, z);
    },
    function (u, v, target) {
        let x = u - 0.5;
        let y = v - 0.5;
        let z = Math.cos(u * Math.PI * 2);
        target.set(x, y, z);
    },
    function (u, v, target) {
        if (u < 0.01) {
            // Base of the cone
            const radius = u * 10; // Scale u to create the radius
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = 0; // Base at z = 0
            target.set(x, y, z);
        }
        else if (u < 0.99) {
            const radius = 1; // Radius of the cylinder
            const angle = v * 2 * Math.PI;
            // Make the cylinder be a little concave in the middle
            const x = radius * Math.cos(angle) * (Math.pow(u - 0.5, 2) * Math.pow(Math.cos(v * Math.PI), 2) + 1); 
            const y = radius * Math.sin(angle) * (Math.pow(u - 0.5, 2) * Math.pow(Math.sin(v * Math.PI), 2) + 1);
            const z = u * 2; // Height of the cylinder (scaled to 2 units)
            target.set(x, y, z);
        }
        else {
            // Base of the cone
            const radius = u * 0.1; // Scale u to create the radius
            const angle = v * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const z = 0; // Base at z = 0
            target.set(x, y, z);
        }
    },
    function (u, v, target) {
        let x = u - 0.5;
        let y = v - 0.5;
        let z = Math.cos(v * Math.PI * 2);
        target.set(x, y, z);
    }
]

let ringMovements = [false, false, false], ringMoving = [false, false, false];
let current_camera;
let ambientLight, directionalLight, directionalLightOn;

let controls

let current_material = 0;


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(20));

    let geometry = new THREE.SphereGeometry(100, 40, 40);
    let material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide});
    let mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

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
function createFigures(ring_idx, color){
    'use strict';

    let ring = scene_objects.rings[ring_idx];
    for (let i = 0; i < 8; i++) {
        let figureContainer = new THREE.Object3D();
        figureContainer.position.set(0, ring.position.y, 0);
        ring.add(figureContainer);
        let geometry = new ParametricGeometry(parametricFunctions[i], 32, 32);
        let material = materials[current_material].clone();
        material.color = new THREE.Color(color);
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(ringRadius[ring_idx], 2, 0);
        mesh.rotation.x = -Math.PI / 2;

        figureContainer.rotation.y = i * Math.PI / 4;
        figureContainer.add(mesh);
    }
}

function createCarrossel(carrossel){
    // Criar cilindro
    let geometry = new THREE.CylinderGeometry(3, 3, 30, 32);
    let material = materials[current_material].clone();
    material.color = new THREE.Color(0xFFFFFF);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,15,0);
    carrossel.add(mesh);

    // adicionar 3 anéis
    let ring;
    for (let i = 0; i < 3; i++){
        ring = createRing(i == 0 ? 3 : ringRadius[i - 1], ringRadius[i]);
        ring.position.set(0, 0, 0);
        carrossel.add(ring);
        scene_objects.rings.push(ring);
    }

    createFigures(2 /* should be the index, make a for*/, 0x0000ff);
    
    scene.add(carrossel);
}

function createRing(inner_radius, outer_radius) {
    let ringGroup = new THREE.Object3D();

    // Criar anel superior
    let geometry = new THREE.RingGeometry(inner_radius, outer_radius, 32);
    let material = materials[current_material].clone();
    material.color = new THREE.Color(0x17C3B2);
    material.wireframe = false ;
    material.side = THREE.DoubleSide;
    let mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, 3, 0);
    ringGroup.add(mesh);


    // Criar anel inferior
    geometry = new THREE.RingGeometry(inner_radius, outer_radius, 32);
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, 0, 0);
    ringGroup.add(mesh);

    // Criar cilindro entre os anéis
    geometry = new THREE.CylinderGeometry(outer_radius, outer_radius, 3, 32, 1, true);
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
function updateCurrentMaterial(material){
    current_material = material;
    
    //Aux function to transverse everything inside an Object3D
    function transverse(object) {
        object.children.forEach(element => {
            if (element.type === "Object3D") {
                transverse(element);
            }
            else if (element.type === "Mesh") {
                // Keep the color and side of the prev material
                let color = element.material.color;
                let side = element.material.side;

                // Create a copy of the material and assign it to the object
                element.material = materials[current_material].clone();
                element.material.color = color
                element.material.side = side;
            }
        });
    }

    transverse(scene_objects.carrossel);
}

function update(){
    'use strict';

    // Rotate the central cylinder
    if (scene_objects.carrossel) {
        scene_objects.carrossel.rotation.y += 0.01;
    }

    // Move the rings
    for (let i = 0; i < 3; i++) {
        if (ringMoving[i]) {
            if (ringMovements[i]) {
                scene_objects.rings[i].position.y += 0.1;
                if (scene_objects.rings[i].position.y > 27) {
                    ringMovements[i] = false; // Reverse direction
                }
            } else {
                scene_objects.rings[i].position.y -= 0.1;
                if (scene_objects.rings[i].position.y < 0) {
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

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';
    switch (e.keyCode) {
        case 68:
            directionalLightOn = !directionalLightOn;
            directionalLight.visible = directionalLightOn;
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
        case 81: // Key 'Q'
            updateCurrentMaterial(0);
            break;
        case 87: // Key 'W'
            updateCurrentMaterial(1);
            break;
        case 69: // Key 'E'
            updateCurrentMaterial(2);
            break;
        case 82: // Key 'R'
            updateCurrentMaterial(3);
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