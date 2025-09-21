import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Leaderboard({ gameId, top = 20 }: { gameId: string; top?: number; }) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const coll = collection(db, 'scores', gameId, 'userScores');
    const qy = query(coll, orderBy('best', 'desc'), limit(top));
    const unsub = onSnapshot(qy, (ss) => {
      setRows(ss.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [gameId, top]);

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 18 }}>Leaderboard</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5 }}>
            <Text>#{item.rank}</Text>
            <Text style={{ flex: 1, marginLeft: 8 }}>{item.uid.slice(0, 6)}…</Text>
            <Text>{item.best}</Text>
          </View>
        )}
      />
    </View>
  );
}
