import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import Chessboard from 'chessboardjsx';
import * as engine from './engine';
import type { AvailableBots, InitialisedBot } from './Bots';
import { Button } from '../../components/Button';
import MovesTable from '../MovesTable';


type SelectedBot = {
  name: string;
  move: InitialisedBot;
} | null;


type BoardMove = {
  sourceSquare: engine.Square;
  targetSquare: engine.Square;
};

const BotSelector: React.FC<{
  playerName: string;
  availableBots: AvailableBots;
  selectedBot: SelectedBot;
  setSelectedBot: (bot: SelectedBot) => void;
  disabled: boolean;
}> = ({ playerName, availableBots, selectedBot, setSelectedBot, disabled }) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const name = e.target.value;
    setSelectedBot(name ? { name, move: availableBots[name]() } : null);
  };

  return (
    <div className='m-[10px] inline-block'>
      <label className='mr-[10px] text-white'>{playerName}</label>
      <select value={selectedBot?.name} onChange={handleChange} disabled={disabled}>
        <option className='text-white' value="" key="User">
          User
        </option>
        {Object.keys(availableBots).map(name => (
          <option key={name}>{name}</option>
        ))}
      </select>
    </div>
  );
};

const History: React.FC<{ history: Array<engine.Move> }> = ({ history }) => {
  // const endRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   endRef.current?.scrollIntoView();
  // }, [history]);

  const moves = history.map(({ from, to }: engine.Move) => {
    return { from, to };
  });

  const endRef = useRef<HTMLDivElement>(null);

  return (
    <div className=" bg-brown-500  ml-[56vw] mr-[18vw] h-[78vh] overflow-scroll mt-">
      <MovesTable moves={moves}/>
      <div ref={endRef} />
    </div>
  );
};

const BotGame: React.FC<{
  bots: AvailableBots;
  onGameCompleted: (winner: engine.GameWinner) => void;
}> = ({ bots, onGameCompleted }) => {
  const [isPlaying, setPlaying] = useState<boolean>(false);
  const [fen, setFen] = useState<engine.Fen>(engine.newGame);
  const [history, setHistory] = useState<Array<engine.Move>>([]);
  const [whiteBot, setWhiteBot] = useState<SelectedBot>(null);
  const [blackBot, setBlackBot] = useState<SelectedBot>(null);
 
  const newGame = () => {
    setPlaying(false);
    setFen(engine.newGame);
    setHistory([]);
  };

  const doMove = useCallback(
    (fen: engine.Fen, from: engine.Square, to: engine.Square) => {
      const move = engine.move(fen, from, to);

      if (!move) {
        return;
      }

      const [newFen, action] = move;

      if (engine.isGameOver(newFen)) {
        onGameCompleted(engine.getGameWinner(newFen));
        newGame();
        return;
      }

      setFen(newFen);
      setHistory(history => [...history, action]);
    },
    [onGameCompleted]
  );

  const onDragStart = ({ sourceSquare: from }: Pick<BoardMove, 'sourceSquare'>) => {
    const isWhiteBotTurn = whiteBot && engine.isWhiteTurn(fen);
    const isBlackBotTurn = blackBot && engine.isBlackTurn(fen);

    return isPlaying && engine.isMoveable(fen, from) && !(isWhiteBotTurn || isBlackBotTurn);
  };

  const onMovePiece = ({ sourceSquare: from, targetSquare: to }: BoardMove) => {
    doMove(fen, from, to);
  };

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if(engine.getGameWinner(fen)){
      window.alert(`${engine.getGameWinner(fen) === 'b' ? 'Black' : engine.getGameWinner(fen) === 'w' ? 'White' : 'No one'} is the winner!`);
      newGame();
      return;
    }

    

    let isBotMovePlayable = true;

    if (whiteBot && engine.isWhiteTurn(fen)) {
      whiteBot.move(fen).then(({ from, to }: engine.ShortMove) => {
        if (isBotMovePlayable) doMove(fen, from, to);
      });
    }

    if (blackBot && engine.isBlackTurn(fen)) {
      blackBot.move(fen).then(({ from, to }: engine.ShortMove) => {
        if (isBotMovePlayable) doMove(fen, from, to);
      });
    }

    return () => {
      isBotMovePlayable = false;
    };
  }, [isPlaying, fen, whiteBot, blackBot, doMove]);

  return (
    <div className='min-w-[750px] flex-row mt-[1vh] right-0'>
      <div className='ml-[8rem] '>
        <BotSelector
          playerName="White"
          availableBots={bots}
          selectedBot={whiteBot}
          setSelectedBot={setWhiteBot}
          disabled={isPlaying}
        />
        <BotSelector
          playerName="Black"
          availableBots={bots}
          selectedBot={blackBot}
          setSelectedBot={setBlackBot}
          disabled={isPlaying}
        />
        <Button className={' ml-[8rem] mt-[2rem] m-[10px]  text-white'} onClick={() => setPlaying(playing => !playing)}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button className={'m-[10px]  text-white'} onClick={newGame}>
          Reset
        </Button>
      </div>
      <div className={'float-left ml-[10vw] mt-[2vw] '}>
        <Chessboard position={fen} allowDrag={onDragStart} onDrop={onMovePiece}/>
      </div>
     

      <History history={history} />
      
    </div>
  );




};

export default BotGame;