import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

const HOLES = 9;
const DURATION = 30; // seconds
const INTERVAL = 700; // mole hop

export default function WhackAMole({ onGameOver }: { onGameOver:(n:number)=>void }) {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(DURATION);
  const [pos, setPos] = useState<number>(-1);
const timer = useRef<ReturnType<typeof setInterval> | null>(null);
const hop   = useRef<ReturnType<typeof setInterval> | null>(null);



useEffect(()=>{
  setScore(0); setTime(DURATION); setPos(-1);
  hop.current = setInterval(()=> setPos(Math.floor(Math.random()*HOLES)), INTERVAL);
  timer.current = setInterval(()=> setTime(t => {
    if (t<=1){ cleanup(); onGameOver(score); return 0; }
    return t-1;
  }), 1000);
  return cleanup;
}, []);

const cleanup = () => {
  if (hop.current) clearInterval(hop.current);
  if (timer.current) clearInterval(timer.current);
};
  const hit = (i:number) => { if (i===pos){ setScore(s=>s+5); setPos(-1); } else setScore(s=>Math.max(0,s-1)); };

  return (
    <View style={st.wrap}>
      <Text style={st.title}>Whack-A-Mole</Text>
      <Text style={st.info}>⏱ {time}s   🏆 {score}</Text>
      <View style={st.grid}>
        {Array.from({length:HOLES}).map((_,i)=>(
          <Pressable key={i} onPress={()=>hit(i)} style={[st.hole, { backgroundColor:'#e6dac6' }]}>
            <View style={[st.holeInner]} />
            {i===pos && <View style={st.mole}><Text style={{fontSize:20}}>🐹</Text></View>}
          </Pressable>
        ))}
      </View>
      <View style={{ paddingHorizontal:16, paddingBottom:16, width:'100%' }}><Leaderboard gameId="whack-a-mole" /></View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:{ flex:1, alignItems:'center', backgroundColor:'#fff8ee', paddingTop:12 },
  title:{ fontSize:24, fontWeight:'800', marginBottom:6 },
  info:{ fontWeight:'700', marginBottom:8 },
  grid:{ width:'92%', flexDirection:'row', flexWrap:'wrap', gap:14, justifyContent:'center' },
  hole:{ width:'28%', aspectRatio:1, borderRadius:14, alignItems:'center', justifyContent:'flex-end', paddingBottom:8, shadowColor:'#000', shadowOpacity:0.08, shadowOffset:{width:0,height:6}, shadowRadius:10 },
  holeInner:{ width:'84%', height:'35%', backgroundColor:'#c9b39a', borderRadius:100 },
  mole:{ position:'absolute', bottom:20, alignItems:'center', justifyContent:'center' },
});
