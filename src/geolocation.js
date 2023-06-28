import { writable } from "svelte/store";

const createLocationStore = () => {
  let id;
  const { subscribe, set } = writable({ lat: 0, lon: 0, acc: 0 });

  const success = pos => {
    set({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy });
  }

  const error = err => { set(err) }

  const init = userOpts => {
    const defautOpts = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    id = navigator.geolocation.watchPosition(success, error, Object.assign({}, defautOpts, userOpts));
  }

  const close = () => { navigator.geolocation.clearWatch(id) }

  return { subscribe, init, close }
}
export const currentLocation = createLocationStore();