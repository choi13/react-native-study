import React from 'react';
import { Link } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { GAMES } from '../games/GameRegistry';

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Mini Arcade</Text>
      <FlatList
        data={GAMES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/games/[id]', params: { id: item.id } }} asChild>
            <TouchableOpacity style={{ padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.title}</Text>
              <Text style={{ color: '#666' }}>{item.description}</Text>
              {item.scoringHint && <Text style={{ marginTop: 4, fontSize: 12, color: '#999' }}>Scoring: {item.scoringHint}</Text>}
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}
