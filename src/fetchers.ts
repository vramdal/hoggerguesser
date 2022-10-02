import { httpFetch } from "./browser";

export const loadSongs = () => {
  let dataSourceUrl = "/hvor-i-vazelina/data/songs.json"; // "https://script.google.com/macros/s/AKfycbzQAduClf9OCizvJijFakTd5T1rptkcA3hTShnkkDVXTxHGD9Bbi1gBT9SuFDRtWLTi/exec?data=songs";
  return httpFetch(dataSourceUrl).then(res => res.json());
  // return Promise.resolve([]);
}
export const loadMapFeatures = () => {
  const geoJsonUrl = "/hvor-i-vazelina/data/geo.json";
  // return Promise.resolve([]);
  return httpFetch(geoJsonUrl).then(response => response.json())
    .then(data => data.features);
}
