import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Leaderboard from '../components/Leaderboard';

// ---------- Types ----------
type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14; // J=11, Q=12, K=13, A=14
type Card = { r: Rank; s: Suit };
type Street = 'preflop'|'flop'|'turn'|'river'|'showdown';
type Actor = 'player'|'cpu';

const SB = 10;
const BB = 20;
const FIXED_BET = 40; // 스트리트 베팅/레이즈 금액(간단화)
const START_STACK = 1000;

const { width } = Dimensions.get('window');
const CARD_W = Math.min(60, Math.floor((width - 64) / 7));
const CARD_H = Math.floor(CARD_W * 1.45);

// ---------- Utilities ----------
function makeDeck(): Card[] {
  const suits: Suit[] = ['♠','♥','♦','♣'];
  const deck: Card[] = [];
  for (const s of suits) for (let r=2 as Rank; r<=14; r++) deck.push({r: r as Rank, s});
  for (let i=deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]] = [deck[j],deck[i]]; }
  return deck;
}
function cardStr(c: Card) {
  const m = {11:'J',12:'Q',13:'K',14:'A'} as any;
  return `${(m as any)[c.r]||c.r}${c.s}`;
}
function sortDesc(nums: number[]) { return [...nums].sort((a,b)=>b-a); }
function cmpVec(a:number[], b:number[]) {
  const n = Math.max(a.length,b.length);
  for (let i=0;i<n;i++) {
    const x = a[i] ?? 0, y = b[i] ?? 0;
    if (x>y) return 1; if (x<y) return -1;
  }
  return 0;
}

// ---------- Hand Evaluator (7-card -> best 5) ----------
/**
 * Returns strength vector for comparison. Bigger is better.
 * Category:
 * 8: Straight Flush
 * 7: Four of a Kind
 * 6: Full House
 * 5: Flush
 * 4: Straight
 * 3: Three of a Kind
 * 2: Two Pair
 * 1: One Pair
 * 0: High Card
 * Vector: [cat, ...kickers]
 */
function eval7(cards: Card[]): number[] {





  const ranks = cards.map(c=>c.r);
  const suits = cards.map(c=>c.s);
  // rank counts
  const cnt = new Map<Rank, number>();
  for (const r of ranks) cnt.set(r as Rank, (cnt.get(r as Rank)||0)+1);
  const byCount = [...cnt.entries()].sort((a,b)=> b[1]-a[1] || b[0]-a[0]); // desc by count, then rank
  const rset = [...new Set(ranks)].sort((a,b)=>b-a);
  // flush?
  const scnt = new Map<Suit, Card[]>();
  for (const c of cards) { const arr = scnt.get(c.s)||[]; arr.push(c); scnt.set(c.s, arr); }
  const flushSuit = [...scnt.entries()].find(([_,arr]) => arr.length>=5)?.[0];
  const flushCards = flushSuit ? scnt.get(flushSuit)!.map(c=>c.r).sort((a,b)=>b-a) : null;
  // straight (helper—on array of ranks unique/desc)
  const findStraightHigh = (uniqDesc: number[]) => {
    let seq=1, best=-1;
    for (let i=0;i<uniqDesc.length-1;i++) {
      if (uniqDesc[i]-1 === uniqDesc[i+1]) { seq++; if (seq>=5) best = uniqDesc[i+1]+4; }
      else seq=1;
    }
    // Wheel A-5
    if (uniqDesc.includes(14) && uniqDesc.includes(5) && uniqDesc.includes(4) && uniqDesc.includes(3) && uniqDesc.includes(2))
      best = Math.max(best,5);
    return best; // highest card of straight (5..14)
  };
  // straight flush?
  if (flushCards) {
    const uniqF = [...new Set(flushCards)].sort((a,b)=>b-a);
    const sf = findStraightHigh(uniqF);
    if (sf !== -1) return [8, sf];
  }
  // four-kind
  if (byCount[0]?.[1]===4) {
    const quad = byCount[0][0], kicker = sortDesc(rset.filter(r=>r!==quad))[0]||0;
    return [7, quad, kicker];
  }
  // full house
  const trips = byCount.filter(([_,c])=>c===3).map(([r])=>r).sort((a,b)=>b-a);
  const pairs = byCount.filter(([_,c])=>c===2).map(([r])=>r).sort((a,b)=>b-a);
  if (trips.length>=2) return [6, trips[0], trips[1]]; // AAA + KKK
  if (trips.length>=1 && pairs.length>=1) return [6, trips[0], pairs[0]];
  // flush
  if (flushCards) return [5, ...flushCards.slice(0,5)];
  // straight
  const sHigh = findStraightHigh(rset);
  if (sHigh !== -1) return [4, sHigh];
  // three-kind
  if (trips.length>=1) {
    const t = trips[0];
    const kick = sortDesc(rset.filter(r=>r!==t)).slice(0,2);
    return [3, t, ...kick];
  }
  // two pair
  if (pairs.length>=2) {
    const [p1,p2] = pairs.slice(0,2);
    const kicker = sortDesc(rset.filter(r=>r!==p1 && r!==p2))[0]||0;
    return [2, p1, p2, kicker];
  }
  // one pair
  if (pairs.length===1) {
    const p = pairs[0];
    const kick = sortDesc(rset.filter(r=>r!==p)).slice(0,3);
    return [1, p, ...kick];
  }
  // high card
  const highs = sortDesc(rset).slice(0,5);
  return [0, ...highs];
}

function compareHands(hero: Card[], vill: Card[], board: Card[]): number {
  const h = eval7([...hero, ...board]);
  const v = eval7([...vill, ...board]);
  return cmpVec(h,v);
}

// Quick strength heuristic (0..1)
// Quick strength heuristic (0..1)
function approxStrength(hole: Card[], board: Card[]): number {
  // 🛡️ 초기 렌더/딜링 사이클 보호
  if (!hole || hole.length < 2) return 0;

  if (board.length===0) {
    // preflop: pair strong, high broadways
    const [a,b] = hole.map(c=>c.r).sort((x,y)=>y-x);
    const pair = a===b ? 0.85 : 0;
    const high = (a>=13?0.15:0) + (b>=11?0.10:0);
    const suited = hole[0].s===hole[1].s ? 0.05 : 0;
    const connected = (Math.abs(hole[0].r - hole[1].r)===1) ? 0.05 : 0;
    return Math.min(1, pair + high + suited + connected + 0.2);
  }
  // postflop+: map evaluator to 0..1 roughly
  const cat = eval7([...hole, ...board])[0]; // 0..8
  return Math.min(1, (cat+1)/9);
}


// ---------- Component ----------
export default function TexasHoldem({ onGameOver }: { onGameOver: (n:number)=>void }) {

    
  // bank
  const [playerStack, setPlayerStack] = useState(START_STACK);
  const [cpuStack, setCpuStack] = useState(START_STACK);
  const [dealerIsPlayer, setDealerIsPlayer] = useState(true);

  // hand-state
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHole, setPlayerHole] = useState<Card[]>([]);
  const [cpuHole, setCpuHole] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [street, setStreet] = useState<Street>('preflop');
  const [turn, setTurn] = useState<Actor>('player');
  const [pot, setPot] = useState(0);

  // betting-state (per street)
  const [toCall, setToCall] = useState(0);      // 현재 액터가 콜해야 할 금액
  const [betOpen, setBetOpen] = useState(false); // 해당 스트리트에서 누군가 베팅했는지(한 번만 허용)
  const [revealed, setRevealed] = useState(false); // 쇼다운 시 CPU 홀카드 공개

  // refs
  const actedThisStreet = useRef<{player:boolean;cpu:boolean}>({player:false,cpu:false});
  const handActive = useRef(true);

  const resetStreetFlags = () => { actedThisStreet.current = {player:false,cpu:false}; setBetOpen(false); setToCall(0); };

  // ----- Hand lifecycle -----
  const startNewHand = (nextDealerIsPlayer = !dealerIsPlayer, carryStacks?: {p:number;c:number}) => {
    // game over?
    const pS = carryStacks ? carryStacks.p : playerStack;
    const cS = carryStacks ? carryStacks.c : cpuStack;
    if (pS<=0 || cS<=0) {
      onGameOver(Math.max(0,pS));
      return;
    }
    const d = makeDeck();
    const ph = [d.pop()!, d.pop()!];
    const ch = [d.pop()!, d.pop()!];
    const sbActor: Actor = nextDealerIsPlayer ? 'player':'cpu';
    const bbActor: Actor = nextDealerIsPlayer ? 'cpu':'player';

    let pot0 = 0, pStack=pS, cStack=cS;
    if (sbActor==='player') { pStack -= SB; pot0 += SB; } else { cStack -= SB; pot0 += SB; }
    if (bbActor==='player') { pStack -= BB; pot0 += BB; } else { cStack -= BB; pot0 += BB; }

    setDeck(d);
    setPlayerHole(ph);
    setCpuHole(ch);
    setBoard([]);
    setStreet('preflop');
    setDealerIsPlayer(nextDealerIsPlayer);
    setPot(pot0);
    setPlayerStack(pStack);
    setCpuStack(cStack);
    setRevealed(false);
    resetStreetFlags();
    handActive.current = true;

    // Preflop: 딜러(SB)가 먼저 액션
    setTurn(nextDealerIsPlayer ? 'player' : 'cpu');
    // BB까지 들어간 상태: toCall = BB - SB(=10)
    setToCall(BB - SB);
  };

  useEffect(()=>{ startNewHand(dealerIsPlayer); /* first mount */ },[]); // eslint-disable-line

  // ----- Street advance -----
  const dealNextStreet = () => {
    if (!handActive.current) return;
    const d = [...deck];
    if (street==='preflop') {
      // burn 1, flop 3
      d.pop(); const flop = [d.pop()!, d.pop()!, d.pop()!];
      setBoard(flop); setStreet('flop'); resetStreetFlags();
      // Postflop: 헤즈업에서 딜러가 마지막 액션. 즉, 포스트플랍은 딜러가 '뒤'라서 첫 액션은 비딜러.
      setTurn(dealerIsPlayer ? 'cpu' : 'player');
      setToCall(0);
      setDeck(d);
    } else if (street==='flop') {
      d.pop(); const turnC = d.pop()!; setBoard(prev=>[...prev, turnC]);
      setStreet('turn'); resetStreetFlags();
      setTurn(dealerIsPlayer ? 'cpu' : 'player');
      setToCall(0); setDeck(d);
    } else if (street==='turn') {
      d.pop(); const river = d.pop()!; setBoard(prev=>[...prev, river]);
      setStreet('river'); resetStreetFlags();
      setTurn(dealerIsPlayer ? 'cpu' : 'player');
      setToCall(0); setDeck(d);
    } else if (street==='river') {
      goShowdown();
    }
  };

  // ----- Showdown / Award -----
  const goShowdown = () => {
    setStreet('showdown');
    setRevealed(true);
    handActive.current = false;
    const cmp = compareHands(playerHole, cpuHole, board);
    if (cmp>0) {
      setPlayerStack(s=>s+pot);
      setPot(0);
    } else if (cmp<0) {
      setCpuStack(s=>s+pot);
      setPot(0);
    } else {
      // split
      setPlayerStack(s=>s + Math.floor(pot/2));
      setCpuStack(s=>s + (pot - Math.floor(pot/2)));
      setPot(0);
    }
  };

  // ----- Action handlers -----
  const doFold = (who: Actor) => {
    if (!handActive.current) return;
    handActive.current = false;
    if (who==='player') {
      setCpuStack(s=>s+pot); setPot(0);
    } else {
      setPlayerStack(s=>s+pot); setPot(0);
    }
    setStreet('showdown'); setRevealed(true);
  };

  const doCheckOrCall = (who: Actor) => {
    if (!handActive.current) return;
    if (toCall>0) {
      // Call
      if (who==='player') {
        if (playerStack<toCall) return; // no all-in in this simplified version
        setPlayerStack(s=>s-toCall);
      } else {
        if (cpuStack<toCall) return;
        setCpuStack(s=>s-toCall);
      }
      setPot(p=>p+toCall);
      setToCall(0);
      // 콜로 스트리트 종료(한 번 베팅만 가능)
      dealNextStreet();
    } else {
      // Check
      actedThisStreet.current[who] = true;
      if (actedThisStreet.current.player && actedThisStreet.current.cpu) {
        // 모두 체크 → 다음 스트리트
        dealNextStreet();
      } else {
        // 턴 넘기기
        setTurn(who==='player'?'cpu':'player');
      }
    }
  };

  const doBetOrRaise = (who: Actor) => {
    if (!handActive.current) return;
    if (betOpen) return; // 이미 한 번 베팅됨 → 레이즈 불가(간단화)
    // 효과적으로 "베팅/첫 레이즈"를 FIXED_BET 금액으로 연다.
    if (who==='player') {
      const need = FIXED_BET; if (playerStack<need) return;
      setPlayerStack(s=>s-need); setPot(p=>p+need);
    } else {
      const need = FIXED_BET; if (cpuStack<need) return;
      setCpuStack(s=>s-need); setPot(p=>p+need);
    }
    setBetOpen(true);
    setToCall(FIXED_BET);
    setTurn(who==='player'?'cpu':'player');
  };

  // ----- CPU policy -----
  useEffect(()=>{
    if (turn!=='cpu' || street==='showdown') return;
    const t = setTimeout(()=>{
      const str = approxStrength(cpuHole, board); // 0..1
      if (toCall>0) {
        if (str>=0.6) doCheckOrCall('cpu'); // call
        else if (str>=0.45 && Math.random()<0.4) doCheckOrCall('cpu');
        else doFold('cpu');
      } else {
        if (!betOpen && str>=0.7) doBetOrRaise('cpu');
        else if (!betOpen && str>=0.5 && Math.random()<0.3) doBetOrRaise('cpu');
        else doCheckOrCall('cpu'); // check
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, street, toCall, betOpen, board, cpuHole]);

  // ----- Helpers -----
  const statusText = useMemo(()=>{
    if (street==='showdown') return 'Showdown';
    const who = turn==='player' ? 'You' : 'CPU';
    if (toCall>0) return `${who} to act — Call ${toCall} or Fold (1 raise max)`;
    if (!betOpen) return `${who} to act — Check or Bet ${FIXED_BET}`;
    return `${who} to act — Call ${toCall} or Fold`;
  }, [turn, toCall, betOpen, street]);

  const nextHand = () => startNewHand(!dealerIsPlayer);

  const resetMatch = () => {
    startNewHand(true, {p:START_STACK, c:START_STACK});
  };

  // ----- Render -----
  const ActionButtons = () => {
    const isMe = turn==='player' && street!=='showdown';
    return (
      <View style={styles.actions}>
        <Pressable disabled={!isMe} onPress={()=>doFold('player')} style={[styles.btn, !isMe&&styles.btnDisabled]}><Text style={styles.btnTxt}>폴드</Text></Pressable>
        <Pressable disabled={!isMe} onPress={()=>doCheckOrCall('player')} style={[styles.btn, !isMe&&styles.btnDisabled]}>
          <Text style={styles.btnTxt}>{toCall>0?`콜 ${toCall}`:'체크'}</Text>
        </Pressable>
        <Pressable disabled={!isMe || betOpen} onPress={()=>doBetOrRaise('player')} style={[styles.btn, (!isMe||betOpen)&&styles.btnDisabled]}>
          <Text style={styles.btnTxt}>{toCall>0?'레이지 불가':'베팅 '+FIXED_BET}</Text>
        </Pressable>
      </View>
    );
  };

  const CardsRow = ({cards, hidden}:{cards:Card[]; hidden?:boolean}) => (
    <View style={{flexDirection:'row', gap:8}}>
      {cards.map((c,i)=>(
        <View key={i} style={[styles.card, {borderColor: (c.s==='♥'||c.s==='♦')?'#d22':'#111'}]}>
          <Text style={[styles.cardTxt, {color: (c.s==='♥'||c.s==='♦')?'#d22':'#111'}]}>
            {hidden ? '🂠' : cardStr(c)}
          </Text>
        </View>
      ))}
    </View>
  );

  const winnerHint = useMemo(()=>{
    if (street!=='showdown') return '';
    const cmp = compareHands(playerHole, cpuHole, board);
    if (cmp>0) return 'You win';
    if (cmp<0) return 'CPU wins';
    return 'Split pot';
  }, [street, playerHole, cpuHole, board]);

const playerCat = useMemo(() => eval7([...playerHole, ...board])[0], [playerHole, board]);
const cpuCat = useMemo(() => eval7([...cpuHole, ...board])[0], [cpuHole, board]);
const playerStrengthPct = useMemo(() => Math.round(approxStrength(playerHole, board)*100), [playerHole, board]);


function catNameKo(cat: number) {
  // 8..0 (eval7의 카테고리)
  switch (cat) {
    case 8: return '스트레이트 플러시';
    case 7: return '포카드';
    case 6: return '풀하우스';
    case 5: return '플러시';
    case 4: return '스트레이트';
    case 3: return '트리플';
    case 2: return '투페어';
    case 1: return '원페어';
    default: return '하이카드';
  }
}

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Texas Hold’em (Heads-Up)</Text>

      <View style={styles.infoRow}>
        <Text style={styles.stack}>You: {playerStack}</Text>
        <Text style={styles.pot}>Pot: {pot}</Text>
        <Text style={styles.stack}>CPU: {cpuStack}</Text>
      </View>

      <Text style={styles.dealer}>{dealerIsPlayer ? 'Dealer: You (SB 10)' : 'Dealer: CPU (SB 10)'}</Text>
      <Text style={styles.status}>{statusText}</Text>

      {/* CPU hole (hidden) */}
      <View style={styles.holeRow}>
        <CardsRow cards={cpuHole} hidden={!revealed}/>
        <Text style={styles.label}>CPU</Text>
      </View>

      {/* Board */}
      <View style={styles.board}>
        <CardsRow cards={board}/>
        <Text style={[styles.label, {marginTop:6, fontWeight:'700'}]}>{street.toUpperCase()}</Text>
      </View>

      {/* Player hole */}
      <View style={styles.holeRow}>
        <CardsRow cards={playerHole}/>
        <Text style={styles.label}>You</Text>
      </View>
<View style={{alignItems:'center', marginTop:4}}>
  <Text style={styles.rankText}>
    현재 족보: {catNameKo(playerCat)} ({playerStrengthPct}%)
  </Text>
</View>

      <ActionButtons/>

      <View style={styles.bottom}>
        {street==='showdown' && (
          <>
            <Text style={styles.winner}>{winnerHint}</Text>
              <Text style={[styles.rankText,{marginTop:4}]}>
    CPU 족보: {catNameKo(cpuCat)}
  </Text>
            <View style={{flexDirection:'row', gap:12, marginTop:8}}>
              <Pressable onPress={nextHand} style={[styles.btn, {backgroundColor:'#111'}]}><Text style={[styles.btnTxt,{color:'#fff'}]}>다음 핸드</Text></Pressable>
              <Pressable onPress={resetMatch} style={[styles.btn, {backgroundColor:'#6b7280'}]}><Text style={[styles.btnTxt,{color:'#fff'}]}>새 게임</Text></Pressable>
            </View>
          </>
        )}
        <Leaderboard gameId="poker-holdem" />
      </View>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  screen:{ flex:1, padding:16, backgroundColor:'#f7fbff' },
  title:{ fontSize:22, fontWeight:'800', marginBottom:6, alignSelf:'center' },
  infoRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  pot:{ fontSize:16, fontWeight:'800', color:'#1b3a6f' },
  stack:{ fontSize:16, fontWeight:'700' },
  dealer:{ fontSize:12, color:'#465', alignSelf:'center' },
  status:{ fontSize:14, marginVertical:8, alignSelf:'center' },
rankText:{ fontSize:14, fontWeight:'700', color:'#0f172a' },
  board:{ marginVertical:8, alignItems:'center', padding:10, borderWidth:1, borderColor:'#cfe3ff', borderRadius:16, backgroundColor:'#eef4ff' },
  holeRow:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, marginVertical:6 },
  label:{ fontSize:12, color:'#333' },

  card:{ width:CARD_W, height:CARD_H, borderWidth:2, borderRadius:10, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.06, shadowRadius:3 },
  cardTxt:{ fontSize:Math.max(14, Math.floor(CARD_W*0.42)), fontWeight:'800' },

  actions:{ flexDirection:'row', justifyContent:'center', gap:12, marginTop:10 },
  btn:{ paddingVertical:10, paddingHorizontal:18, borderRadius:12, backgroundColor:'#eef4ff', borderWidth:1, borderColor:'#cfe3ff' },
  btnDisabled:{ opacity:0.5 },
  btnTxt:{ fontSize:16, fontWeight:'800', color:'#1b3a6f' },

  bottom:{ marginTop:12, alignItems:'center' },
  winner:{ fontSize:16, fontWeight:'800', marginTop:4 },
});
