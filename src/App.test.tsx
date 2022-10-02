import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

/**
 * NB! Testene må kjøres med  --transformIgnorePatterns \"node_modules/(?!ui-core)/\" --env=jsdom
 */

jest.setTimeout(30000);

// const mockLoadMapFeatures = jest.fn().mockReturnValue(geo.features);
// const mockLoadSongs = jest.fn().mockReturnValue(songs);

// const loadMapFeaturesSpy = jest.spyOn(fetchers, "loadMapFeatures").mockResolvedValue(geo.features);
// const loadSongsSpy = jest.spyOn(fetchers, "loadSongs").mockResolvedValue(songs);

jest.mock('react-leaflet', () => {
  return {
    Map: jest.requireActual('react-leaflet').Map,
    TileLayer: jest.requireActual('react-leaflet').TileLayer,
    // Marker: (props: {children: any}) => <div data-testid="marker" >{props.children}</div>,
    Marker: jest.requireActual('react-leaflet').Marker,
    Popup: jest.requireActual('react-leaflet').Popup,
    // Popup: (props: {children: any}) => <div data-testid="popup" >{props.children}</div>,
    MapContainer: jest.requireActual('react-leaflet').MapContainer,
    useMap: jest.requireActual('react-leaflet').useMap,
    Tooltip: jest.requireActual('react-leaflet').Tooltip,
  };
})

const fetchTracker = jest.fn();

const createResponse = (id: string, json: object) => {
  return Promise.resolve({
    json: () => {
      fetchTracker(id);
      return json;
    }
  })
}

const mockResponses : {[key: string] : ReturnType<typeof createResponse>} = {
  "/hvor-i-vazelina/data/songs.json": createResponse("/hvor-i-vazelina/data/songs.json", require("../public/data/songs.json")),
  "/hvor-i-vazelina/data/geo.json": createResponse("/hvor-i-vazelina/data/geo.json", require("../public/data/geo.json")),
  "/hvor-i-vazelina/timestamp.json": createResponse("/hvor-i-vazelina/timestamp.json", {timestamp: "2021-05-01T12:00:00.000Z"}),
};

jest.mock('./browser', () => {

  return {
    httpFetch: (url: string) => {
      return mockResponses[url];
    },
    shuffle: (array: any[]) => {
      return [...array];
    }
  }
});

async function startGame() {
  await render(<App mode={"game"}/>);
  await screen.findByText(/Hvor godt kjenner du Vazelina-geografien\?/i);
  const startButton = screen.getByRole("button", {name: /start/i});
  fireEvent.click(startButton);
  expect(screen.getByText(/Hvilken sang er dette\?/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(fetchTracker).toHaveBeenCalledWith("/hvor-i-vazelina/timestamp.json");
  })
}

test('answer incorrectly', async () => {
  await startGame();
  const incorrectButton = screen.getByRole("button", {name: /11 år uten kvinnfolk/i});
  fireEvent.click(incorrectButton);
  const resultDialog = screen.getByRole("alert");
  expect(within(resultDialog).getByRole("heading", {name: "Feil"})).toBeInTheDocument();
  const coloredIncorrectButton = screen.getByRole("button", {name: /11 år uten kvinnfolk/i});
  expect(coloredIncorrectButton).toHaveClass("wrong");

});

test('answer correctly', async () => {
  await startGame();
  const correctButton = screen.getByRole("button", {name: /Bedre hell æll medesin/i});
  fireEvent.click(correctButton);
  const resultDialog = screen.getByRole("alert");
  expect(within(resultDialog).getByRole("heading", {name: "Riktig"})).toBeInTheDocument();
  const coloredCorrectButton = screen.getByRole("button", {name: /Bedre hell æll medesin/i});
  expect(coloredCorrectButton).toHaveClass("correct");

});

test('answer correctly and continue', async () => {
  await startGame();
  const correctButton = screen.getByRole("button", {name: /Bedre hell æll medesin/i});
  fireEvent.click(correctButton);
  const resultDialog = screen.getByRole("alert");
  const continueButton = within(resultDialog).getByRole("button", {name: /Neste/i});
  fireEvent.click(continueButton);
  expect(screen.getByText(/Hvilken sang er dette\?/i)).toBeInTheDocument();
});
