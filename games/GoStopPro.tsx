// games/GoStopPro.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, SafeAreaView } from 'react-native';
import Leaderboard from '../components/Leaderboard';

type Kind = '광' | '열끗' | '띠' | '피' | '쌍피';
type Month = 1|2|3|4|5|6|7|8|9|10|11|12;

export type HwatuCard = {
  id: string;
  month: Month;
  kind: Kind;
  rainy?: boolean; // 11월 비광
  img?: any;       // require() 또는 URL(string)
};

const months = [1,2,3,4,5,6,7,8,9,10,11,12] as const;
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// ───────────────────────────────────────────────────────────────────────────────
// 로컬 이미지 매핑
// ───────────────────────────────────────────────────────────────────────────────
const LOCAL_IMG: Partial<Record<string, any>> = {
  // 12월
  '12-광-0': require('../assets/hwatu_cards/hwatu_01_01.png'),
  '12-띠-0': require('../assets/hwatu_cards/hwatu_01_02.png'),
  '12-열끗-0': require('../assets/hwatu_cards/hwatu_01_03.png'),
  '12-피-0': require('../assets/hwatu_cards/hwatu_01_04.png'),
  // 11월
  '11-광-0': require('../assets/hwatu_cards/hwatu_02_01.png'),
  '11-띠-0': require('../assets/hwatu_cards/hwatu_02_02.png'),
  '11-열끗-0': require('../assets/hwatu_cards/hwatu_02_03.png'),
  '11-피-0': require('../assets/hwatu_cards/hwatu_02_04.png'),
  // 10월
  '10-열끗-0': require('../assets/hwatu_cards/hwatu_03_01.png'),
  '10-띠-0': require('../assets/hwatu_cards/hwatu_03_02.png'),
  '10-피-0': require('../assets/hwatu_cards/hwatu_03_03.png'),
  '10-피-1': require('../assets/hwatu_cards/hwatu_03_04.png'),
  // 9월
  '09-열끗-0': require('../assets/hwatu_cards/hwatu_04_01.png'),
  '09-띠-0': require('../assets/hwatu_cards/hwatu_04_02.png'),
  '09-피-0': require('../assets/hwatu_cards/hwatu_04_03.png'),
  '09-피-1': require('../assets/hwatu_cards/hwatu_04_04.png'),
  // 8월
  '08-광-0': require('../assets/hwatu_cards/hwatu_05_01.png'),
  '08-열끗-0': require('../assets/hwatu_cards/hwatu_05_02.png'),
  '08-피-0': require('../assets/hwatu_cards/hwatu_05_03.png'),
  '08-피-1': require('../assets/hwatu_cards/hwatu_05_04.png'),
  // 7월
  '07-열끗-0': require('../assets/hwatu_cards/hwatu_07_01.png'),
  '07-열끗-1': require('../assets/hwatu_cards/hwatu_07_02.png'),
  '07-피-0': require('../assets/hwatu_cards/hwatu_07_03.png'),
  '07-피-1': require('../assets/hwatu_cards/hwatu_07_04.png'),
  // 6월
  '06-열끗-0': require('../assets/hwatu_cards/hwatu_06_01.png'),
  '06-띠-0': require('../assets/hwatu_cards/hwatu_06_02.png'),
  '06-피-0': require('../assets/hwatu_cards/hwatu_06_03.png'),
  '06-피-1': require('../assets/hwatu_cards/hwatu_06_04.png'),
  // 5월
  '05-열끗-0': require('../assets/hwatu_cards/hwatu_08_01.png'),
  '05-열끗-1': require('../assets/hwatu_cards/hwatu_08_02.png'),
  '05-피-0': require('../assets/hwatu_cards/hwatu_08_03.png'),
  '05-피-1': require('../assets/hwatu_cards/hwatu_08_04.png'),
  // 4월
  '04-열끗-0': require('../assets/hwatu_cards/hwatu_09_01.png'),
  '04-열끗-1': require('../assets/hwatu_cards/hwatu_09_02.png'),
  '04-피-0': require('../assets/hwatu_cards/hwatu_09_03.png'),
  '04-피-1': require('../assets/hwatu_cards/hwatu_09_04.png'),
  // 3월
  '03-광-0': require('../assets/hwatu_cards/hwatu_10_01.png'),
  '03-띠-0': require('../assets/hwatu_cards/hwatu_10_02.png'),
  '03-피-0': require('../assets/hwatu_cards/hwatu_10_03.png'),
  '03-피-1': require('../assets/hwatu_cards/hwatu_10_04.png'),
  // 2월
  '02-열끗-0': require('../assets/hwatu_cards/hwatu_11_01.png'),
  '02-띠-0': require('../assets/hwatu_cards/hwatu_11_02.png'),
  '02-피-0': require('../assets/hwatu_cards/hwatu_11_03.png'),
  '02-피-1': require('../assets/hwatu_cards/hwatu_11_04.png'),
  // 1월
  '01-광-0': require('../assets/hwatu_cards/hwatu_12_01.png'),
  '01-띠-0': require('../assets/hwatu_cards/hwatu_12_02.png'),
  '01-피-0': require('../assets/hwatu_cards/hwatu_12_03.png'),
  '01-피-1': require('../assets/hwatu_cards/hwatu_12_04.png'),
};

const IMG: Partial<Record<string, string>> = {
  '1-광-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Hanafuda_January_Hikari_Alt.svg/256px-Hanafuda_January_Hikari_Alt.svg.png',
  '3-광-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Hanafuda_March_Hikari_Alt.svg/256px-Hanafuda_March_Hikari_Alt.svg.png',
  '8-광-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Hanafuda_August_Hikari.svg/256px-Hanafuda_August_Hikari.svg.png',
  '11-광-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Hanafuda_November_Hikari.svg/256px-Hanafuda_November_Hikari.svg.png',
  '12-광-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Hanafuda_December_Hikari.svg/256px-Hanafuda_December_Hikari.svg.png',
  '2-띠-0':  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Hanafuda_February_Tanzaku_Alt.svg/256px-Hanafuda_February_Tanzaku_Alt.svg.png',
  '4-띠-0':  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Hanafuda_April_Tanzaku.svg/256px-Hanafuda_April_Tanzaku.svg.png',
  '6-띠-0':  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Hanafuda_June_Tanzaku.svg/256px-Hanafuda_June_Tanzaku.svg.png',
  '9-띠-0':  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hanafuda_September_Tanzaku.svg/256px-Hanafuda_September_Tanzaku.svg.png',
  '10-띠-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hanafuda_October_Tanzaku.svg/256px-Hanafuda_October_Tanzaku.svg.png',
  '2-열끗-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Hanafuda_February_Tane.svg/256px-Hanafuda_February_Tane.svg.png',
  '4-열끗-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Hanafuda_April_Tane.svg/256px-Hanafuda_April_Tane.svg.png',
  '7-열끗-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Hanafuda_July_Tane.svg/256px-Hanafuda_July_Tane.svg.png',
  '9-열끗-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Hanafuda_September_Tane.svg/256px-Hanafuda_September_Tane.svg.png',
  '1-피-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Hanafuda_January_Kasu_1_Alt.svg/256px-Hanafuda_January_Kasu_1_Alt.svg.png',
  '1-피-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Hanafuda_January_Kasu_2_Alt.svg/256px-Hanafuda_January_Kasu_2_Alt.svg.png',
  '8-피-0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Hanafuda_August_Kasu_2_Alt.svg/256px-Hanafuda_August_Kasu_2_Alt.svg.png',
};

// 종류 내 인덱스(kidx)로 키 생성
const cardImg = (m: number, kind: Exclude<Kind, '쌍피'>, kidx: number) => {
  const k = `${m}-${kind}-${kidx}`;
  if (LOCAL_IMG[k]) return LOCAL_IMG[k];
  if (IMG[k])       return IMG[k];
  return undefined;
};

// ───────────────────────────────────────────────────────────────────────────────
// 덱 구성(48장)
// ───────────────────────────────────────────────────────────────────────────────
function makeDeck(): HwatuCard[] {
  const cards: HwatuCard[] = [];
  let uid = 0;

  for (const m of months) {
    const month = m as Month;
    const kinds: Kind[] = ['피','피','띠','열끗'];
    if ([1,3,8,11,12].includes(month)) kinds[0] = '광';

    const rainy = month === 11;
    const doublePiIndex = (month === 11 || month === 12) ? 1 : -1;
    const kindCount: Record<'광'|'띠'|'열끗'|'피', number> = { 광:0, 띠:0, 열끗:0, 피:0 };

    kinds.forEach((k, idx) => {
      const id = `m${month}-${uid++}`;
      const isDoublePi = (idx === doublePiIndex && k === '피');
      const kind: Kind = isDoublePi ? '쌍피' : k;

      const displayKind = (kind === '쌍피' ? '피' : kind) as '광'|'띠'|'열끗'|'피';
      const kidx = kindCount[displayKind]++;
      const img = cardImg(month, displayKind, kidx);

      cards.push({
        id,
        month,
        kind,
        rainy: (kind === '광' && rainy) ? true : undefined,
        img,
      });
    });
  }
  return cards;
}

// ───────────────────────────────────────────────────────────────────────────────
// 점수 계산 (간이) — 이전 버전과 동일
// ───────────────────────────────────────────────────────────────────────────────
function scoreHand(taken: HwatuCard[]) {
  const gwang = taken.filter(c => c.kind === '광');
  const ddi = taken.filter(c => c.kind === '띠');
  const yul = taken.filter(c => c.kind === '열끗');
  const piCount = taken.filter(c => c.kind === '피').length + taken.filter(c => c.kind === '쌍피').length * 2;

  let score = 0;
  const hasRain = gwang.some(g => g.rainy);
  if (gwang.length >= 3) {
    if (gwang.length === 3) score += hasRain ? 2 : 3;
    if (gwang.length === 4) score += 4;
    if (gwang.length >= 5) score += 15;
  }
  if (ddi.length >= 5) score += 1 + (ddi.length - 5);
  if (yul.length >= 5) score += 1 + (yul.length - 5);

  const hasGodori = [2,4,8].every(m => yul.some(c => c.month === m));
  if (hasGodori) score += 5;

  const isHong = [1,2,3].every(m => ddi.some(c => c.month === m));
  const isCheong = [6,9,10].every(m => ddi.some(c => c.month === m));
  const isCho = [4,5,7].every(m => ddi.some(c => c.month === m));
  if (isHong) score += 3;
  if (isCheong) score += 3;
  if (isCho) score += 3;

  if (piCount >= 10) score += 1 + (piCount - 10);
  return { score, counts: { gwang: gwang.length, ddi: ddi.length, yul: yul.length, pi: piCount } };
}
const goMultiplier = (go: number) => (go >= 3 ? Math.pow(2, go - 2) : 1);
function bakMultipliers(wTaken: HwatuCard[], lTaken: HwatuCard[]) {
  const w = scoreHand(wTaken);
  const l = scoreHand(lTaken);
  let mul = 1;
  const wGwangScore = w.counts.gwang >= 3;
  if (wGwangScore && l.counts.gwang === 0) mul *= 2;
  const wPiScore = w.counts.pi >= 10;
  if (wPiScore && l.counts.pi < 10) mul *= 2;
  const wDdiScore = w.counts.ddi >= 5;
  const wYulScore = w.counts.yul >= 5;
  const lDdiLow = l.counts.ddi < 5;
  const lYulLow = l.counts.yul < 5;
  if ((wDdiScore && lDdiLow) || (wYulScore && lYulLow)) mul *= 2;
  return mul;
}
const dokBakMultiplier = (goLeader: 'P'|'C'|null, winner: 'P'|'C') => (goLeader && goLeader !== winner ? 2 : 1);
const bgByKind = (k: Kind) => k==='광' ? '#ffd166' : k==='열끗' ? '#f4978e' : k==='띠' ? '#90be6d' : k==='쌍피' ? '#6c757d' : '#a8dadc';

// ───────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트 (상/중/하 3분할 레이아웃)
// ───────────────────────────────────────────────────────────────────────────────
export default function GoStopPro({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [deck, setDeck] = useState<HwatuCard[]>([]);
  const [center, setCenter] = useState<HwatuCard[]>([]);
  const [pHand, setPHand] = useState<HwatuCard[]>([]);
  const [cHand, setCHand] = useState<HwatuCard[]>([]);
  const [pTaken, setPTaken] = useState<HwatuCard[]>([]);
  const [cTaken, setCTaken] = useState<HwatuCard[]>([]);

  const [lead, setLead] = useState<'P'|'C'>('P');
  const [turn, setTurn] = useState<'P'|'C'>('P');

  const [pGo, setPGo] = useState(0);
  const [cGo, setCGo] = useState(0);
  const [goLeader, setGoLeader] = useState<'P'|'C'|null>(null);
  const [ended, setEnded] = useState(false);

  // 카드 사이즈를 화면 폭 기준으로 유연하게
  const { height, width } = useWindowDimensions();
  const CARD_W = Math.min(64, Math.max(48, Math.floor(width * 0.16)));
  const CARD_H = Math.floor(CARD_W * 1.53);

  // 분배/초기화
  const deal = () => {
    const d = shuffle(makeDeck());

    // 선 결정: 서로 월 한 장 가상으로 뽑아 큰 쪽이 선
    let pPick = d[0].month, cPick = d[1].month, idx = 2;
    while (pPick === cPick) { pPick = d[idx++].month; cPick = d[idx++].month; }
    const first = pPick >= cPick ? 'P' : 'C';
    setLead(first); setTurn(first);

    const p = d.slice(idx, idx+7);
    const c = d.slice(idx+7, idx+14);
    const board = d.slice(idx+14, idx+20);
    const pile = d.slice(idx+20);

    setPHand(p); setCHand(c); setCenter(board); setDeck(pile);
    setPTaken([]); setCTaken([]);
    setPGo(0); setCGo(0); setGoLeader(null);
    setEnded(false);
  };
  useEffect(() => { deal(); }, []);

  // 점수
  const pEval = useMemo(() => scoreHand(pTaken), [pTaken]);
  const cEval = useMemo(() => scoreHand(cTaken), [cTaken]);
  const someoneCanGo = (who: 'P'|'C') => (who==='P' ? pEval.score : cEval.score) >= 3;

  // 매칭
  const matchCenter = (card: HwatuCard, who: 'P'|'C') => {
    const idx = center.findIndex(c => c.month === card.month);
    if (idx >= 0) {
      const pair = center[idx];
      setCenter(prev => prev.filter((_,i)=>i!==idx));
      if (who==='P') setPTaken(prev => [...prev, card, pair]);
      else setCTaken(prev => [...prev, card, pair]);
    } else {
      setCenter(prev => [...prev, card]);
    }
  };
  const flipFromDeck = (who: 'P'|'C') => {
    if (deck.length === 0) return;
    const top = deck[0];
    setDeck(prev => prev.slice(1));
    matchCenter(top, who);
  };

  // 플레이
  const playCardP = (card: HwatuCard) => {
    if (ended || turn!=='P') return;
    setPHand(prev => prev.filter(c => c.id !== card.id));
    matchCenter(card, 'P');
    flipFromDeck('P');
    afterTurn('P');
  };
  const playCardC = () => {
    if (ended || turn!=='C') return;
    const idx = cHand.findIndex(ch => center.some(cc => cc.month === ch.month));
    const useIdx = idx>=0 ? idx : 0;
    const card = cHand[useIdx];
    setCHand(prev => prev.filter((_,i)=>i!==useIdx));
    matchCenter(card, 'C');
    flipFromDeck('C');
    afterTurn('C');
  };

  const afterTurn = (who: 'P'|'C') => {
    if ((pHand.length===0 && who==='P') || (cHand.length===0 && who==='C') || deck.length===0) {
      endByStop(finalWinner(), 'Stop(auto)'); return;
    }
    if (someoneCanGo(who)) {
      if (who==='P') {
        Alert.alert('Go / Stop', '3점 이상입니다. 계속(Go) 하시겠어요?', [
          { text: 'Stop', onPress: () => endByStop('P', 'Stop') },
          { text: 'Go',   onPress: () => { setPGo(g=>g+1); if (!goLeader) setGoLeader('P'); nextTurn(); } },
        ]);
      } else {
        const cScore = cEval.score;
        let doGo = false;
        if (cScore===3) doGo = true;
        else if (cScore===4) doGo = Math.random() < 0.7;
        else if (cScore>=5) doGo = Math.random() < 0.4;
        if (doGo) { setCGo(g=>g+1); if (!goLeader) setGoLeader('C'); nextTurn(); }
        else endByStop('C', 'Stop');
      }
    } else nextTurn();
  };
  const nextTurn = () => setTurn(t => (t==='P' ? 'C' : 'P'));
  const finalWinner = (): 'P'|'C' => (pEval.score >= cEval.score ? 'P' : 'C');

  const settle = (winner: 'P'|'C') => {
    const wTaken = winner==='P'? pTaken : cTaken;
    const lTaken = winner==='P'? cTaken : pTaken;
    const wGo = winner==='P'? pGo : cGo;
    const base = (winner==='P'? pEval.score : cEval.score);
    const gm = goMultiplier(wGo);
    const bm = bakMultipliers(wTaken, lTaken);
    const dm = dokBakMultiplier(goLeader, winner);
    const total = Math.max(1, base) * gm * bm * dm;
    return { total, base, gm, bm, dm };
  };
  const endByStop = (winner: 'P'|'C', reason: 'Stop'|'Stop(auto)') => {
    if (ended) return;
    setEnded(true);
    const { total, base, gm, bm, dm } = settle(winner);
    const msg = [
      `승자: ${winner==='P'?'플레이어':'CPU'} (${reason})`,
      `기본점수: ${base}`,
      `고 배율: x${gm}`,
      `박 배율: x${bm}`,
      `독박: x${dm}`,
      `= 합계: ${total}`,
      '',
      '다음 판을 시작할까요? (승자가 선)'
    ].join('\n');
    Alert.alert('게임 종료', msg, [
      { text: '닫기' },
      { text: '다음 판', onPress: () => { setLead(winner); startNextRound(winner); } }
    ]);
    if (winner==='P') onGameOver(total);
  };
  const startNextRound = (first: 'P'|'C') => {
    const d = shuffle(makeDeck());
    const p = d.slice(0,7);
    const c = d.slice(7,14);
    const board = d.slice(14,20);
    const pile = d.slice(20);
    setPHand(p); setCHand(c); setCenter(board); setDeck(pile);
    setPTaken([]); setCTaken([]);
    setPGo(0); setCGo(0); setGoLeader(null);
    setTurn(first); setEnded(false);
  };

  // 공통 카드 렌더러
  const renderCard = (c: HwatuCard, onPress?: () => void) => {
    const content = c.img ? (
      typeof c.img === 'string'
        ? <Image source={{ uri: c.img }} style={{ width: CARD_W, height: CARD_H }} resizeMode="cover" />
        : <Image source={c.img} style={{ width: CARD_W, height: CARD_H }} resizeMode="cover" />
    ) : (
      <View style={[{ width: CARD_W, height: CARD_H }, st.fallback, { backgroundColor: bgByKind(c.kind) }]}>
        <Text style={st.fbMonth}>{c.month}월</Text>
        <Text style={st.fbKind}>{c.kind}{c.rainy ? '(비)' : ''}</Text>
      </View>
    );
    return onPress
      ? <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: CARD_W, height: CARD_H, borderRadius:6, overflow:'hidden', marginRight:8 }}>{content}</TouchableOpacity>
      : <View style={{ width: CARD_W, height: CARD_H, borderRadius:6, overflow:'hidden', marginRight:8 }}>{content}</View>;
  };

  // 카드 뒷면(상단 CPU 손패 표시용)
  const CardBack = () => (
    <View style={{ width: CARD_W, height: CARD_H, borderRadius:6, backgroundColor:'#222', borderWidth:1, borderColor:'#444', marginRight:8, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color:'#bbb', fontWeight:'700' }}>CPU</Text>
    </View>
  );

  return (
    <SafeAreaView style={[st.wrap]}>
      {/* 헤더 */}
      <View style={{ paddingVertical:6 }}>
        <Text style={st.title}>고스톱 Pro</Text>
        <Text style={st.sub}>선: {lead==='P'?'플레이어':'CPU'} / 현재: {turn==='P'?'플레이어':'CPU'}</Text>
      </View>

      {/* 상단(컴퓨터 손패 영역) */}
      <View style={{ flex: 3, alignItems:'center', paddingHorizontal:10 }}>
        <Text style={st.sectionSmall}>CPU 손패 · 고 {cGo} · 점수 {cEval.score}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: CARD_H }}>
          {/* 손패는 숨김: 뒷면으로 표시 */}
          {Array.from({ length: cHand.length }).map((_, i) => <CardBack key={`cb-${i}`} />)}
        </ScrollView>
        {/* CPU가 딴 패(작게) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:6, maxHeight: Math.floor(CARD_H*0.7) }}>
          {cTaken.map(c => (
            <View key={c.id} style={{ transform:[{ scale: 0.7 }], marginRight: -4 }}>
              {renderCard(c)}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 중앙(게임판) */}
      <View style={{ flex: 5, marginHorizontal:10, marginVertical:6, padding:8, borderRadius:12, backgroundColor:'#0b4636', borderWidth:1, borderColor:'#09382b' }}>
        <Text style={st.section}>바닥(남은 더미 {deck.length})</Text>
        <View style={{ flex:1, alignItems:'center' }}>
          <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center' }}>
            {center.map(c => <View key={c.id} style={{ margin:4 }}>{renderCard(c)}</View>)}
          </View>
        </View>
        {/* CPU 자동 플레이 버튼 */}
        {turn==='C' && !ended && (
          <TouchableOpacity onPress={playCardC} style={[st.btn, { alignSelf:'center', marginTop:6 }]}>
            <Text style={st.btnTxt}>CPU 플레이</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 하단(플레이어 손패 영역) */}
      <View style={{ flex: 4, alignItems:'center', paddingHorizontal:10, paddingBottom:8 }}>
        <Text style={st.sectionSmall}>내 손패 · 고 {pGo} · 점수 {pEval.score}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: CARD_H }}>
          {pHand.map(c => <View key={c.id}>{renderCard(c, ()=> turn==='P' && playCardP(c))}</View>)}
        </ScrollView>
        {/* 내가 딴 패(작게) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:6, maxHeight: Math.floor(CARD_H*0.7) }}>
          {pTaken.map(c => (
            <View key={c.id} style={{ transform:[{ scale: 0.7 }], marginRight: -4 }}>
              {renderCard(c)}
            </View>
          ))}
        </ScrollView>

        {/* 하단 컨트롤/리더보드 */}
        <View style={{ width:'100%', marginTop:8 }}>
          <TouchableOpacity onPress={deal} style={[st.btn, { backgroundColor:'#1e7a60' }]}>
            <Text style={st.btnTxt}>새 판(선 무작위)</Text>
          </TouchableOpacity>
          <View style={{ marginTop:6 }}>
            <Leaderboard gameId="gostop-pro" />
          </View>
          <Text style={st.license}>카드 이미지: 로컬 매핑 우선. 없으면 URL/텍스트 폴백.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  wrap:{ flex:1, backgroundColor:'#0f5b44' },
  title:{ fontSize:20, fontWeight:'800', color:'#fff', textAlign:'center' },
  sub:{ textAlign:'center', color:'#e2f0ea' },

  section:{ color:'#bfe3d6', fontWeight:'700', marginBottom:6, marginLeft:4 },
  sectionSmall:{ color:'#d7efe6', fontWeight:'700', marginBottom:6 },

  fallback:{ alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#052b21', borderRadius:6 },
  fbMonth:{ fontSize:14, fontWeight:'800', color:'#052b21' },
  fbKind:{ fontSize:13, fontWeight:'700', color:'#052b21' },

  btn:{ marginTop:8, paddingVertical:10, borderRadius:10, alignItems:'center', backgroundColor:'#2b2f33' },
  btnTxt:{ color:'#fff', fontWeight:'800' },

  license:{ marginTop:6, color:'#cde7dd', fontSize:12, lineHeight:16 }
});
