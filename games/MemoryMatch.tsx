import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const EMOJIS = ['🍎','🍌','🍇','🍒','🍑','🍍','🥝','🍉'];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

export default function MemoryMatch({ onGameOver }: { onGameOver: (n: number) => void }) {
  const [cards, setCards] = useState<string[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<boolean[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const deck = shuffle([...EMOJIS, ...EMOJIS]);
    setCards(deck);
    setMatched(Array(deck.length).fill(false));
  }, []);

  const tap = (i: number) => {
    if (open.length === 2 || matched[i] || open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a,b] = next;
      if (cards[a] === cards[b]) {
        const m2 = [...matched]; m2[a] = m2[b] = true; setMatched(m2); setOpen([]);
        if (m2.every(Boolean)) onGameOver(Math.max(1, 100 - moves));
      } else {
        setTimeout(() => setOpen([]), 700);
      }
    }
  };

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:18, fontWeight:'700', marginBottom:12 }}>Moves: {moves}</Text>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
        {cards.map((c,i) => {
          const show = open.includes(i) || matched[i];
          return (
            <TouchableOpacity key={i} onPress={() => tap(i)}
              style={{ width:'22%', aspectRatio:1, alignItems:'center', justifyContent:'center', borderWidth:1, borderRadius:8 }}>
              <Text style={{ fontSize: show ? 28 : 0 }}>{show ? c : ' '}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
