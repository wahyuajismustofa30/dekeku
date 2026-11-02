const DEV_HOSTS = ["localhost", "127.0.0.1", "wise-hyena-absolutely.ngrok-free.app"];
const DEV_API = "http://127.0.0.1:8787";
const PROD_API = "https://api.dekeku.my.id";

export function getEnvironment() {
  const host = location.hostname;
  const isDev = DEV_HOSTS.includes(host);
  const urlApi = isDev ? DEV_API : PROD_API;
  return { isDev, urlApi, host };
}
