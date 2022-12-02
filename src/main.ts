import './style.css'
import io from 'socket.io-client'
import ioClientManager from './managers/ioClientManager';
import experienceManager from './managers/experienceManager';

ioClientManager.initConnection(io);
ioClientManager.initEvents();

// Initialize Experience
experienceManager.initExperience();
