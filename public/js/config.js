/*
 * Адрес Render задаётся один раз перед первым production-деплоем.
 * При работе с localhost этот адрес не используется: frontend сам
 * подключается к локальному серверу на порту 3000.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const isLocalEnvironment = LOCAL_HOSTS.has(window.location.hostname);
const localBackendUrl = `http://${window.location.hostname}:3000`;
const productionBackendUrl = 'https://brainring2.onrender.com';

window.APP_CONFIG = {
    BACKEND_URL: isLocalEnvironment ? localBackendUrl : productionBackendUrl,
    IS_LOCAL: isLocalEnvironment
};
