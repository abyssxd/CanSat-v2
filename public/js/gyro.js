import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/MTLLoader.js';

async function initCanSatVisualization() {
    const container = document.getElementById('cansatContainer');
    if (!container) {
        console.error("cansatContainer not found in DOM");
        return;
    }

    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        69, 
        container.offsetWidth / container.offsetHeight, 
        0.1, 
        1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    // Set clear color to a dark tone for the dark theme
    renderer.setClearColor(0x121212);
    container.appendChild(renderer.domElement);

    // Position the camera
    camera.position.set(0, 0, 300);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    let cansatModel;

    // Load the model using MTL and OBJ loaders
    const mtlLoader = new MTLLoader();
    mtlLoader.load('models/obj.mtl', function (materials) {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('models/demo.obj', function (obj) {
            cansatModel = obj;
            scene.add(cansatModel);
        });
    });

    // Create a target quaternion for smooth rotation
    let targetQuaternion = new THREE.Quaternion();

    // Create a dedicated WebSocket for visualization updates
    const wsVis = new WebSocket('ws://localhost:3000/visualization');

    wsVis.onopen = function() {
        console.log('Visualization WebSocket connection established');
    };

    wsVis.onerror = function(error) {
        console.error('Visualization WebSocket Error:', error);
    };

    wsVis.onclose = function(event) {
        console.log('Visualization WebSocket connection closed', event.code, event.reason);
    };

    wsVis.onmessage = (event) => {
        const csvData = parseCSV(event.data);
        if (csvData.length === 0) return;
        const latestData = csvData[csvData.length - 1];

        // Update targetQuaternion using gyro data (assumed to be in columns 9,10,11: indexes 8,9,10)
        targetQuaternion.setFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(Number(latestData[10])),
            THREE.MathUtils.degToRad(Number(latestData[8])),
            THREE.MathUtils.degToRad(Number(latestData[9])),
            'ZXY'
        ));

        // Update HTML elements (if they exist) with the gyro values
        const gyroXElem = document.getElementById("gyroX");
        const gyroYElem = document.getElementById("gyroY");
        const gyroZElem = document.getElementById("gyroZ");
        if (gyroXElem) gyroXElem.innerHTML = "X: " + latestData[8];
        if (gyroYElem) gyroYElem.innerHTML = "Y: " + latestData[9];
        if (gyroZElem) gyroZElem.innerHTML = "Z: " + latestData[10];

        console.log("Target rotation updated");
    };

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (cansatModel) {
            // Slerp for smooth interpolation
            cansatModel.quaternion.slerp(targetQuaternion, 0.05);
        }
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
}

// Create a dedicated WebSocket connection for visualization updates inside this module

initCanSatVisualization().catch(error => console.error(error));

// CSV parsing function (compatible with both Windows and Linux)
function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}
