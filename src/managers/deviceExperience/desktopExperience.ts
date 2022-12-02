import ioClientManager from "../ioClientManager";
import gameManager from "../gameManager";

import soundAmbiance from "../../assets/mp3/ambiance.mp3";

const desktopExperience = {

    // Setup selectors

        // Logo
        $logo: document.querySelector('.logo'),
        $logoImage: document.querySelector('.logo > img'),
        $logoGlow: document.querySelector('.logo > .glow-img'),


        // Phase 1
        $phase1Container: document.querySelector('.phase1-gameIntro'),
        $playButton: document.querySelector('.phase1-gameIntro__button'),
        playButtonClicked: false,

        // Phase 2
        $phase2Container: document.querySelector('.phase2-gameSync'),
        $numberSyncDesktop: document.querySelector('.d-numberSyncer'),

        // Phase 3
        $phase3Container: document.querySelector('.phase3-gameCalibration'),

        // Phase 4
        $phase4Container: document.querySelector('.phase4-gameLoading'),

        // Phase 5
        $phase5Container: document.querySelector('.phase5-gamePlay'),

    initDesktopExperience: () => {

        // Setup the socket room
        desktopExperience.socketServer = ioClientManager.getSocket();
        desktopExperience.setupSocketRoom();

        // Setup events
        desktopExperience.initEvents();

        // Setup soundManager
        desktopExperience.setupSoundManager();
    },

    initEvents: () => {
        desktopExperience.$playButton?.addEventListener('click', desktopExperience.handlePhase1Submit);

        // To Start Phase 3
        desktopExperience.socketServer.on('startPhasethree', () => {
            
            desktopExperience.handlePhase3Start();
        });

    },

    setupSocketRoom: () => {

        // Setup a 2 digit random room number
        const roomNumber = Math.floor(Math.random() * 100);
        desktopExperience.socketServer.emit('joinRoom', roomNumber);

        desktopExperience.socketServer.on('newRoom', (roomNumber) => {
            desktopExperience.$numberSyncDesktop.innerHTML = roomNumber;
            desktopExperience.roomNumber = roomNumber;
        });

        desktopExperience.socketServer.on('sendPhoneData', (data) => {``
            // Go to Phase 3
            if (data.type === 'joinToPhase3' && parseInt(data.room) === desktopExperience.roomNumber) {
                desktopExperience.handlePhase3Start();
                // On envoie un message au mobile pour lui dire qu'on est prêt à passer à la phase 3
                desktopExperience.socketServer.emit('sendDesktopData', {
                    type: 'joinToPhase3',
                    validation: true,
                    room: desktopExperience.roomNumber.toString()
                })
            } else

            // Go to Phase 4
            if (data.type === 'joinToPhase4' && parseInt(data.room) === desktopExperience.roomNumber) {
                desktopExperience.handlePhase4Start();
            } else

            if (data.type === 'shootTheBall' && parseInt(data.room) === desktopExperience.roomNumber) {
                gameManager.shootTheBall();
            }
                
        });
        
    },


    // Setup events
    handlePhase1Submit: () => {

        // Show phase 2
        desktopExperience.$phase1Container?.classList.add('hide');

        setTimeout(() => {
            desktopExperience.$logo?.classList.add('logo--small');
            desktopExperience.$phase2Container?.classList.add('show');
        }, 250);
        
    },

    handlePhase3Start: () => {

        // Hide phase 2
        desktopExperience.$phase2Container?.classList.add('hide');

        // Show phase 3
        desktopExperience.$phase3Container?.classList.add('show');
    },

    handlePhase4Start: () => {

        // Hide phase 3
        desktopExperience.$phase3Container?.classList.add('hide');

        // Show phase 4
        desktopExperience.$phase4Container?.classList.add('show');

        // Start the game
        setTimeout(() => {
            desktopExperience.handlePhase5Start();
        }, 3000);
    },

    handlePhase5Start: () => {

        // Hide logo glow
        desktopExperience.$logoGlow?.classList.add('hide');
        desktopExperience.$logo?.classList.add('logo--phase5');

        // Hide phase 4
        desktopExperience.$phase4Container?.classList.add('hide');

        // Show phase 5
        desktopExperience.$phase5Container?.classList.add('show');

        // Tell the phone to start the game
        desktopExperience.socketServer.emit('sendDesktopData', {
            type: 'joinToPhase5',
            validation: true,
            room: desktopExperience.roomNumber.toString()
        });

        // Start the game and display WebGL canvas
        gameManager.initWebGL();

    },

    setupSoundManager: () => {
        // Setup sounds

        // Setup the ambiance sound
        desktopExperience.soundAmbiance = new Audio(soundAmbiance);
        desktopExperience.soundAmbiance.loop = true;
        desktopExperience.soundAmbiance.volume = 0.5;

        window.addEventListener('click', () => {
            desktopExperience.soundAmbiance.play();
        });


    },

    resetShoot: () => {
        desktopExperience.socketServer.emit('sendDesktopData', {
            type: 'resetShoot',
            validation: true,
            room: desktopExperience.roomNumber.toString()
        });
    }
}

export default desktopExperience;