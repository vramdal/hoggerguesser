import { Song } from "./types";

export const httpFetch : typeof fetch = (url: RequestInfo | URL, options: RequestInit | undefined) => {
  return fetch(url, options);
};

export function shuffle(songsWithPlaces: Song[]) {
  return [...songsWithPlaces].sort(() => Math.random() - 0.5);
}
