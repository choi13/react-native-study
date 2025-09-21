import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Leaderboard from '../components/Leaderboard';

export default function ReactionTime({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [phase, setPhase] = useState<'idle'|'wait'|'go'|'result'>('idle');
  const [msg, setMsg] = useState('시작을 누르세요');
  const startTime = useRef<number>(0);
  const [ms, setMs] = useState<number | null>(null);
  const timer = useRef<any>(null);

  const start = () => {
    setPhase('wait');
    setMsg('🔴 신호를 기다리세요… (초록 되면 터치)');
    const delay = 1000 + Math.random() * 2000;
    timer.current = setTimeout(() => {
      setPhase('go');
      setMsg('🟢 지금!');
      startTime.current = Date.now();
    }, delay);
  };

  const tap = () => {
    if (phase === 'wait') {
      setMsg('성급했어요! 다시 시도');
      clearTimeout(timer.current);
      setPhase('idle');
    } else if (phase === 'go') {
      const diff = Date.now() - startTime.current;
      setMs(diff);
      setPhase('result');
      setMsg(`반응 속도: ${diff} ms`);
      const score = Math.max(0, 1000 - diff); // 낮을수록 좋음
      onGameOver(score);
    }
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <View style={{ flex:1 }}>
      <TouchableOpacity onPress={phase==='idle'?start:tap} activeOpacity={0.8}
        style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: phase==='go'?'#c8f7c5':'#f0f0f0' }}>
        <Text style={{ fontSize: 20, marginBottom: 12 }}>{msg}</Text>
        {phase==='result' && (
          <TouchableOpacity onPress={() => setPhase('idle')} style={{ marginTop:16, padding:12, backgroundColor:'#333', borderRadius:8 }}>
            <Text style={{ color:'#fff' }}>다시하기</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Leaderboard gameId="reaction-time" />
      </View>
    </View>
  );
}
