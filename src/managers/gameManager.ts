import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CannonDebugRenderer from './utils/CannonDebugRenderer';
import desktopExperience from './deviceExperience/desktopExperience';

import lottie from 'lottie-web';


const gameManager = {
    initWebGL: () => {

        // Init WebGL Canvas
        const canvas = document.querySelector('#webgl');

        // Init WebGL Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: true,
            alpha: true
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Setup scene
        gameManager.scene = new THREE.Scene();


        // Fog
        const fog = new THREE.Fog(0x000000, 0, 10000);
        gameManager.scene.fog = fog;

        // Setup camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(0, 3, -4);
        camera.lookAt(0, 0, -10);
        

        // Setup Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        gameManager.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 0);
        gameManager.scene.add(directionalLight);

        // Setup Shadows
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;


        // Load GLTF
        let arrow;
        const loader = new GLTFLoader();
        loader.load(
            // resource URL
            '../models/arrow.glb',
            (gltf) => {
                
                // Set the anchor point to the bottom of the arrow
                arrow = gltf.scene;
                arrow.position.z = -9;
                arrow.position.y = 0;

                arrow.name = 'arrow';

                gameManager.scene.add(arrow);
            }
        );

        let ball;
        loader.load(
            '../models/ball.glb',
            (gltf) => {
                ball = gltf.scene;
                ball.position.x = -0.1
                ball.position.y = 2
                ball.position.z = -6.42
                ball.scale.set(
                    0.4,
                    0.4,
                    0.4
                )

                // Manage shadows
                ball.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                ball.name = 'ball';

                gameManager.scene.add(ball);


            }
        );

        let goal; 
        loader.load(
            '../models/goal.glb',
            (gltf) => {
                goal = gltf.scene;
                goal.position.y = -0.7
                goal.position.z = -13.5
                goal.scale.set(
                    0.8,
                    0.8,
                    0.8
                )

                // Manage shadows
                goal.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                goal.name = 'goal';

                gameManager.scene.add(goal);
            }
        );

        let stadium;
        loader.load(
            '../models/stadium.glb',
            (gltf) => {
                stadium = gltf.scene;
                stadium.position.y = -15
                stadium.position.z = 20
                stadium.rotation.y = Math.PI / 2
                stadium.scale.set(
                    0.4,
                    0.4,
                    0.4
                );
                
                gameManager.scene.add(stadium);

                const floor = stadium.children[0].children[0].children[0].getObjectByName('Plane');

                // apply texture to floor
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load('../models/textures/stadium.png');

                const material = new THREE.MeshStandardMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                });

                // traverse the floor to find the mesh which name is Plane_Material098_0
                floor.traverse((child) => {
                    if (child.name === 'Plane_Material098_0') {
                        child.material = material;
                    } else {
                        child.material = new THREE.MeshBasicMaterial({
                            color: 0x00ff00,
                            side: THREE.DoubleSide,
                        });
                    }
                });

            }
        );

        // Setup Skybox

        // Setup textures in the right order
        const front = new THREE.TextureLoader().load('../models/textures/skybox_ft.png');
        const back = new THREE.TextureLoader().load('../models/textures/skybox_bk.png');
        const left = new THREE.TextureLoader().load('../models/textures/skybox_lt.png');
        const right = new THREE.TextureLoader().load('../models/textures/skybox_rt.png');
        const top = new THREE.TextureLoader().load('../models/textures/skybox_up.png');
        const bottom = new THREE.TextureLoader().load('../models/textures/skybox_dn.png');

        // Setup the skybox faces
        const materials = [
            new THREE.MeshBasicMaterial({ map: right, side: THREE.DoubleSide }),
            new THREE.MeshBasicMaterial({ map: left, side: THREE.DoubleSide }),
            new THREE.MeshBasicMaterial({ map: top, side: THREE.DoubleSide }),
            new THREE.MeshBasicMaterial({ map: bottom, side: THREE.DoubleSide }),
            new THREE.MeshBasicMaterial({ map: front, side: THREE.DoubleSide }),
            new THREE.MeshBasicMaterial({ map: back, side: THREE.DoubleSide })
        ];

        // Setup the skybox
        const skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
        const skybox = new THREE.Mesh(skyboxGeometry, materials);
        skybox.rotation.y = (Math.PI * 2) * (1 / 2);
        gameManager.scene.add(skybox);


        // Setup Cannon.js World
        gameManager.world = new CANNON.World();
        gameManager.world.gravity.set(0, -9.80665, 0);

        // Setup Cannon.js Plane, make it static but the ball can bounce on it
        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({
            mass: 0,
            shape: planeShape,
            material: new CANNON.Material()
        });
        planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        gameManager.world.addBody(planeBody);

        // Setup Cannon.js Goal 
        const topBarGoalShape = new CANNON.Box(new CANNON.Vec3(3, 0.2, 0.5));
        const topBarGoalBody = new CANNON.Body({
            mass: 0,
            shape: topBarGoalShape,
            material: new CANNON.Material()
        });
        topBarGoalBody.position.set(0, 1.8, -13.5);
        gameManager.world.addBody(topBarGoalBody);

        const leftBarGoalShape = new CANNON.Box(new CANNON.Vec3(0.2, 1.8, 0.5));
        const leftBarGoalBody = new CANNON.Body({
            mass: 0,
            shape: leftBarGoalShape,
            material: new CANNON.Material()
        });
        leftBarGoalBody.position.set(-3, 0, -13.5);
        gameManager.world.addBody(leftBarGoalBody);

        const rightBarGoalShape = new CANNON.Box(new CANNON.Vec3(0.2, 1.8, 0.5));
        const rightBarGoalBody = new CANNON.Body({
            mass: 0,
            shape: rightBarGoalShape,
            material: new CANNON.Material()
        });
        rightBarGoalBody.position.set(3, 0, -13.5);
        gameManager.world.addBody(rightBarGoalBody);

        const netGoalShape = new CANNON.Box(new CANNON.Vec3(3, 0.8, 0.5));
        const netGoalBody = new CANNON.Body({
            mass: 0,
            shape: netGoalShape,
            material: new CANNON.Material()
        });
        netGoalBody.position.set(0, 0, -14.5);
        gameManager.world.addBody(netGoalBody);


        // Setup Cannon.js Ball
        const ballShape = new CANNON.Sphere(0.1);
        const ballBody = new CANNON.Body({
            mass: 1,
            shape: ballShape,
            material: new CANNON.Material()
        });

        // add a name
        ballBody.name = 'ball';
        ballBody.position.set(-0.1, 2, -6.42);
        gameManager.world.addBody(ballBody);

        // Transform ballBody into a reference to be used anywhere
        ball = ballBody;

        window.addEventListener('click', () => {
            // Get the direction of the arrow
            const direction = new THREE.Vector3();
            arrow.getWorldDirection(direction);

            // Apply force to the ball in the direction of the arrow, with a huge force but do not make it spin
            ballBody.applyForce(direction.multiplyScalar(-1000), new CANNON.Vec3(0, 0, 0));
            // Impulse a little force on the bottom of the ball to make it bounce
            ballBody.applyImpulse(new CANNON.Vec3(0, 4, 0), new CANNON.Vec3(0, 0, 0));

        });

        // Render Loop
        let oldElapsedTime = 0;

        const clock = new THREE.Clock();

        // Global variables
        gameManager.isGoalShot = false;

        const render = () => {
            requestAnimationFrame(render);

            const time = clock.getElapsedTime();
            
            const deltaTime = time - oldElapsedTime;
            oldElapsedTime = time;

            if (arrow) {
                arrow.rotation.y = Math.sin(time) * Math.PI / 4;
                arrow.scale.set(
                    1,
                    1,
                    Math.sin(time / 500) * 0.2 + 1
                )
            }

            // Update Shadows
            renderer.shadowMap.needsUpdate = true;

            // Update Cannon.js World
            gameManager.world.step(1 / 60, deltaTime, 3)

            // Update Three.js Meshes
            if (ball) {
                ball.position.copy(ballBody.position);
                ball.quaternion.copy(ballBody.quaternion);
            }

            
            // Check if ball is in goal
            if (ballBody.position.x > -2.6
                && ballBody.position.x < 2.6
                 && ballBody.position.z > -14 
                 && ballBody.position.z < -13
                 && !gameManager.isGoalShot) {
                gameManager.isGoalShot = true;
                gameManager.playCelebration();
            }

            // If the ball is behind the goal, reset its force and position
            if (ballBody.position.z < -30 
                || ballBody.position.z > 10 
                || ballBody.position.x < -10 
                || ballBody.position.x > 10) {
                ballBody.velocity.set(0, 0, 0);
                ballBody.angularVelocity.set(0, 0, 0);
                ballBody.position.set(-0.1, 2, -6.42);
                desktopExperience.resetShoot();
            }
                
            // Make the camera look at the goal
            if (goal) {
                camera.lookAt(goal.position);
            }

            
            // Render ThreeJS
            renderer.render(gameManager.scene, camera);


        }
        render();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        

        
    },

    shootTheBall: function() {
        // Get the direction of the arrow
        const direction = new THREE.Vector3();

        // Get the arrow in the scene
        const arrow = gameManager.scene.getObjectByName('arrow');

        // Get the direction of the arrow
        arrow.getWorldDirection(direction);

        // get the ballbody in the Cannon.js world
        const ballBody = gameManager.world.bodies.find(body => body.name === 'ball');
        
        // Apply force to the ball in the direction of the arrow, with a huge force but do not make it spin
        ballBody.applyForce(direction.multiplyScalar(-1000), new CANNON.Vec3(0, 0, 0));
        // Impulse a little force on the bottom of the ball to make it bounce
        ballBody.applyImpulse(new CANNON.Vec3(0, 4, 0), new CANNON.Vec3(0, 0, 0));
        
    },

    resetBall: function() {
        // get the ballbody in the Cannon.js world
        const ballBody = gameManager.world.bodies.find(body => body.name === 'ball');

        // Reset the ball position
        ballBody.position.set(-0.1, 2, -6.42);

        // Reset the ball velocity
        ballBody.velocity.set(0, 0, 0);

        // Reset the ball angular velocity
        ballBody.angularVelocity.set(0, 0, 0);

    },

    playCelebration: function() {

        // Create a lottie animation
        const lottieAnimationContainer = document.createElement('div');
        lottieAnimationContainer.style.position = 'absolute';
        lottieAnimationContainer.style.top = '0';
        lottieAnimationContainer.style.left = '0';
        lottieAnimationContainer.style.width = '100%';
        lottieAnimationContainer.style.height = '100%';
        lottieAnimationContainer.style.zIndex = '1000';
        document.body.appendChild(lottieAnimationContainer);

        // Load the animation
        const lottieAnimation = lottie.loadAnimation({
            container: lottieAnimationContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: '/assets/animations/goalAnimation.json'
        });

        // Play the animation
        lottieAnimation.play();

        // Remove the animation when it is finished
        lottieAnimation.addEventListener('complete', () => {
            lottieAnimationContainer.remove();
        });

        // Play a video on all the screen with api
        const video = document.createElement('video');
        video.src = '/assets/mp4/celebration.mp4';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '100';
        video.autoplay = true;
        video.loop = false;

        document.body.appendChild(video);

        // When the video is finished, remove it from the dom
        video.addEventListener('ended', () => {
            video.remove();
            gameManager.isGoalShot = false;
            gameManager.resetBall();
            desktopExperience.resetShoot();
        });
    }

}

export default gameManager;