
type ioClientManagerType = {
    initConnection: (io: any) => void;
    initEvents: () => void;
    getSocket: () => any;
    server: any;
};

const ioClientManager: ioClientManagerType = {
    initConnection: (io): void => {
            ioClientManager.server = io('https://all-suits-guess-77-159-232-106.loca.lt');
    },

    initEvents: (): void => {
//

    },

    getSocket: (): any => {
        return ioClientManager.server;
    }

}

export default ioClientManager;