import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

type Cell = { x: number; y: number };
type Dir = 'U'|'D'|'L'|'R';

const { width, height } = Dimensions.get('window');
const TILE = 18;
const COLS = Math.floor(width / TILE);
const ROWS = Math.floor((height - 220) / TILE); // 상단/버튼 영역 제외
const SPEED_MS = 120;

function eq(a: Cell, b: Cell) { return a.x===b.x && a.y===b.y; }
function randCell(): Cell { return { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }; }



export default function Snake({ onGameOver }: { onGameOver: (n: number) => void }) {
  const [snake, setSnake] = useState<Cell[]>([{x:Math.floor(COLS/2), y:Math.floor(ROWS/2)}]);
  const [dir, setDir] = useState<Dir>('R');
  const [food, setFood] = useState<Cell>(() => randCell());
  const [score, setScore] = useState(0);
const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  const boardStyle = useMemo(() => ({
    width: COLS*TILE, height: ROWS*TILE,
  }), []);

useEffect(() => {
  if (timer.current) clearInterval(timer.current);
  timer.current = setInterval(tick, SPEED_MS);
  return () => { if (timer.current) clearInterval(timer.current); };
}, [snake, dir]);

  const tick = () => {
    if (!alive.current) return;
    setSnake(prev => {
      const head = prev[0];
      const next: Cell = {
        x: head.x + (dir==='L'?-1:dir==='R'?1:0),
        y: head.y + (dir==='U'?-1:dir==='D'?1:0),
      };
      // 벽 충돌
      if (next.x<0 || next.x>=COLS || next.y<0 || next.y>=ROWS) { die(); return prev; }
      // 몸 충돌
      if (prev.some(p => eq(p,next))) { die(); return prev; }

      const ate = eq(next, food);
      const body = [next, ...prev];
      if (!ate) body.pop(); else {
        setScore(s => s+10);
        // 새로운 먹이 (몸 위 피하기)
        let f = randCell();
        while (body.some(p => eq(p,f))) f = randCell();
        setFood(f);
      }
      return body;
    });
  };

  const die = () => {
    if (!alive.current) return;
    alive.current = false;
    onGameOver(score);
  };

  const turn = (d: Dir) => {
    // 반대방향 금지
    if ((dir==='L'&&d==='R')||(dir==='R'&&d==='L')||(dir==='U'&&d==='D')||(dir==='D'&&d==='U')) return;
    setDir(d);
  };

  const reset = () => {
    alive.current = true;
    setSnake([{x:Math.floor(COLS/2), y:Math.floor(ROWS/2)}]);
    setDir('R'); setFood(randCell()); setScore(0);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Snake</Text>
      <View style={[styles.board, boardStyle]}>
        {/* 배경 격자 */}
        {Array.from({length: ROWS*COLS}).map((_,i) => {
          const x = i % COLS, y = Math.floor(i/COLS);
          const dark = (x+y)%2===0;
          return <View key={i} style={[styles.cell, { left:x*TILE, top:y*TILE, backgroundColor: dark?'#e6f0ff':'#f4f8ff' }]} />;
        })}
        {/* 먹이 */}
        <View style={[styles.food, { left: food.x*TILE, top: food.y*TILE }]} />
        {/* 뱀 */}
        {snake.map((p,i) => (
          <View key={i} style={[styles.snake, { left:p.x*TILE, top:p.y*TILE, opacity:i===0?1:0.9 }]} />
        ))}
      </View>

      <Text style={styles.score}>Score: {score}</Text>

      <View style={styles.padRow}>
        <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('U')}><Text style={styles.btnTxt}>↑</Text></Pressable>
      </View>
      <View style={styles.padRow}>
        <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('L')}><Text style={styles.btnTxt}>←</Text></Pressable>
        <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('D')}><Text style={styles.btnTxt}>↓</Text></Pressable>
        <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('R')}><Text style={styles.btnTxt}>→</Text></Pressable>
      </View>

      <View style={{ paddingHorizontal:16, paddingBottom:16, width:'100%' }}>
        <Pressable onPress={reset} style={[styles.btn, { backgroundColor:'#222' }]}><Text style={[styles.btnTxt,{color:'#fff'}]}>다시하기</Text></Pressable>
        <Leaderboard gameId="snake" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{ flex:1, alignItems:'center', backgroundColor:'#f7fbff' },
  title:{ fontSize:24, fontWeight:'800', marginTop:12, marginBottom:8 },
  board:{ position:'relative', borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'#cfe3ff' },
  cell:{ position:'absolute', width:TILE, height:TILE },
  food:{ position:'absolute', width:TILE, height:TILE, backgroundColor:'#ff4757', borderRadius:6, borderWidth:1, borderColor:'#b91423' },
  snake:{ position:'absolute', width:TILE, height:TILE, backgroundColor:'#2ed573', borderRadius:6, borderWidth:1, borderColor:'#1e9f52' },
  score:{ marginTop:8, fontSize:16, fontWeight:'700' },
  padRow:{ flexDirection:'row', gap:16, marginTop:10, alignItems:'center', justifyContent:'center' },
  btn:{ paddingVertical:12, paddingHorizontal:20, borderRadius:12, backgroundColor:'#eef4ff', borderWidth:1, borderColor:'#cfe3ff', marginTop:6, alignSelf:'center' },
  sm:{ minWidth:64, alignItems:'center' },
  btnTxt:{ fontSize:18, fontWeight:'800', color:'#1b3a6f' }
});
