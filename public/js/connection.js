(() => {
    const { BACKEND_URL, IS_LOCAL } = window.APP_CONFIG || {};

    if (!BACKEND_URL || (!IS_LOCAL && BACKEND_URL.includes('YOUR-RENDER-SERVICE'))) {
        console.error('Укажите адрес Render-сервиса в js/config.js перед production-деплоем');
    }
    console.info(`Socket.IO connecting to ${BACKEND_URL}`);

    const waitingScreen = document.getElementById('connectionWaiting');
    const waitingScreenDelay = 1200;
    const connectionStorageKey = 'brainRingServerConnected';
    let hasConnectedThisSession = sessionStorage.getItem(connectionStorageKey) === 'true';
    let waitingScreenTimer;

    const showWaitingScreen = () => waitingScreen?.classList.remove('is-hidden');
    const hideWaitingScreen = () => {
        clearTimeout(waitingScreenTimer);
        waitingScreen?.classList.add('is-hidden');
    };
    const showWaitingScreenForFirstConnection = () => {
        if (hasConnectedThisSession) {
            return;
        }

        clearTimeout(waitingScreenTimer);
        waitingScreenTimer = setTimeout(() => {
            if (!window.socket.connected) {
                showWaitingScreen();
            }
        }, waitingScreenDelay);
    };
    const markConnectionAsReady = () => {
        hasConnectedThisSession = true;
        sessionStorage.setItem(connectionStorageKey, 'true');
        hideWaitingScreen();
    };

    window.socket = io(BACKEND_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    });

    showWaitingScreenForFirstConnection();
    window.socket.on('connect', markConnectionAsReady);
    window.socket.on('connect_error', showWaitingScreenForFirstConnection);
})();
