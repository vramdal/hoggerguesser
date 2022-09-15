export type Feature = {
  type: 'Feature';
  properties: {
    id: number,
    radius: number,
    title: string
  },
  geometry: {
    type: 'Point',
    coordinates: [number, number]
  }

}

export type FeatureCollection = {
  "type": "FeatureCollection",
  "features": Feature[]
}

export type Song = {
  "title": string,
  "places": Array<string>,
  "id": number
}

export type MapMarkerSpec = {
  position: { lng: number; lat: number };
  id: number;
  InfoWindowContent: string;

}
