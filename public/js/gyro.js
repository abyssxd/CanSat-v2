import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/MTLLoader.js';


async function initCanSatVisualization() {
    const container = document.getElementById('cansatContainer');

    // Scene setup for the 3d model, controls the colors, lights, camera...etc
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(69, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // Move the camera further back
    camera.position.set(0, 0, 300);
    
    // Look at the center of the scene
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Lighting to make it look cool
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);
    renderer.setClearColor(0xABB8C3); // Set to white or any contrasting color
    let cansatModel;


// Load MTL file
const mtlLoader = new MTLLoader();
mtlLoader.load('models/obj.mtl', function (materials) {
    materials.preload();

    // Load OBJ file
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('models/demo.obj', function (obj) {
        cansatModel = obj;
        scene.add(cansatModel);
        //cansatModel.position.set(-4.5, -10, 0);
    });
});
    
    let targetQuaternion = new THREE.Quaternion();

    ws.onmessage = (event) => {
        const csvData = parseCSV(event.data);
        const latestData = csvData[csvData.length - 1];
    
        targetQuaternion.setFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(Number(latestData[10])),
            THREE.MathUtils.degToRad(Number(latestData[8])),
            THREE.MathUtils.degToRad(Number(latestData[9])),
            'ZXY'
        ));
        
        let gryo_x = latestData[8];
        let gryo_y = latestData[9];
        let gryo_z = latestData[10];

        document.getElementById("gyroX").innerHTML = "X: " + gryo_x;
        document.getElementById("gyroY").innerHTML = "Y: " + gryo_y;
        document.getElementById("gyroZ").innerHTML = "Z: " + gryo_z;
    
        console.log("Target rotation updated"); //Debug
    };
    
function animate() {
    requestAnimationFrame(animate);

    if (cansatModel) {
        // Use slerp (Spherical Linear Interpolation) for a smoother animation
        cansatModel.quaternion.slerp(targetQuaternion, 0.05);
    }

    renderer.render(scene, camera);
}
    animate();
    
}

//Websocket connection ---- START
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = function() {
    console.log('WebSocket connection established');
};

ws.onerror = function(error) {
    console.error('WebSocket Error:', error);
};

ws.onclose = function(event) {
    console.log('WebSocket connection closed', event.code, event.reason);
};
//Websocket connection ---- END


initCanSatVisualization().catch(error => console.error(error));



//Function to parse the CSV & tirm the values. This should work both on windows and linux.
function parseCSV(csvString) {
    const rows = csvString.trim().split(/\r?\n/);
    return rows.map(row => row.split(',').map(cell => cell.trim()));
}
