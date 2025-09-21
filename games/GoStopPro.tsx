// games/GoStopPro.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

/**
 * 고스톱 Pro (2인용) — 구현 범위
 * - 선(Lead) 결정: 시작 시 무작위(월 뽑기) → 선이 먼저 시작
 * - 패 돌림: 7장씩, 바닥 6장, 더미 21장 (일반 4+3 분배 결과만 맞춤)
 * - 턴: 선부터 반시계(2인이므로 교대) — 손패 한 장 내려놓기 → 더미에서 한 장 뒤집기 → 월 매칭 먹기
 * - 점수: 광/띠/열끗/피 + 고도리/단(홍·청·초) 간이룰 (Lite에서 사용한 scoreHand 개선)
 * - Go/Stop: 3점 이상 시 선택, 표의 고 배율(3고부터 2^n) 적용
 * - 박 배율(간이): 광박/피박/멍박(띠·열끗 중 한쪽 “세트 점수 조건 미충족”인 경우) ×2
 * - 독박(고박): 먼저 Go한 사람이 아닌 상대가 먼저 Stop으로 승리하면 ×2
 * - 승리: Stop 선언 시 종료(2인 기준), 다음 판 선은 승자
 *
 * TODO 훅: 뻑/따닥/쪽/쓸/폭탄/흔들기, 더블(2덱), 미션/월약, 3장동월 선택 UI 등
 */

type Kind = '광' | '열끗' | '띠' | '피' | '쌍피';
type Month = 1|2|3|4|5|6|7|8|9|10|11|12;

export type HwatuCard = {
  id: string;
  month: Month;
  kind: Kind;
  rainy?: boolean; // 11월 비광
  img?: any;       // 로컬 require() 또는 원격 URL(string)
};

const months = [1,2,3,4,5,6,7,8,9,10,11,12] as const;
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// ───────────────────────────────────────────────────────────────────────────────
// 로컬 이미지 매핑 (assets/hwatu_cards/hwatu_MM_NN.png)
// ───────────────────────────────────────────────────────────────────────────────
// 중요: React Native의 require()는 "정적 리터럴"만 허용되므로, 모든 파일을 명시적으로 나열해야 함.
// 규칙(요청 반영): "01_01 이 12월 광"
// ⇒ MM = (13 - month) 를 zero-pad(예: 12월 → MM='01', 11월 → '02', …, 1월 → '12')
// ⇒ NN(01~04)은 월 내 파일 순서. 어떤 파일이 어떤 종류(광/띠/열끗/피)인지 프로젝트마다 다를 수 있어,
//    아래 매핑은 '예시/스켈레톤'이며, 확정된 배치에 맞춰 키만 채우면 됨.
//    (채우지 않은 키는 텍스트 카드로 폴백)

const LOCAL_IMG: Partial<Record<string, any>> = {
  // ✔️ 명시된 규칙: 12월(월=12) 광('12-광-0') → hwatu_01_01.png
  '12-광-0': require('../assets/hwatu_cards/hwatu_01_01.png'),
  // '12-광-0' : require('../assets')

  // ▽▽▽ 아래는 채워넣기 예시(주석 해제 후 실제 파일에 맞게 교체) ▽▽▽
  // '12-띠-0': require('../../assets/hwatu_cards/hwatu_01_02.png'),
  // '12-열끗-0': require('../../assets/hwatu_cards/hwatu_01_03.png'),
  // '12-피-0': require('../../assets/hwatu_cards/hwatu_01_04.png'),

  // '11-광-0': require('../../assets/hwatu_cards/hwatu_02_01.png'),
  // '11-띠-0': require('../../assets/hwatu_cards/hwatu_02_02.png'),
  // '11-열끗-0': require('../../assets/hwatu_cards/hwatu_02_03.png'),
  // '11-피-0': require('../../assets/hwatu_cards/hwatu_02_04.png'),

  // ... 10월(~MM='03') ~ 1월(~MM='12')까지 같은 패턴으로 추가 ...
};

// (선택) 원격 이미지 폴백 — 매핑이 비어 있는 경우 텍스트 카드 대신 써도 됨
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

// 월/종류(index) → 로컬 또는 원격 이미지 해석
const toMM = (month: number) => String(13 - month).padStart(2, '0'); // 12→01, 11→02, …, 1→12
const cardImg = (m: number, kind: Kind, index: number) => {
  const k = `${m}-${(kind === '쌍피' ? '피' : kind)}-${index}`;
  // 1) 로컬 매핑 우선
  if (LOCAL_IMG[k]) return LOCAL_IMG[k];
  // 2) 원격 폴백(URL)
  if (IMG[k]) return IMG[k];
  // 3) 둘 다 없으면 undefined → 텍스트 카드로 폴백
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

    // 기본: 피/피/띠/열끗 (일부 월은 광 치환)
    const kinds: Kind[] = ['피','피','띠','열끗'];
    if ([1,3,8,11,12].includes(month)) kinds[0] = '광';

    const rainy = month === 11;
    const doublePiIndex = (month === 11 || month === 12) ? 1 : -1;

    kinds.forEach((k, idx) => {
      const id = `m${month}-${uid++}`;
      const kind: Kind = (idx === doublePiIndex && k === '피') ? '쌍피' : k;

      // index는 월 내 동일 종류 중 0 또는 1 정도만 사용.
      // 로컬 파일명 NN(01~04)은 프로젝트 규칙에 맞춰 LOCAL_IMG에서 키만 맞추면 됨.
      const img = cardImg(month, kind, kind === '광' ? 0 : idx);

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
// 점수 계산 (간이)
// ───────────────────────────────────────────────────────────────────────────────
function scoreHand(taken: HwatuCard[]) {
  const gwang = taken.filter(c => c.kind === '광');
  const ddi = taken.filter(c => c.kind === '띠');
  const yul = taken.filter(c => c.kind === '열끗');
  const piCount = taken.filter(c => c.kind === '피').length + taken.filter(c => c.kind === '쌍피').length * 2;

  let score = 0;

  // 광 (비광 고려)
  const hasRain = gwang.some(g => g.rainy);
  if (gwang.length >= 3) {
    if (gwang.length === 3) score += hasRain ? 2 : 3;
    if (gwang.length === 4) score += 4;
    if (gwang.length >= 5) score += 15;
  }

  // 띠 (5장 이상부터)
  if (ddi.length >= 5) score += 1 + (ddi.length - 5);

  // 열끗 (5장 이상부터)
  if (yul.length >= 5) score += 1 + (yul.length - 5);

  // 고도리 (2/4/8월 열끗)
  const hasGodori = [2,4,8].every(m => yul.some(c => c.month === m));
  if (hasGodori) score += 5;

  // 단(홍/청/초)
  const isHong = [1,2,3].every(m => ddi.some(c => c.month === m));
  const isCheong = [6,9,10].every(m => ddi.some(c => c.month === m));
  const isCho = [4,5,7].every(m => ddi.some(c => c.month === m));
  if (isHong) score += 3;
  if (isCheong) score += 3;
  if (isCho) score += 3;

  // 피
  if (piCount >= 10) score += 1 + (piCount - 10);

  return { score, counts: { gwang: gwang.length, ddi: ddi.length, yul: yul.length, pi: piCount } };
}

// 고 배율: (go>=3) ? 2^(go-2) : 1
const goMultiplier = (go: number) => (go >= 3 ? Math.pow(2, go - 2) : 1);

// 박(간이)
function bakMultipliers(wTaken: HwatuCard[], lTaken: HwatuCard[]) {
  const w = scoreHand(wTaken);
  const l = scoreHand(lTaken);
  let mul = 1;

  // 광박
  const wGwangScore = w.counts.gwang >= 3;
  if (wGwangScore && l.counts.gwang === 0) mul *= 2;

  // 피박
  const wPiScore = w.counts.pi >= 10;
  if (wPiScore && l.counts.pi < 10) mul *= 2;

  // 멍박(띠/열끗 중 하나라도 승자 득점(≥5) 충족, 패자 <5)
  const wDdiScore = w.counts.ddi >= 5;
  const wYulScore = w.counts.yul >= 5;
  const lDdiLow = l.counts.ddi < 5;
  const lYulLow = l.counts.yul < 5;
  if ((wDdiScore && lDdiLow) || (wYulScore && lYulLow)) mul *= 2;

  return mul;
}

// 독박(고박)
const dokBakMultiplier = (goLeader: 'P'|'C'|null, winner: 'P'|'C') => (goLeader && goLeader !== winner ? 2 : 1);

// UI 보조
const bgByKind = (k: Kind) => k==='광' ? '#ffd166' : k==='열끗' ? '#f4978e' : k==='띠' ? '#90be6d' : k==='쌍피' ? '#6c757d' : '#a8dadc';

// ───────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ───────────────────────────────────────────────────────────────────────────────
export default function GoStopPro({ onGameOver }: { onGameOver: (score: number) => void }) {
  // 덱/보드
  const [deck, setDeck] = useState<HwatuCard[]>([]);
  const [center, setCenter] = useState<HwatuCard[]>([]);
  const [pHand, setPHand] = useState<HwatuCard[]>([]);
  const [cHand, setCHand] = useState<HwatuCard[]>([]);
  const [pTaken, setPTaken] = useState<HwatuCard[]>([]);
  const [cTaken, setCTaken] = useState<HwatuCard[]>([]);

  // 선/턴
  const [lead, setLead] = useState<'P'|'C'>('P');
  const [turn, setTurn] = useState<'P'|'C'>('P');

  // Go/Stop
  const [pGo, setPGo] = useState(0);
  const [cGo, setCGo] = useState(0);
  const [goLeader, setGoLeader] = useState<'P'|'C'|null>(null);

  // 종료 상태
  const [ended, setEnded] = useState(false);

  // 초기 분배
  const deal = () => {
    const d = shuffle(makeDeck());

    // 선 결정: 서로 월 한 장 가상으로 뽑아 큰 쪽이 선
    let pPick = d[0].month, cPick = d[1].month, idx = 2;
    while (pPick === cPick) { pPick = d[idx++].month; cPick = d[idx++].month; }
    const first = pPick >= cPick ? 'P' : 'C';
    setLead(first);
    setTurn(first);

    // 분배: 손7/손7/바닥6/더미21
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

  // 점수(현재 획득패 기준)
  const pEval = useMemo(() => scoreHand(pTaken), [pTaken]);
  const cEval = useMemo(() => scoreHand(cTaken), [cTaken]);

  const someoneCanGo = (who: 'P'|'C') => {
    const s = who==='P' ? pEval.score : cEval.score;
    return s >= 3;
  };

  // 중앙 월 매칭(간이)
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

  // 더미 뒤집기
  const flipFromDeck = (who: 'P'|'C') => {
    if (deck.length === 0) return;
    const top = deck[0];
    setDeck(prev => prev.slice(1));
    matchCenter(top, who);
  };

  // 플레이 동작
  const playCardP = (card: HwatuCard) => {
    if (ended || turn!=='P') return;
    setPHand(prev => prev.filter(c => c.id !== card.id));
    matchCenter(card, 'P');
    flipFromDeck('P');
    afterTurn('P');
  };
  const playCardC = () => {
    if (ended || turn!=='C') return;
    // 간단 전략: 보드에 월이 있는 카드를 우선
    const idx = cHand.findIndex(ch => center.some(cc => cc.month === ch.month));
    const useIdx = idx>=0 ? idx : 0;
    const card = cHand[useIdx];
    setCHand(prev => prev.filter((_,i)=>i!==useIdx));
    matchCenter(card, 'C');
    flipFromDeck('C');
    afterTurn('C');
  };

  // 턴 종료 처리(Go/Stop 트리거)
  const afterTurn = (who: 'P'|'C') => {
    // 손패·더미 소진 시 자동 종료
    if ((pHand.length===0 && who==='P') || (cHand.length===0 && who==='C') || deck.length===0) {
      endByStop(finalWinner(), 'Stop(auto)');
      return;
    }

    if (someoneCanGo(who)) {
      if (who==='P') {
        Alert.alert('Go / Stop', '3점 이상입니다. 계속(Go) 하시겠어요?', [
          { text: 'Stop', onPress: () => endByStop('P', 'Stop') },
          { text: 'Go',   onPress: () => { setPGo(g=>g+1); if (!goLeader) setGoLeader('P'); nextTurn(); } },
        ]);
      } else {
        // CPU 간단 로직
        const cScore = cEval.score;
        let doGo = false;
        if (cScore===3) doGo = true;
        else if (cScore===4) doGo = Math.random() < 0.7;
        else if (cScore>=5) doGo = Math.random() < 0.4;

        if (doGo) {
          setCGo(g=>g+1); if (!goLeader) setGoLeader('C');
          nextTurn();
        } else {
          endByStop('C', 'Stop');
        }
      }
    } else {
      nextTurn();
    }
  };

  const nextTurn = () => setTurn(t => (t==='P' ? 'C' : 'P'));

  // 승자 판정(Stop 또는 소진 종료용) — 단순 점수 비교
  const finalWinner = (): 'P'|'C' => (pEval.score >= cEval.score ? 'P' : 'C');

  // 최종 정산
  const settle = (winner: 'P'|'C') => {
    const wTaken = winner==='P'? pTaken : cTaken;
    const lTaken = winner==='P'? cTaken : pTaken;
    const wGo = winner==='P'? pGo : cGo;

    const base = (winner==='P'? pEval.score : cEval.score);
    const gm = goMultiplier(wGo);
    const bm = bakMultipliers(wTaken, lTaken);
    const dm = dokBakMultiplier(goLeader, winner);

    const total = Math.max(1, base) * gm * bm * dm; // 최소 1점 보장
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
      { text: '다음 판', onPress: () => {
          // 승자가 다음 선
          setLead(winner);
          startNextRound(winner);
        }
      }
    ]);

    // 리더보드: 승자 total 기록
    if (winner==='P') onGameOver(total);
  };

  const startNextRound = (first: 'P'|'C') => {
    const d = shuffle(makeDeck());
    // 7/7/6/21 분배
    const p = d.slice(0,7);
    const c = d.slice(7,14);
    const board = d.slice(14,20);
    const pile = d.slice(20);

    setPHand(p); setCHand(c); setCenter(board); setDeck(pile);
    setPTaken([]); setCTaken([]);
    setPGo(0); setCGo(0); setGoLeader(null);
    setTurn(first);
    setEnded(false);
  };

  // 렌더
  const renderCard = (c: HwatuCard, onPress?: () => void) => {
    const content = c.img ? (
      typeof c.img === 'string'
        ? <Image source={{ uri: c.img }} style={st.cardImg} resizeMode="cover" />
        : <Image source={c.img} style={st.cardImg} resizeMode="cover" />
    ) : (
      <View style={[st.cardImg, st.fallback, { backgroundColor: bgByKind(c.kind) }]}>
        <Text style={st.fbMonth}>{c.month}월</Text>
        <Text style={st.fbKind}>{c.kind}{c.rainy ? '(비)' : ''}</Text>
      </View>
    );
    return onPress ? (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={st.cardWrap}>
        {content}
      </TouchableOpacity>
    ) : (
      <View style={st.cardWrap}>{content}</View>
    );
  };

  return (
    <View style={st.wrap}>
      <Text style={st.title}>고스톱 Pro</Text>
      <Text style={st.sub}>
        선: {lead==='P'?'플레이어':'CPU'} / 현재: {turn==='P'?'플레이어':'CPU'}
      </Text>

      <View style={st.panel}>
        <Text style={st.section}>바닥(6장, 남은 더미 {deck.length})</Text>
        <View style={st.centerGrid}>
          {center.map(c => <View key={c.id}>{renderCard(c)}</View>)}
        </View>
      </View>

      <View style={st.panel}>
        <Text style={st.section}>내가 딴 패 (점수 {pEval.score}, 고 {pGo})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pTaken.map(c => <View key={c.id}>{renderCard(c)}</View>)}
        </ScrollView>
      </View>

      <View style={st.panel}>
        <Text style={st.section}>CPU가 딴 패 (점수 {cEval.score}, 고 {cGo})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cTaken.map(c => <View key={c.id}>{renderCard(c)}</View>)}
        </ScrollView>
      </View>

      <View style={st.panel}>
        <Text style={st.section}>내 패 (7장에서 감소, {turn==='P'?'내 차례':'CPU 차례'})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pHand.map(c => (
            <View key={c.id} style={{ marginRight:8 }}>
              {renderCard(c, ()=> turn==='P' && playCardP(c))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* CPU 자동 플레이 버튼(디버그/모바일 편의) */}
      <View style={{ paddingHorizontal:16, paddingBottom:10 }}>
        {turn==='C' && !ended && (
          <TouchableOpacity onPress={playCardC} style={st.btn}>
            <Text style={st.btnTxt}>CPU 플레이</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={deal} style={[st.btn, { backgroundColor:'#1e7a60' }]}>
          <Text style={st.btnTxt}>새 판(선 무작위)</Text>
        </TouchableOpacity>
        <View style={{ marginTop:6 }}>
          <Leaderboard gameId="gostop-pro" />
        </View>
        <Text style={st.license}>
          카드 이미지: 기본은 로컬(assets/hwatu_cards). 매핑이 없으면 Wikimedia URL 또는 텍스트 카드로 폴백합니다.
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:{ flex:1, backgroundColor:'#0f5b44', paddingTop:10 },
  title:{ fontSize:22, fontWeight:'800', color:'#fff', textAlign:'center' },
  sub:{ textAlign:'center', color:'#e2f0ea', marginBottom:6 },

  panel:{ backgroundColor:'#0b4636', marginHorizontal:10, marginVertical:6, padding:8, borderRadius:12, borderWidth:1, borderColor:'#09382b' },
  section:{ color:'#bfe3d6', fontWeight:'700', marginBottom:6, marginLeft:4 },

  centerGrid:{ flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center' },

  cardWrap:{ width:60, height:92, borderRadius:6, overflow:'hidden' },
  cardImg:{ width:'100%', height:'100%' },

  fallback:{ alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#052b21' },
  fbMonth:{ fontSize:14, fontWeight:'800', color:'#052b21' },
  fbKind:{ fontSize:13, fontWeight:'700', color:'#052b21' },

  btn:{ marginTop:8, paddingVertical:10, borderRadius:10, alignItems:'center', backgroundColor:'#2b2f33' },
  btnTxt:{ color:'#fff', fontWeight:'800' },

  license:{ marginTop:8, color:'#cde7dd', fontSize:12, lineHeight:16 }
});
