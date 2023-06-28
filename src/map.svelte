<script>
  import { onMount } from "svelte";

  import { currentLocation } from "./geolocation.js";

  let id = 'guell';
  let ipfsUrl = 'ipfs://QmVTQRLa49XUvuCTy3UqvhAV1UTkFqhEnWM5YdNqXjfj5E';
  let json;
  let error;

  let greenIcon;
  let map;
  let mapContainer;

  let myMarker;

  $: mapContainer, setMap();
  $: json || map || $currentLocation, calDistances();
  $: $currentLocation || map, setMyMarker();

  const getCid = url => {
    let [cId, ...path] = url.replace('ipfs://', '').split('/');
    if (path.length) {
      path.unshift('');
      path = path.join('/');
    }
    return { cId, path };
  }

  const getIPFSUrl = async (cId, path) => {
    const urls = [
      `${ import.meta.env.VITE_GATEWAY }/ipfs/${ cId }${ path || '' }`,
      `https://gateway.pinata.cloud/ipfs/${ cId }${ path || '' }`,
      `https://ipfs.io/ipfs/${ cId }${ path || '' }`,
      `https://gateway.ipfs.io/ipfs/${ cId }${ path || '' }`,
      `https://cloudflare-ipfs.com/ipfs/${ cId }${ path || '' }`,
      `https://ipfs.fleek.co/ipfs/${ cId }${ path || '' }`
    ]

    const opts = { method: 'HEAD' };
    for (const url of urls) {
      try {
        const resp = await fetch(url, opts);
        if (resp.ok) {
          return url;
        }
      } catch {}
    }
  }

  const setMap = () => {
    if (mapContainer) {
      greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      map = L.map(`${ id }-map-container`);
      map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>');
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      const markers = [];
      for (const point of json) {
        const marker = L.marker([point.geometry.coordinates[1], point.geometry.coordinates[0]]).bindPopup(point.properties.title).addTo(map);
          markers.push(marker);
      }
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds());
    }
  }

  const setMyMarker = () => {
    if ($currentLocation && map) {
      if (!myMarker) {
        myMarker = L.marker([$currentLocation.lat, $currentLocation.lon], { icon: greenIcon }).bindPopup('You').addTo(map);
      } else {
        myMarker.setLatLng(new L.LatLng($currentLocation.lat, $currentLocation.lon));
      }
    }
  }

  const calDistances = () => {
    if (json && map && $currentLocation) {
      let points = [];
      for (const feature of json) {
        points.push({
          distance: map.distance(
            L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]),
            L.latLng($currentLocation.lat, $currentLocation.lon)
          ),
          feature
        });
      }
      const sorted = points.sort((a, b) => a.distance - b.distance);
      if (sorted[0].distance < 3 && 'speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(sorted[0].feature.properties.title));
      }
    }
  }

  const init = async () => {
    const { cId, path } = getCid(ipfsUrl);
    const url = await getIPFSUrl(cId, path);
    try {
      const resp = await fetch(url);
      const rjson = await resp.json();
      if (resp.ok) {
        json = rjson;
        currentLocation.init();
      } else {
        error = rjson;
      }
    } catch (err) {
      error = err
    }
  }

  onMount(init)
</script>

<svelte:head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
</svelte:head>

{#if json}
  <div id="{ id }-map-container" class="w-full h-full" bind:this={ mapContainer }>
    &nbsp;
  </div>
{:else if error}
  <div class="alert alert-error">
    <i class="fa-regular fa-circle-xmark"></i>
    <span>{ JSON.stringify(error) }</span>
  </div>
{/if}
