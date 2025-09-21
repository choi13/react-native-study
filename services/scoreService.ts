import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export type GameId = 'reaction-time' | 'flappy-bird';

export async function submitScore(gameId: GameId, uid: string, score: number) {
  const ref = doc(db, 'scores', gameId, 'userScores', uid);

  let prevBest = 0;
  try {
    const snap = await getDoc(ref);            // 👉 오프라인이면 여기서 던짐
    if (snap.exists()) prevBest = (snap.data().best as number) ?? 0;
  } catch (e) {
    // 오프라인/초기 캐시 없음 ⇒ prevBest=0으로 진행
    // console.log('submitScore getDoc failed (offline?)', e);
  }

  const best = Math.max(prevBest, score);
  await setDoc(
    ref,
    { best, last: score, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function fetchTop(gameId: GameId, topN = 20) {
  const coll = collection(db, 'scores', gameId, 'userScores');
  const q = query(coll, orderBy('best', 'desc'), limit(topN));
  const ss = await getDocs(q);
  return ss.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));
}
