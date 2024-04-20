import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { IMove, MOVE } from "../screens/Game";

export function isPromoting(chess: Chess, from: Square, to: Square) {
    if (!from) {
        return false;
    }

    const piece = chess.get(from);
  
    if (piece?.type !== "p") {
      return false;
    }
  
    if (piece.color !== chess.turn()) {
      return false;
    }
  
    if (!["1", "8"].some((it) => to.endsWith(it))) {
      return false;
    }
  
    return chess
      .moves({ square: from, verbose: true })
      .map((it) => it.to)
      .includes(to);
}

export const ChessBoard = ({ gameId, started, myColor, chess, board, socket, setBoard, setMoves }: {
    myColor: Color, 
    gameId: string,
    started: boolean,
    chess: Chess;
    moves: IMove[];
    setMoves: React.Dispatch<React.SetStateAction<IMove[]>>;
    setBoard: React.Dispatch<React.SetStateAction<({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][]>>;
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket;
}) => {
    const [from, setFrom] = useState<null | Square>(null);
    const isMyTurn = myColor === chess.turn();
    const [legalMoves, setLegalMoves] = useState<string[]>([]);
    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
        <div className="flex">
            <div className="text-white-200 mr-10">
            {(myColor==="b"?[...board].reverse():board).map((row, i) => {
                return <div key={i} className="flex">
                            <div className="w-16 h-16 flex justify-center items-center text-cyan-100">
                                {myColor==='b'?i+1:8-i} {/* Vertical labels */}
                            </div>  
                    {(myColor==='b'?[...row].reverse():row).map((square, j) => {
                       const squareRepresentation = String.fromCharCode(97 + (myColor === 'b' ? 7 - j % 8 : j % 8)) + "" + (myColor==='b'? i+1:8-i) as Square;

                        return <div onClick={() => {
                            if (!started) {
                                return;
                            }
                            if (!from && square?.color !== chess.turn()) return;
                            if (!isMyTurn) return;
                            if (from === squareRepresentation) {
                                setFrom(null);
                            }
                            
                            if (!from) {
                                setFrom(squareRepresentation);
                                setLegalMoves(chess.moves({ square: squareRepresentation }))
                        } else {
                                try {
                                    if (isPromoting(chess, from ,squareRepresentation))  {
                                        chess.move({
                                            from,
                                            to: squareRepresentation,
                                            promotion: 'q'
                                        });
                                    } else {
                                        chess.move({
                                            from,
                                            to: squareRepresentation,
                                        });
                                    }
                                    socket.send(JSON.stringify({
                                        type: MOVE,
                                        payload: {
                                            gameId,
                                            move: {
                                                from,
                                                to: squareRepresentation
                                            }
                                        }
                                    }))
                                    setFrom(null)
                                    setLegalMoves([])
                                    setBoard(chess.board());
                                    console.log({
                                        from,
                                        to: squareRepresentation
                                    })
                                    setMoves(moves =>[...moves, { from, to: squareRepresentation }]);
                                } catch(e) {

                                }
                            }
                        }} key={j} className={`w-16 h-16 ${includeBox([from || ""], j, i,myColor) ? "bg-red-400" : includeBox(legalMoves,j,i,myColor) ? `${(i+j)%2 === 0 ? 'bg-green_legal' : 'bg-slate_legal'}` : `${(i+j)%2 === 0 ? 'bg-green-500' : 'bg-slate-500'}`}`}>
                            <div className="w-full justify-center flex h-full">
                                <div className="h-full justify-center flex flex-col">
                                    {square ? <img className="w-4" src={`/${square?.color === "b" ? square?.type : `${square?.type?.toUpperCase()} copy`}.png`} /> : null} 
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            })}
             <div className="flex">
                    <div className="w-16 h-8"></div> 
                        {(myColor==='b'?[...labels].reverse():labels).map((label, i) => (
                            <div key={i} className="w-16 h-8 flex justify-center items-center text-cyan-100">
                                {label} {/* Horizontal labels */}
                            </div>
                        ))}
                    </div>
            </div>
        </div>
   
    )
}

const includeBox = (legalMoves: string[], i:number,j:number,myColor:Color) => {
    let first,second

    if (myColor === 'b') {
        switch (i) {
            case 0:
                first = 'h';
                break;
            case 1:
                first = 'g';
                break;
            case 2:
                first = 'f';
                break;
            case 3:
                first = 'e';
                break;
            case 4:
                first = 'd';
                break;
            case 5:
                first = 'c';
                break;
            case 6:
                first = 'b';
                break;
            case 7:
                first = 'a';
                break;
            default:
                break;
        }
    
        switch (j) {
            case 0:
                second = '1';
                break;
            case 1:
                second = '2';
                break;
            case 2:
                second = '3';
                break;
            case 3:
                second = '4';
                break;
            case 4:
                second = '5';
                break;
            case 5:
                second = '6';
                break;
            case 6:
                second = '7';
                break;
            case 7:
                second = '8';
                break;
            default:
                break;
        }
    } else {
        switch (i) {
            case 0:
                first = 'a'
                break;
            case 1:
                first = 'b'
                break;
            case 2:
                first = 'c'
                break;
            case 3:
                first = 'd'
                break;
            case 4:
                first = 'e'
                break;
            case 5:
                first = 'f'
                break;
            case 6:
                first = 'g'
                break;
            case 7:
                first = 'h'
                break;
            default:
                break;
        }
    
        switch (j) {
            case 0:
                second = '8'
                break;
            case 1:
                second = '7'
                break;
            case 2:
                second = '6'
                break;
            case 3:
                second = '5'
                break;
            case 4:
                second = '4'
                break;
            case 5:
                second = '3'
                break;
            case 6:
                second = '2'
                break;
            case 7:
                second = '1'
                break;
            default:
                break;
        }
    }
    

    return legalMoves.includes(first! + second!)
}

