import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/MTLLoader.js';

// Load Configurations
async function loadConfig(path) {
    try {
        const response = await fetch(path);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}

async function initCanSatVisualization() {
    const [gyroConfig, csvFields] = await Promise.all([
        loadConfig('../config/gyroscopeModel.json'),
        loadConfig('../config/csvFields.json')
    ]);

    if (!gyroConfig || !gyroConfig.enabled) {
        console.warn("Gyroscope model is disabled in configuration.");
        return;
    }

    if (!csvFields || !csvFields.fields) {
        console.error("Error: CSV fields configuration missing or invalid.");
        return;
    }

    // Find column indexes for gyroscope values dynamically
    const gyroIndexes = {
        x: csvFields.fields.findIndex(f => f.name.toLowerCase() === 'gyro_x'),
        y: csvFields.fields.findIndex(f => f.name.toLowerCase() === 'gyro_y'),
        z: csvFields.fields.findIndex(f => f.name.toLowerCase() === 'gyro_z')
    };

    if (gyroIndexes.x === -1 || gyroIndexes.y === -1 || gyroIndexes.z === -1) {
        console.error("Gyroscope fields not found in CSV configuration.");
        return;
    }

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
    renderer.setClearColor(0x121212); // Dark theme
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

    // Load the model using MTL and OBJ loaders from config
    const mtlLoader = new MTLLoader();
    mtlLoader.load(gyroConfig.materialPath, function (materials) {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(gyroConfig.modelPath, function (obj) {
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

        // Ensure valid gyro data exists
        if (!latestData[gyroIndexes.x] || !latestData[gyroIndexes.y] || !latestData[gyroIndexes.z]) {
            console.warn("Invalid gyroscope data received.");
            return;
        }

        // Update targetQuaternion using gyro data
        targetQuaternion.setFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(Number(latestData[gyroIndexes.z])),
            THREE.MathUtils.degToRad(Number(latestData[gyroIndexes.x])),
            THREE.MathUtils.degToRad(Number(latestData[gyroIndexes.y])),
            'ZXY'
        ));

        // Update HTML elements with gyro values if they exist
        const gyroXElem = document.getElementById("gyroX");
        if (gyroXElem) {
            gyroXElem.textContent = "X: " + latestData[gyroIndexes.x];
        }
        const gyroYElem = document.getElementById("gyroY");
        if (gyroYElem) {
            gyroYElem.textContent = "Y: " + latestData[gyroIndexes.y];
        }
        const gyroZElem = document.getElementById("gyroZ");
        if (gyroZElem) {
            gyroZElem.textContent = "Z: " + latestData[gyroIndexes.z];
        }

        console.log("Target rotation updated");
    };

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (cansatModel) {
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

// Initialize the visualization
initCanSatVisualization().catch(error => console.error(error));

// CSV parsing function (compatible with both Windows and Linux)
function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}
