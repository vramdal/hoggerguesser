import { Song } from "./types";
import Control from "react-leaflet-custom-control";
import React, { useEffect, useState } from "react";
import './Game.scss';
import classNames from "classnames";

type AnswerStatus = 'CORRECT' | 'WRONG' | undefined;

type GameContextType = { advanceGame: () => void, correctSong: Song, showTooltipHints: () => void };
const GameContext = React.createContext<GameContextType | undefined>(undefined);

const Game = ({
                songs,
                zoomToSong,
                showSongTooltips,
                removeHighlighting
              }: {
                songs: Array<Song>,
                zoomToSong: (songId: number) => void,
                showSongTooltips: (songId: number) => void,
                removeHighlighting: () => void
              }
) => {

  const songsWithPlaces = songs.filter(song => song.places.length > 0);

  const [gameNum, setGameNum] = useState<number>(0);
  const [correctSong, setCorrectSong] = useState<Song | undefined>(undefined);
  const [candidates, setCandidates] = useState<Array<Song>>([]);
  const [rounds, setRounds] = useState<Array<{
    correctSong: Song,
    answeredSong?: Song,
    status: AnswerStatus
    points: number,
    hintsUsed: number}>>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    const shuffledSongList = songsWithPlaces.sort(() => Math.random() - 0.5);
    const correctSong = shuffledSongList[0];
    const selectedSongPlaces = correctSong.places;
    const excludedSongs = shuffledSongList.filter(song => song.places.every(place => selectedSongPlaces.includes(place)));
    const candidateSongs = shuffledSongList.filter(song => !excludedSongs.includes(song)).slice(0, 4).concat(correctSong);
    setCandidates(candidateSongs.sort(() => Math.random() - 0.5));
    setCorrectSong(correctSong);
    setRounds([...rounds, {correctSong, points: 0, hintsUsed: 0, status: undefined}]);
    console.log('correctSong = ', correctSong);
  }, [gameNum]);

  useEffect(() => {
    setTotalPoints(rounds.reduce((acc, round) => acc + round.points, 0));
  }, [rounds]);

  useEffect(() => {
    if (correctSong) {
      console.log("Zoomer til sangen: ", correctSong.title);
      zoomToSong(correctSong.id);
    }
  }, [correctSong]);

  const advanceGame = () => {
    setGameNum(gameNum + 1);
    removeHighlighting();
  }

  const handleAnswer = (gameNum: number, answeredSongId: number, points: number) => {
    const round = rounds[gameNum];
    const answeredSong = songs.find(song => song.id === answeredSongId);
    let status : AnswerStatus;
    if (answeredSongId == round.correctSong.id ) {
      status = 'CORRECT';
    } else {
      status = 'WRONG';
      points = 0;
    }
    setRounds([...rounds.slice(0, gameNum), {...round, answeredSong, points, status}, ...rounds.slice(gameNum + 1)]);
    showSongTooltips(round.correctSong.id);
  }

  return <>
    <GameContext.Provider value={{advanceGame, correctSong: correctSong!, showTooltipHints: () => showSongTooltips(correctSong!.id)}}>
      <Control position="topright">
        <h1>Poengsum: {totalPoints}</h1>
      </Control>

      <GameRound
        gameNum={gameNum}
        candidates={candidates}
        answerSelected={handleAnswer}
        status={rounds[gameNum]?.status || undefined}
      />
    </GameContext.Provider>
  </>
}

const GameRoundResult = (props: {answerStatus: AnswerStatus, answeredSong: Song}) => {
  let panelClass;
  switch (props.answerStatus) {
    case 'CORRECT':panelClass = 'answer-correct';break;
    case 'WRONG':panelClass = 'answer-wrong';break;
    default:panelClass = undefined;break;
  }

  const game = useGame();

  return <Control position="topright" container={{className: classNames("game-round-result", panelClass)}}>
    <p>Du svarte {props.answeredSong.title}</p>
    {props.answerStatus === 'CORRECT' && <>
        <h1>Riktig</h1>
    </>}
    {props.answerStatus === 'WRONG' && <>
    <h1>Feil</h1>
    Riktig svar var <h2>{game.correctSong.title}</h2>
    </>}
    <p><button onClick={game.advanceGame}>Neste</button> </p>
  </Control>
};

const GameRound = ({
                     gameNum,
                     candidates,
                     answerSelected,
                     status,
                   }: {
  gameNum: number,
  candidates: Array<Song>,
  answerSelected: (gameNum : number, songId: number, bonus: number) => void,
  status: AnswerStatus,
}) => {
  const [countdown, setCountdown] = useState<number>(1000);
  const [answeredSong, setAnsweredSong] = useState<Song | undefined>(undefined);
  const [hintUsed, setHintUsed] = useState<boolean>(false);

  useEffect(() => {
    setCountdown(1000);
    setHintUsed(false);
  }, [gameNum]);

  useEffect(() => {
    console.log("setting interval");
    const interval = setInterval(() => {
        setCountdown(countdown => {
          if (countdown > 500 && status === undefined) {
            return countdown - 25;
          } else {
            return countdown;
          }
        });
    }, 1000);
    return () => {
      console.log("clearing interval");
      clearInterval(interval);
    };
  }, [status, gameNum]);

  const answerButtonClicked = (song: Song) => {
    setAnsweredSong(song);
    answerSelected(gameNum, song.id, countdown );
  }

  const game = useGame();

  return <>
    {status !== undefined && <GameRoundResult answerStatus={status} answeredSong={answeredSong!}/>}
    <Control position="bottomleft" container={{className: classNames("game-round-gui")}}>
      {/*
    <p>
      <button onClick={advanceGame}>Neste</button>
    </p>
*/}
      <h1>Hvilken sang er dette?</h1>
      <p className={"answer-button-wrapper"}>{candidates.map(song =>
        <button key={song.id} disabled={status !== undefined} onClick={() => answerButtonClicked(song)}>{song.title}</button>)}</p>

      <p>Poeng: {countdown}
        <br/> <meter value={countdown} max={1000} min={500} low={600} optimum={700} style={{width: "100%"}}/> </p>
      <p>
        <button disabled={hintUsed} onClick={() => {
          setHintUsed(true);
          setCountdown(countdown => countdown - 200);
          game.showTooltipHints()
        }}>Vis stedsnavn (-200 poeng)
        </button>
      </p>
    </Control></>


}

const useGame = (): GameContextType => {
  return React.useContext(GameContext)!;
}

export default Game;
