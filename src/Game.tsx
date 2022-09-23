import { Song } from "./types";
import Control from "react-leaflet-custom-control";
import React, { useEffect, useState } from "react";
import './Game.scss';
import classNames from "classnames";

type AnswerStatus = 'CORRECT' | 'WRONG' | undefined;

const SHOW_WELCOME_SCREEN = -1;
const ROUND_COUNT = 5;

type GameContextType = { advanceGame: () => void, correctSong: Song, showTooltipHints: (songId: number) => void };
const GameContext = React.createContext<GameContextType | undefined>(undefined);

type Round = {
  correctSong: Song,
  answeredSong?: Song,
  status: AnswerStatus
  points: number,
  hintsUsed: number
};
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

  const [roundNum, setRoundNum] = useState<number>(SHOW_WELCOME_SCREEN);
  const [correctSong, setCorrectSong] = useState<Song | undefined>(undefined);
  const [candidates, setCandidates] = useState<Array<Song>>([]);
  const [rounds, setRounds] = useState<Array<Round>>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [shuffledSongList, setShuffledSongList] = useState<Array<Song>>([]);
  const [gameNum, setGameNum] = useState<number>(-1);

  useEffect(() => {
    const songsWithPlaces = songs.filter(song => song.places.length > 0);
    const shuffledSongList = songsWithPlaces.sort(() => Math.random() - 0.5);
    setShuffledSongList(shuffledSongList);
  }, [songs, gameNum]);


  useEffect(() => {
    if (roundNum > -1 && roundNum < ROUND_COUNT) {
      const songsWithPlaces = songs.filter(song => song.places.length > 0);
      const correctSong = shuffledSongList[roundNum];
      const selectedSongPlaces = correctSong.places;
      const excludedSongs = shuffledSongList.filter(song => song.places.every(place => selectedSongPlaces.includes(place)));
      const candidateSongs = songs.sort(() => Math.random() - 0.5).filter(song => !excludedSongs.includes(song)).slice(0, 4).concat(correctSong);
      setCandidates(candidateSongs.sort(() => Math.random() - 0.5));
      setCorrectSong(correctSong);
      const newRound = {correctSong, points: 0, hintsUsed: 0, status: undefined};
      setRounds(rounds => {
        rounds[roundNum] = newRound;
        return [...rounds];
      });
    }
  }, [roundNum, shuffledSongList, songs]);

  useEffect(() => {
    setTotalPoints(rounds.reduce((acc, round) => acc + round.points, 0));
  }, [rounds]);

  useEffect(() => {
    if (correctSong) {
      console.log("Zoomer til sangen: ", correctSong.title);
      zoomToSong(correctSong.id);
      showSongTooltips(correctSong.id);
    }
  }, [correctSong, zoomToSong]);

  const advanceGame = React.useCallback(() => {
    setRoundNum(roundNum => roundNum + 1);
    removeHighlighting();
  }, [removeHighlighting]);

  const handleAnswer = React.useCallback((roundNum: number, answeredSongId: number, points: number) => {
    const round = rounds[roundNum];
    const answeredSong = songs.find(song => song.id === answeredSongId);
    console.log("answeredSong = ", answeredSong!.title, "correctSongId = ", round.correctSong.title);
    let status : AnswerStatus;
    if (answeredSongId === round.correctSong.id ) {
      status = 'CORRECT';
    } else {
      status = 'WRONG';
      points = 0;
    }
    setRounds([...rounds.slice(0, roundNum), {...round, answeredSong, points, status}, ...rounds.slice(roundNum + 1)]);
    showSongTooltips(round.correctSong.id);
  }, [rounds, songs, showSongTooltips, setRounds]);

  const startGame = React.useCallback(() => {
    setRounds([]);
    setRoundNum(0);
    setGameNum(gameNum => gameNum + 1);
  }, [setRoundNum]);

  return <>
    <GameContext.Provider value={{advanceGame, correctSong: correctSong!, showTooltipHints: (songId: number) => showSongTooltips(songId)}}>
      {roundNum === SHOW_WELCOME_SCREEN && <GameWelcome startGame={startGame}/>}
      {roundNum > SHOW_WELCOME_SCREEN && roundNum < ROUND_COUNT  && correctSong &&
          <>
              <Control position="topright">
                  <h1>Poengsum: {totalPoints}</h1>
              </Control>

              <GameRound
                  roundNum={roundNum}
                  candidates={candidates}
                  answerSelected={handleAnswer}
                  status={rounds[roundNum]?.status || undefined}
              />
          </>
      }
      {roundNum === ROUND_COUNT && <GameSummary totalPoints={totalPoints} rounds={rounds} startGame={startGame}/>}
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
    <button onClick={game.advanceGame}>Neste</button>
  </Control>
};

const GameWelcome = (props: {startGame: () => void}) => {
  return <Control position="topright" container={{className: "game-welcome"}}>
    <h1>Hvor godt kjenner du Vazelina-geografien?</h1>
    <p>I dette spillet blir du plassert foran et kart, hvor ett eller flere steder er merket.</p>
    <p>Hvilken sang er det som nevner disse stedene? Velg riktig alternativ, og du får poeng.
      Du får flere poeng jo raskere du svarer.</p>
    <p>Du får {ROUND_COUNT} spørsmål. Lykke til!</p>
    <button onClick={props.startGame}>Start</button>
  </Control>
}

const GameSummary = (props: {startGame: () => void, totalPoints: number, rounds: Array<Round>}) => {
  const [resultsShared, setResultsShared] = useState(false);
  return <Control position="topright" container={{className: "game-summary"}}>
    <h1>Spillet er over!</h1>
    <ol>
      {props.rounds.map((round, index) => <li key={index}>
        {round.correctSong.title} {round.status === 'CORRECT' && <span className="answer-correct">✅</span> || <span className="answer-wrong">❌</span>} <span>{round.points} poeng</span>
      </li>)}
    </ol>
    <p>Du fikk <h2>{props.totalPoints} poeng</h2></p>
    <p><button onClick={() => {
      navigator.clipboard.writeText(props.rounds.map(round => round.status).map(status => (status === "CORRECT" ? "✅" : "❌")).join("") + " Jeg fikk " + props.rounds.filter(round => round.status === "CORRECT").length + " rette og " + props.totalPoints + " poeng i Vazelinakunnskap på https://vramdal.github.io/hvor-i-vazelina");
      setResultsShared(true);
    }
    }>Del resultat</button>
    <><br/>{resultsShared && <span style={{fontWeight: "bold"}}>Resultatet ditt er kopiert til utklippstavlen.<br/> Det kan du lime inn og dele på Facebook.</span>}</></p>
    <p>Trykk på knappen for å starte på nytt.</p>
    <button onClick={props.startGame}>Prøv igjen</button>
  </Control>
}

const GameRound = ({
                     roundNum,
                     candidates,
                     answerSelected,
                     status,
                   }: {
  roundNum: number,
  candidates: Array<Song>,
  answerSelected: (roundNum : number, songId: number, bonus: number) => void,
  status: AnswerStatus,
}) => {
  const [countdown, setCountdown] = useState<number>(1000);
  const [answeredSong, setAnsweredSong] = useState<Song | undefined>(undefined);

  useEffect(() => {
    setCountdown(1000);
  }, [roundNum]);

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
  }, [status, roundNum]);

  const answerButtonClicked = (song: Song) => {
    setAnsweredSong(song);
    answerSelected(roundNum, song.id, countdown );
  };

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
    </Control></>
}

const useGame = (): GameContextType => {
  return React.useContext(GameContext)!;
}

export default Game;
