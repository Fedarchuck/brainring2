(() => {
    const { BACKEND_URL, IS_LOCAL } = window.APP_CONFIG || {};

    if (!BACKEND_URL || (!IS_LOCAL && BACKEND_URL.includes('YOUR-RENDER-SERVICE'))) {
        console.error('Укажите адрес Render-сервиса в js/config.js перед production-деплоем');
    }
    console.info(`Socket.IO connecting to ${BACKEND_URL}`);

    const waitingScreen = document.getElementById('connectionWaiting');
    const showWaitingScreen = () => waitingScreen?.classList.remove('is-hidden');
    const hideWaitingScreen = () => waitingScreen?.classList.add('is-hidden');

    window.socket = io(BACKEND_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
    });

    window.socket.on('connect', hideWaitingScreen);
    window.socket.on('disconnect', showWaitingScreen);
    window.socket.on('connect_error', showWaitingScreen);
})();
