import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const win = (b: string[]) => {
  for (const [a,b2,c] of L) if (b[a] && b[a]===b[b2] && b[a]===b[c]) return b[a];
  return b.every(Boolean) ? 'D' : null;
};

export default function TicTacToe({ onGameOver }: { onGameOver: (n: number) => void }) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [turn, setTurn]   = useState<'X'|'O'>('X');
  const [done, setDone]   = useState<string | null>(null);

  const play = (i: number) => {
    if (done || board[i]) return;
    const b = [...board]; b[i] = 'X'; setBoard(b); setTurn('O');
  };

  useEffect(() => {
    const w = win(board);
    if (w) { setDone(w); onGameOver(w==='X' ? 1 : 0); return; }
    if (turn === 'O') {
      const idx = board.findIndex(c => !c);
      if (idx >= 0) {
        const b = [...board]; b[idx] = 'O'; setTimeout(() => { setBoard(b); setTurn('X'); }, 300);
      }
    }
  }, [board, turn]);

  const reset = () => { setBoard(Array(9).fill('')); setTurn('X'); setDone(null); };

  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize:20, marginBottom:12 }}>{done ? (done==='D'?'무승부': `${done} 승리`) : `${turn} 차례`}</Text>
      <View style={{ width:300, height:300, flexDirection:'row', flexWrap:'wrap' }}>
        {board.map((v,i) => (
          <TouchableOpacity key={i} onPress={() => play(i)}
            style={{ width:'33.33%', height:'33.33%', borderWidth:1, alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontSize:32 }}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={reset} style={{ marginTop:16, padding:12, backgroundColor:'#333', borderRadius:8 }}>
        <Text style={{ color:'#fff' }}>다시하기</Text>
      </TouchableOpacity>
    </View>
  );
}
