import gameManager from "../gameManager";
import ioClientManager from "../ioClientManager";

const mobileExperience = {
    
    // Setup selectors

        // Logo
        $logo: document.querySelector('.logo'),
        $logoImage: document.querySelector('.logo > img'),

        // Phase 1
        $phase1Container: document.querySelector('.phase1-gameIntro'),
        $playButton: document.querySelector('.phase1-gameIntro__button'),
        playButtonClicked: false,

        // Phase 2
        $phase2Container: document.querySelector('.phase2-gameSync'),
        $phase2DesktopContainer: document.querySelector('.phase2-gameSync > .show-d'),
        $phase2MobileContainer: document.querySelector('.phase2-gameSync > .show-m'),
        $phase2Input: document.querySelector('.phase2-gameSync__m-input-number'),
        $phase2SubmitBtn: document.querySelector('.phase2-gameSync__m-button'),

        // Phase 3
        $phase3Container: document.querySelector('.phase3-gameCalibration'),
        $phase3DesktopContainer: document.querySelector('.phase3-gameCalibration > .show-d'),
        $phase3MobileContainer: document.querySelector('.phase3-gameCalibration > .show-m'),

        // Phase 4
        $phase4Container: document.querySelector('.phase4-gameLoading'),
        $phase4DesktopContainer: document.querySelector('.phase4-gameLoading > .show-d'),
        $phase4MobileContainer: document.querySelector('.phase4-gameLoading > .show-m'),

        // Phase 5
        $phase5Container: document.querySelector('.phase5-gamePlay'),
        $phase5DesktopContainer: document.querySelector('.phase5-gamePlay > .show-d'),
        $phase5MobileContainer: document.querySelector('.phase5-gamePlay > .show-m'),

    initMobileExperience: () => {
        // Setup the socket
        mobileExperience.socketServer = ioClientManager.getSocket();

        // Setup events
        mobileExperience.initEvents();

        // Setup sockets events
        mobileExperience.setupSocketEvents();
    },

    initEvents: () => {
        mobileExperience.$playButton?.addEventListener('click', mobileExperience.handlePhase1Submit);
    },

    handlePhase1Submit: () => {
        mobileExperience.handleAccelerometerPermission();
        mobileExperience.$playButton?.removeEventListener('click', mobileExperience.handlePhase1Submit);

        // Start Phase 2
        mobileExperience.handlePhase2Start();
    },

    handleAccelerometerPermission: () => {
        
        if ( typeof( DeviceMotionEvent ) !== "undefined" && typeof( DeviceMotionEvent.requestPermission ) === "function" ) {
            // (optional) Do something before API request prompt.
            DeviceMotionEvent.requestPermission()
                .then( response => {
                // (optional) Do something after API prompt dismissed.
                if ( response == "granted" && !mobileExperience.playButtonClicked) {
                    mobileExperience.playButtonClicked = true;
                    
                    window.addEventListener( "devicemotion", mobileExperience.handleDeviceMotionEvent);
                    window.addEventListener( "deviceorientation", mobileExperience.handleDeviceOrientation);
                    
                } else {
                    if (mobileExperience.playButtonClicked) {
                        alert('Redémarrer l\'application pour rejouer');
                    }
                }
            })
                .catch( console.error )
        } else {   
            alert('L\'accéléromètre n\'est pas disponible sur votre appareil');
        }
    },

    // DeviceMotionEvent
    handleDeviceMotionEvent: (event) => {
        // device motion event
        mobileExperience.deviceMotion = event;
    },

    // DeviceOrientationEvent
    handleDeviceOrientation: (event) => {
        // orientation event
        mobileExperience.deviceOrientation = {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma
        }
    },

    setupSocketEvents: () => {
        mobileExperience.socketServer.on('getDesktopData', (data) => {
            if (data.type === 'joinToPhase3' && data.validation) {
                mobileExperience.handlePhase3Start();
            } else

            // Mettre en place le jeu
            if (data.type === 'joinToPhase5' && data.validation) {
                mobileExperience.handlePhase5Start();
            } else

            if (data.type === 'resetShoot' && data.validation) {
                mobileExperience.handleResetShoot();
            }
        });
                    
    },

    handlePhase2Start: () => {

        // Make the logo smaller
        mobileExperience.$logo?.classList.add('logo--small');

        mobileExperience.$phase1Container?.classList.add('hide');
        mobileExperience.$phase2DesktopContainer?.classList.add('hide');
        mobileExperience.$phase2Container?.classList.add('show');
        mobileExperience.$phase2MobileContainer?.classList.add('show');

        // Ce qui se passe quand on clique sur le bouton submit de room
        const handlePhase2Submit = () => {
            mobileExperience.roomNumber = mobileExperience.$phase2Input?.value;
            mobileExperience.socketServer.emit('sendData', {
                type: 'joinToPhase3',
                room: mobileExperience.roomNumber
            });
            
        }

        mobileExperience.$phase2SubmitBtn?.addEventListener('click', handlePhase2Submit);
        
    },

    handlePhase3Start: () => {
        mobileExperience.$phase2Container?.classList.add('hide');
        mobileExperience.$phase3DesktopContainer?.classList.add('hide');
        mobileExperience.$phase3Container?.classList.add('show');
        mobileExperience.$phase3MobileContainer?.classList.add('show');

        // On lance une loop jusqu'à ce que la calibration soit faite
        let isUserCalibrated = false;
        let calibrationTolerance = 10;

        const expectedCalibration = {
            alpha: 330,
            beta: -90,
            gamma: -50
        }

        const calibrationLoop = () => {
            if (!isUserCalibrated) {
                
                // On vérifie si l'utilisateur est calibré à l'axe beta
                if (mobileExperience.deviceOrientation.beta < expectedCalibration.beta + calibrationTolerance && mobileExperience.deviceOrientation.beta > expectedCalibration.beta - calibrationTolerance) {
                    isUserCalibrated = true;
                    
                    // Wait for 5 seconds, if the user is still calibrated, we start the game
                    setTimeout(() => {
                        if (isUserCalibrated) {
                            if (mobileExperience.deviceOrientation.beta < expectedCalibration.beta + calibrationTolerance && mobileExperience.deviceOrientation.beta > expectedCalibration.beta - calibrationTolerance) {
                                // CALIBRATION VALIDE
                                
                                mobileExperience.userCalibration = mobileExperience.deviceOrientation;
                                mobileExperience.handlePhase4Start();
                            } else {
                                isUserCalibrated = false;

                                // On relance la calibration
                                calibrationLoop();
                            }
                        }
                    }, 5000);

                } else {
                    isUserCalibrated = false;
                }

                requestAnimationFrame(calibrationLoop);
                
            } else {
                //
            }

        }

        calibrationLoop();

    },

    handlePhase4Start: () => {
        mobileExperience.$phase3Container?.classList.add('hide');
        mobileExperience.$phase4DesktopContainer?.classList.add('hide');
        mobileExperience.$phase4Container?.classList.add('show');
        mobileExperience.$phase4MobileContainer?.classList.add('show');

        // Lancement de la phase 4 (loading)
        mobileExperience.socketServer.emit('sendData', {
            type: 'joinToPhase4',
            room: mobileExperience.roomNumber
        });

    },

    handlePhase5Start: () => {
        mobileExperience.$phase4Container?.classList.remove('show');
        mobileExperience.$phase4Container?.classList.add('hide');
        mobileExperience.$phase5DesktopContainer?.classList.add('hide');
        mobileExperience.$phase5Container?.classList.add('show');
        mobileExperience.$phase5MobileContainer?.classList.add('show');

        mobileExperience.isDesktopWaiting = true;
        mobileExperience.isShooting = false;
        gameManager.waitForAKick = () => {

            
            if (mobileExperience.isDesktopWaiting) {
                
                if (mobileExperience.deviceMotion.acceleration.x > 20 && !mobileExperience.isShooting) {
                    mobileExperience.isDesktopWaiting = false;
                    mobileExperience.isShooting = true;
                    
                    mobileExperience.socketServer.emit('sendData', {
                        type: 'shootTheBall',
                        room: mobileExperience.roomNumber
                    });

                }
                    
                requestAnimationFrame(gameManager.waitForAKick);
            }
        }

        gameManager.waitForAKick();
        
    },

    handleResetShoot: () => {
        mobileExperience.isDesktopWaiting = true;
        mobileExperience.isShooting = false;
        gameManager.waitForAKick();
    }

}

export default mobileExperience;