import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

const { width, height } = Dimensions.get('window');
const GRAVITY = 0.5; const FLAP = -8; const GAP = 180; const PIPE_W = 60; const SPEED = 3;

export default function FlappyBird({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [birdY, setBirdY] = useState(height * 0.4);
  const vel = useRef(0);
  const [pipes, setPipes] = useState<{ x:number; topH:number; }[]>([
    { x: width, topH: randomTop() }, { x: width + (width/2), topH: randomTop() }
  ]);
  const [score, setScore] = useState(0);
  const raf = useRef<number | null>(null);
  const alive = useRef(true);

  function randomTop() { return 50 + Math.random() * (height - GAP - 200); }
  const flap = () => { vel.current = FLAP; };

  useEffect(() => {
    const loop = () => {
      if (!alive.current) return;
      vel.current += GRAVITY;
      setBirdY(y => y + vel.current);
      setPipes(ps => ps.map(p => ({ ...p, x: p.x - SPEED })).map(p => {
        if (p.x + PIPE_W < 0) { setScore(s => s + 1); return { x: width, topH: randomTop() }; }
        return p;
      }));
      const y = birdY + vel.current;
      if (y < 0 || y > height) return die();
      pipes.forEach(p => {
        const inX = p.x < width*0.3 + 24 && p.x + PIPE_W > width*0.3 - 24;
        const inTop = y < p.topH;
        const inBottom = y > p.topH + GAP;
        if (inX && (inTop || inBottom)) die();
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [pipes, birdY]);

  const die = () => {
    if (!alive.current) return;
    alive.current = false;
    onGameOver(score);
  };

  return (
    <View style={{ flex:1 }}>
      <TouchableOpacity onPress={flap} activeOpacity={1} style={{ flex:1, backgroundColor:'#87CEEB' }}>
        {pipes.map((p,i) => (
          <React.Fragment key={i}>
            <View style={{ position:'absolute', left:p.x, top:0, width:PIPE_W, height:p.topH, backgroundColor:'#2ecc71' }} />
            <View style={{ position:'absolute', left:p.x, top:p.topH+GAP, width:PIPE_W, bottom:0, backgroundColor:'#2ecc71' }} />
          </React.Fragment>
        ))}
        <View style={{ position:'absolute', left: width*0.3-12, top:birdY, width:24, height:24, borderRadius:12, backgroundColor:'#f1c40f' }} />
        <Text style={{ position:'absolute', top:40, left:20, fontSize:24, color:'#fff', fontWeight:'700' }}>{score}</Text>
      </TouchableOpacity>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Leaderboard gameId="flappy-bird" />
      </View>
    </View>
  );
}
