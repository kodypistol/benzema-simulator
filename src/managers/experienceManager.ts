import ioClientManager from "./ioClientManager";
import gameManager from "./gameManager";
import isMobile from "./utils/isMobile";
import desktopExperience from "./deviceExperience/desktopExperience";
import mobileExperience from "./deviceExperience/mobileExperience";

const experienceManager = {

    initExperience: () => {

        /** ***** DEV DEBUG */
        
        const devBtn = document.querySelector('#show-canvas');
        if (devBtn) {
            gameManager.initWebGL();

            document.querySelector('.phase1-gameIntro')?.classList.add('hide');
            document.querySelector('.phase5-gamePlay')?.classList.add('show');
        }

        if (isMobile.isMobileOrDesktop()) {
            mobileExperience.initMobileExperience();
        } else {
            desktopExperience.initDesktopExperience();
        }
    }
        
}

export default experienceManager;