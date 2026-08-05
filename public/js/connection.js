(() => {
    const { BACKEND_URL, IS_LOCAL } = window.APP_CONFIG || {};

    if (!BACKEND_URL || (!IS_LOCAL && BACKEND_URL.includes('YOUR-RENDER-SERVICE'))) {
        console.error('Укажите адрес Render-сервиса в js/config.js перед production-деплоем');
    }
    console.info(`Socket.IO connecting to ${BACKEND_URL}`);

    const waitingScreen = document.getElementById('connectionWaiting');
    const waitingScreenDelay = 1200;
    let waitingScreenTimer;

    const showWaitingScreen = () => waitingScreen?.classList.remove('is-hidden');
    const hideWaitingScreen = () => {
        clearTimeout(waitingScreenTimer);
        waitingScreen?.classList.add('is-hidden');
    };
    const showWaitingScreenIfConnectionIsSlow = () => {
        clearTimeout(waitingScreenTimer);
        waitingScreenTimer = setTimeout(() => {
            if (!window.socket.connected) {
                showWaitingScreen();
            }
        }, waitingScreenDelay);
    };

    window.socket = io(BACKEND_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    });

    showWaitingScreenIfConnectionIsSlow();
    window.socket.on('connect', hideWaitingScreen);
    window.socket.on('disconnect', showWaitingScreenIfConnectionIsSlow);
    window.socket.on('connect_error', showWaitingScreenIfConnectionIsSlow);
})();
