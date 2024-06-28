//Fernando Henrique Velame Nicchio RA197003
// Daniele Souza Gonçalves RA248029
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/PointerLockControls.js';

const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraControl = new OrbitControls(camera, renderer.domElement);
const controls = new PointerLockControls(camera, document.body);

let planetMaterials = [];
let planets = [];
let orbitSpeeds = [];
let sunLight;

function setupRenderer() {
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function setupCamera() {
    camera.position.set(50, 20, 50);
    camera.lookAt(scene.position);
}

//function setupControls() {
//    cameraControl.enablePan = false;
//}
function setupControls() {
    document.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        console.log('Pointer locked');
    });

    controls.addEventListener('unlock', () => {
        console.log('Pointer unlocked');
    });
}

function loadTextures() {
    return new Promise((resolve, reject) => {
        const texturePath = "../Assets/Textures/solarSystem/2k-images/";
        const planetTextures = [
            "2k_mercury.jpg",
            "2k_venus_surface.jpg",
            "2k_earth_daymap.jpg",
            "2k_mars.jpg",
            "2k_jupiter.jpg",
            "2k_saturn.jpg",
            "2k_uranus.jpg",
            "2k_neptune.jpg"
        ];
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setPath(texturePath);

        let loadedTexturesCount = 0;
        for (let i = 0; i < planetTextures.length; i++) {
            textureLoader.load(planetTextures[i], (texture) => {
                planetMaterials.push(new THREE.MeshPhongMaterial({ map: texture }));
                loadedTexturesCount++;
                if (loadedTexturesCount === planetTextures.length) {
                    resolve(); // carregando as texturas
                }
            }, undefined, (err) => {
                reject(err); // caso de erro na textura
            });
        }
    });
}

function createPlanets() {
    const planetRadiusScale = [
        0.383,  // Mercury
        0.95,   // Venus
        1,      // Earth
        0.532,  // Mars
        11.21,  // Jupiter
        9.45,   // Saturn
        3.98,   // Uranus
        3.86    // Neptune
    ];

    const orbitRadius = [
        55,     // Mercury
        60,     // Venus
        70,     // Earth
        85,     // Mars
        100,     // Jupiter
        130,     // Saturn
        150,     // Uranus
        180      // Neptune
    ];

    const orbitSpeed = [
        0.0048,   // Mercury
        0.0035,   // Venus
        0.0029,   // Earth
        0.0024,  // Mars
        0.0017,  // Jupiter
        0.0013,  // Saturn
        0.0006, // Uranus
        0.0005  // Neptune
    ];

    for (let i = 0; i < planetRadiusScale.length; i++) {
        const geometry = new THREE.SphereGeometry(planetRadiusScale[i], 32, 32);
        const material = planetMaterials[i];
        const planet = new THREE.Mesh(geometry, material);

        planet.userData = { orbitRadius: orbitRadius[i], angle: 0, speed: orbitSpeed[i] };

        planets.push(planet);
        scene.add(planet);

        // Adiciona o anel de Saturno
        if (i === 5) { // Saturno
            const saturnRingTexture = new THREE.TextureLoader().load("../Assets/Textures/solarSystem/2k-images/2k_saturn_ring_alpha.png");
            const saturnRingGeometry = new THREE.RingGeometry(planetRadiusScale[i] * 1.5, planetRadiusScale[i] * 2, 64);
            const saturnRingMaterial = new THREE.MeshBasicMaterial({ map: saturnRingTexture, side: THREE.DoubleSide, transparent: true });
            const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
            saturnRing.rotation.x = Math.PI / 2; // Alinha o anel 
            saturnRing.userData = planet.userData; // Liga o anel a orbita de Saturno
            planet.add(saturnRing); // Liga o anel à saturno
        }
    }

    
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunTexture = new THREE.TextureLoader().load("../Assets/Textures/solarSystem/2k-images/2k_sun.jpg");
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Iluminação vinda do sol
    sunLight = new THREE.PointLight(0xffffff, 2, 500);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
}

function setupLights() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

    // Sunlight
    //const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    //directionalLight.position.set(3, 3, 3).normalize();
    //scene.add(directionalLight);
}

function setupBackground() {
    // Carrega a textura do fundo
    const path = "../Assets/Textures/Cubemaps/Space/blue/";
    const textCubeMap = [
        path + "bkg1_right.png",
        path + "bkg1_left.png",
        path + "bkg1_top.png",
        path + "bkg1_bot.png",
        path + "bkg1_front.png",
        path + "bkg1_back.png"
    ];

    const textureCube = new THREE.CubeTextureLoader().load(textCubeMap);
    scene.background = textureCube;
}

function render() {
    cameraControl.update();

    // Roda todos os planetas e atualiza a sua posição
    for (let planet of planets) {
        planet.rotation.y += 0.001;
        planet.userData.angle += planet.userData.speed;
        planet.position.set(
            Math.cos(planet.userData.angle) * planet.userData.orbitRadius,
            0,
            Math.sin(planet.userData.angle) * planet.userData.orbitRadius
        );
    }

    // Atualiza a posição do anel de Saturno
    const saturnRing = scene.children.find(child => child.geometry && child.geometry.type === 'RingGeometry');
    if (saturnRing) {
        saturnRing.position.set(
            Math.cos(saturnRing.userData.angle) * saturnRing.userData.orbitRadius,
            0,
            Math.sin(saturnRing.userData.angle) * saturnRing.userData.orbitRadius
        );
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function main() {
    setupRenderer();
    setupCamera();
    setupControls();

    try {
        await loadTextures(); 
        createSun(); 
        createPlanets();
        setupLights();
        setupBackground();
        render(); 
    } catch (error) {
        console.error("Error during initialization:", error);
    }

    window.addEventListener('resize', onWindowResize, false);
}

main();
