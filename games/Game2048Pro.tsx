import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

const SIZE = 4;
type Grid = number[][];
// === 유틸 ===
const rotateCW = (g: Grid): Grid => rotate(g);                           // 90도 시계
const rotate180 = (g: Grid): Grid => rotateCW(rotateCW(g));              // 180도
const rotateCCW = (g: Grid): Grid => rotateCW(rotateCW(rotateCW(g)));    // 270도(반시계)
// 한 방향으로 이동 적용
function applyMove(g: Grid, dir: 'L' | 'R' | 'U' | 'D') {
  let gained = 0;
  let work: Grid;

  if (dir === 'L') {
    const r = moveLeft(g);
    gained = r.gained;
    work = r.grid;
  } else if (dir === 'R') {
    // 180 회전 → 왼쪽 이동 → 180 되돌리기
    const r = moveLeft(rotate180(g));
    gained = r.gained;
    work = rotate180(r.grid);
  } else if (dir === 'U') {
    // 270(반시계) → 왼쪽 이동 → 90(시계)
    const r = moveLeft(rotateCCW(g));
    gained = r.gained;
    work = rotateCW(r.grid);
  } else { // 'D'
    // 90(시계) → 왼쪽 이동 → 270(반시계)
    const r = moveLeft(rotateCW(g));
    gained = r.gained;
    work = rotateCCW(r.grid);
  }

  return { grid: work, gained };
}
const colors: Record<number, {bg:string; fg:string}> = {
  0:{bg:'#e9edf3', fg:'#778'},
  2:{bg:'#eef3ff', fg:'#334'},
  4:{bg:'#dde9ff', fg:'#334'},
  8:{bg:'#ffd8a8', fg:'#643'},
  16:{bg:'#ffc078', fg:'#542'},
  32:{bg:'#ffa94d', fg:'#432'},
  64:{bg:'#ff922b', fg:'#fff'},
  128:{bg:'#fab005', fg:'#fff'},
  256:{bg:'#f59f00', fg:'#fff'},
  512:{bg:'#f08c00', fg:'#fff'},
  1024:{bg:'#e67700', fg:'#fff'},
  2048:{bg:'#d9480f', fg:'#fff'},
};

const empty = ():Grid => Array.from({length:SIZE},()=>Array(SIZE).fill(0));
function addRandom(g:Grid){ const s: [number,number][]=[]; g.forEach((r,i)=>r.forEach((v,j)=>!v&&s.push([i,j]))); if(!s.length) return g; const [i,j]=s[Math.floor(Math.random()*s.length)]; g[i][j]=Math.random()<0.9?2:4; return g; }
function rotate(g:Grid){ const n=SIZE; const r=empty(); for(let i=0;i<n;i++)for(let j=0;j<n;j++) r[j][n-1-i]=g[i][j]; return r; }
function slideRow(row:number[]){ const f=row.filter(v=>v); const o:number[]=[]; let gained=0; for(let i=0;i<f.length;i++){ if(f[i]===f[i+1]){ o.push(f[i]*2); gained+=f[i]*2; i++; } else o.push(f[i]); } while(o.length<SIZE) o.push(0); return {row:o, gained}; }
function moveLeft(g:Grid){ let sum=0; const out=g.map(r=>{ const {row,gained}=slideRow(r); sum+=gained; return row; }); return {grid:out, gained:sum}; }
const same=(a:Grid,b:Grid)=>JSON.stringify(a)===JSON.stringify(b);

export default function Game2048Pro({ onGameOver }: { onGameOver:(n:number)=>void }) {
  const [grid,setGrid]=useState<Grid>(()=>addRandom(addRandom(empty())));
  const [score,setScore]=useState(0);
const doMove = (d: 'L'|'R'|'U'|'D') => {
  const before = grid.map(r => [...r]);         // 복사
  const { grid: moved, gained } = applyMove(before, d);

  const changed = JSON.stringify(moved) !== JSON.stringify(grid);
  if (changed) {
    const withRandom = addRandom(moved);
    setScore(s => s + gained);
    setGrid(withRandom);
    if (noMoves(withRandom)) onGameOver((score + gained));
  }
};

  const noMoves=(g:Grid)=>{ for(let i=0;i<SIZE;i++)for(let j=0;j<SIZE;j++){ if(!g[i][j]) return false; if(i+1<SIZE&&g[i][j]===g[i+1][j]) return false; if(j+1<SIZE&&g[i][j]===g[i][j+1]) return false; } return true; };

  const reset=()=>{ setGrid(addRandom(addRandom(empty()))); setScore(0); };

  // 키보드(웹/시뮬) 지원
  useEffect(()=>{ const h=(e:any)=>{ if(e.key==='ArrowLeft')doMove('L'); if(e.key==='ArrowRight')doMove('R'); if(e.key==='ArrowUp')doMove('U'); if(e.key==='ArrowDown')doMove('D'); }; // @ts-ignore
    window?.addEventListener?.('keydown',h); return ()=>window?.removeEventListener?.('keydown',h); },[grid,score]);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>2048</Text>
      <View style={s.board}>
        {grid.map((row,i)=>(
          <View key={i} style={s.row}>
            {row.map((v,j)=>{
              const c = colors[v] ?? colors[0];
              return (
                <View key={j} style={[s.tile,{ backgroundColor:c.bg }]}>
                  {!!v && <Text style={[s.num,{ color:c.fg }]}>{v}</Text>}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={s.score}>Score: {score}</Text>
      <View style={s.controls}>
        {(['L','R','U','D'] as const).map(d=>(
          <TouchableOpacity key={d} onPress={()=>doMove(d)} style={s.btn}><Text style={s.btnTxt}>{d}</Text></TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={reset} style={[s.btn,{backgroundColor:'#212529'}]}><Text style={[s.btnTxt,{color:'#fff'}]}>다시하기</Text></TouchableOpacity>
      <View style={{ paddingHorizontal:16, paddingBottom:16, width:'100%' }}><Leaderboard gameId="2048-pro" /></View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:{ flex:1, alignItems:'center', backgroundColor:'#f8fafc', paddingTop:12 },
  title:{ fontSize:24, fontWeight:'800', marginBottom:8 },
  board:{ backgroundColor:'#e9edf3', padding:10, borderRadius:16, borderWidth:1, borderColor:'#d5dbe6' },
  row:{ flexDirection:'row' },
  tile:{ width:74, height:74, margin:6, borderRadius:12, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.05, shadowOffset:{width:0,height:2}, shadowRadius:4 },
  num:{ fontSize:22, fontWeight:'800' },
  score:{ marginVertical:8, fontWeight:'700' },
  controls:{ flexDirection:'row', gap:12, marginBottom:8 },
  btn:{ paddingVertical:10, paddingHorizontal:16, borderRadius:10, backgroundColor:'#eaf1ff', borderWidth:1, borderColor:'#cfe3ff' },
  btnTxt:{ fontSize:16, fontWeight:'800', color:'#1b3a6f' },
});
