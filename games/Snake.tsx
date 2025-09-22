import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  LayoutChangeEvent,
} from 'react-native';
import Leaderboard from '../components/Leaderboard';

type Cell = { x: number; y: number };
type Dir = 'U' | 'D' | 'L' | 'R';

const TILE = 18;
const SPEED_MS = 120;

function eq(a: Cell, b: Cell) {
  return a.x === b.x && a.y === b.y;
}

export default function Snake({ onGameOver }: { onGameOver: (n: number) => void }) {
  const { width, height } = useWindowDimensions();
  const SAFE = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  const [topChromeH, setTopChromeH] = useState(0);
  // ✅ 초기값을 넉넉히(예: 240) — 첫 렌더에서 보드가 아래를 덮는 걸 방지
  const [bottomChromeH, setBottomChromeH] = useState(240);

  const boardMaxH = Math.max(0, Math.floor(height - SAFE - topChromeH - bottomChromeH));
  const COLS = Math.max(8, Math.floor(width / TILE));
  const ROWS = Math.max(8, Math.floor(boardMaxH / TILE));

  const boardStyle = useMemo(
    () => ({ width: COLS * TILE, height: ROWS * TILE }),
    [COLS, ROWS]
  );

  const randCell = (): Cell => ({
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS),
  });

  const [snake, setSnake] = useState<Cell[]>([{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }]);
  const [dir, setDir] = useState<Dir>('R');
  const [food, setFood] = useState<Cell>(() => randCell());
  const [score, setScore] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    setSnake((prev) =>
      prev
        .map((p) => ({
          x: Math.min(COLS - 1, Math.max(0, p.x)),
          y: Math.min(ROWS - 1, Math.max(0, p.y)),
        }))
        .filter((p) => p.x >= 0 && p.y >= 0)
    );
    setFood((f) => ({
      x: Math.min(COLS - 1, Math.max(0, f.x)),
      y: Math.min(ROWS - 1, Math.max(0, f.y)),
    }));
  }, [COLS, ROWS]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(tick, SPEED_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [dir]);

  const tick = () => {
    if (!alive.current) return;
    setSnake((prev) => {
      if (prev.length === 0) return prev;
      const head = prev[0];
      const next: Cell = {
        x: head.x + (dir === 'L' ? -1 : dir === 'R' ? 1 : 0),
        y: head.y + (dir === 'U' ? -1 : dir === 'D' ? 1 : 0),
      };
      if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) { die(); return prev; }
      if (prev.some((p) => eq(p, next))) { die(); return prev; }

      const ate = eq(next, food);
      const body = [next, ...prev];
      if (!ate) body.pop(); else {
        setScore((s) => s + 10);
        let f = randCell();
        while (body.some((p) => eq(p, f))) f = randCell();
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
    if ((dir === 'L' && d === 'R') || (dir === 'R' && d === 'L') || (dir === 'U' && d === 'D') || (dir === 'D' && d === 'U')) return;
    setDir(d);
  };

  const reset = () => {
    alive.current = true;
    setSnake([{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }]);
    setDir('R'); setFood(randCell()); setScore(0);
  };

  const onTopLayout = (e: LayoutChangeEvent) => {
    const { height: h } = e.nativeEvent.layout;
    setTopChromeH(h);
  };
  const onBottomLayout = (e: LayoutChangeEvent) => {
    const { height: h } = e.nativeEvent.layout;
    // ✅ 실측값으로 업데이트(최대치 유지해서 깜빡임/덮임 방지)
    setBottomChromeH((prev) => (h > prev ? h : prev));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.chrome} onLayout={onTopLayout}>
          <Text style={styles.title}>Snake</Text>
        </View>

        {/* 보드 (항상 하단 컨트롤보다 아래 zIndex) */}
        <View style={[styles.board, boardStyle]} pointerEvents="auto">
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const x = i % COLS, y = Math.floor(i / COLS);
            const dark = (x + y) % 2 === 0;
            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  { left: x * TILE, top: y * TILE, backgroundColor: dark ? '#e6f0ff' : '#f4f8ff' },
                ]}
              />
            );
          })}
          <View style={[styles.food, { left: food.x * TILE, top: food.y * TILE }]} />
          {snake.map((p, i) => (
            <View
              key={`${p.x}-${p.y}-${i}`}
              style={[styles.snake, { left: p.x * TILE, top: p.y * TILE, opacity: i === 0 ? 1 : 0.9 }]}
            />
          ))}
        </View>

        {/* ✅ 하단 컨트롤: 항상 최상위 레이어에서 터치 우선 */}
        <View
          style={styles.bottomChrome}
          onLayout={onBottomLayout}
          // Android에서 특정 케이스에 Board가 터치 먹는 경우 대비
          pointerEvents="box-none"
        >
          <Text style={styles.score}>Score: {score}</Text>

          <View style={styles.padRow}>
            <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('U')}>
              <Text style={styles.btnTxt}>↑</Text>
            </Pressable>
          </View>
          <View style={styles.padRow}>
            <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('L')}>
              <Text style={styles.btnTxt}>←</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('D')}>
              <Text style={styles.btnTxt}>↓</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.sm]} onPress={() => turn('R')}>
              <Text style={styles.btnTxt}>→</Text>
            </Pressable>
          </View>

          {/* ✅ Leaderboard 래퍼는 부모 터치 막지 않게 */}
          <View pointerEvents="box-none" style={{ paddingHorizontal: 16, paddingBottom: 16, width: '100%' }}>
            <Pressable onPress={reset} style={[styles.btn, { backgroundColor: '#222' }]}>
              <Text style={[styles.btnTxt, { color: '#fff' }]}>다시하기</Text>
            </Pressable>
            <Leaderboard gameId="snake" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7fbff' },
  screen: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  chrome: { width: '100%', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 8 },

  // ✅ 보드는 기본 zIndex 0
  board: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cfe3ff',
    zIndex: 0,
  },

  // ✅ 하단 컨트롤은 항상 위 (Android는 elevation까지)
  bottomChrome: {
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
    ...(Platform.OS === 'android' ? { elevation: 8 } : null),
  },

  cell: { position: 'absolute', width: TILE, height: TILE },
  food: { position: 'absolute', width: TILE, height: TILE, backgroundColor: '#ff4757', borderRadius: 6, borderWidth: 1, borderColor: '#b91423' },
  snake: { position: 'absolute', width: TILE, height: TILE, backgroundColor: '#2ed573', borderRadius: 6, borderWidth: 1, borderColor: '#1e9f52' },
  score: { marginTop: 8, fontSize: 16, fontWeight: '700' },
  padRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#eef4ff', borderWidth: 1, borderColor: '#cfe3ff', marginTop: 6, alignSelf: 'center' },
  sm: { minWidth: 64, alignItems: 'center' },
  btnTxt: { fontSize: 18, fontWeight: '800', color: '#1b3a6f' },
});
