import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

let current_camera, scene, renderer;

let controls;

let geometry, material, mesh;

function createScene() {
    'use strict';

    scene = new THREE.Scene();


    scene.add(new THREE.AxesHelper(20));

    geometry = new THREE.BoxGeometry(20, 20, 20);
    material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false});
    var cube = new THREE.Mesh(geometry, material);

    var another_geometry = new THREE.SphereGeometry(5, 10, 10);
    var another_material = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: false });
    var ball = new THREE.Mesh(another_geometry, another_material);

    ball.position.set(10, 0, 0);

    scene.add(cube);
    scene.add(ball);
}

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


function onResize() {
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        current_camera.aspect = window.innerWidth / window.innerHeight;
        current_camera.updateProjectionMatrix();
    }

}

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

function render() {
    'use strict';
    renderer.render(scene, current_camera);
}

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
}

function animate() {
    'use strict';

    render();

    controls.update();

    requestAnimationFrame(animate);
}

init();
animate();