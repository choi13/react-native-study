import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

const EMOJIS = ['🍎','🍌','🍇','🍒','🍑','🍍','🥝','🍉'];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

export default function MemoryMatchPro({ onGameOver }: { onGameOver: (n: number) => void }) {
  const [deck, setDeck] = useState<string[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<boolean[]>([]);
  const [moves, setMoves] = useState(0);

  const flips = useRef<Animated.Value[]>([]);

  useEffect(() => {
    const d = shuffle([...EMOJIS, ...EMOJIS]);
    setDeck(d);
    setMatched(Array(d.length).fill(false));
    setMoves(0);
    flips.current = d.map(() => new Animated.Value(0));
  }, []);

  const flipTo = (i: number, to: number) => {
    const v = flips.current[i];
    if (!v) return;
    Animated.timing(v, {
      toValue: to,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const tap = (i: number) => {
    if (matched[i] || open.includes(i) || open.length === 2) return;
    flipTo(i, 1);
    const next = [...open, i];
    setOpen(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a] === deck[b]) {
        const m2 = [...matched];
        m2[a] = m2[b] = true;
        setMatched(m2);
        setOpen([]);
        if (m2.every(Boolean)) onGameOver(Math.max(1, 200 - moves * 10));
      } else {
        setTimeout(() => {
          flipTo(a, 0);
          flipTo(b, 0);
          setOpen([]);
        }, 650);
      }
    }
  };

  return (
    <View style={st.wrap}>
      <Text style={st.title}>Memory Match</Text>
      <Text style={st.sub}>Moves: {moves}</Text>

      <View style={st.grid}>
{deck.map((emo, i) => {
  // 하나의 progress(0~1)로 양쪽 면을 반대로 회전
  const progress = flips.current[i] ?? new Animated.Value(0);
  const backRot = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const frontRot = progress.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity
      key={i}
      activeOpacity={0.9}
      onPress={() => tap(i)}
      style={st.cardWrap}
    >
      <View style={st.cardOuter}>
        {/* 뒷면 */}
        <Animated.View
          style={[
            st.face,
            st.back,
            { transform: [{ perspective: 800 }, { rotateY: backRot }] },
          ]}
        >
          <Text style={st.backTxt}>🎴</Text>
        </Animated.View>

        {/* 앞면 */}
        <Animated.View
          style={[
            st.face,
            st.front,
            { transform: [{ perspective: 800 }, { rotateY: frontRot }] },
          ]}
        >
          <Text style={st.emo}>{emo}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
})}

      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16, width: '100%' }}>
        <Leaderboard gameId="memory-pro" />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fffefa', alignItems: 'center', paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { marginVertical: 8, fontWeight: '700', color: '#666' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', width: '92%', gap: 10, justifyContent: 'center' },

  cardWrap: { width: '22%', aspectRatio: 0.72 },
  cardOuter: { flex: 1, position: 'relative' }, // 두 면을 겹치게

  // 공통 카드 면
  face: {
    position: 'absolute',
    left: 0, top: 0, right: 0, bottom: 0,
    borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    backfaceVisibility: 'hidden', // 양쪽에 모두 필수
    overflow: 'hidden',
  },

  back: { backgroundColor: '#1b3a6f', borderColor: '#132951' },
  backTxt: { color: '#fff', fontSize: 22 },

  front: { backgroundColor: '#fff', borderColor: '#d9e1ef' },
  emo: { fontSize: 26 },
});
