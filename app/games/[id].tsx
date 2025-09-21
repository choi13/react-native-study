import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { findGame } from '../../games/GameRegistry';

import { Text, View } from 'react-native';
import { auth } from '../../lib/firebase';

import { submitScore } from '../../services/scoreService';
export default function GameHost() {



  const { id } = useLocalSearchParams<{ id: string }>();
  const game = findGame(String(id));

  const onGameOver = useCallback(async (score: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !game) return;
    await submitScore(game.id as any, uid, score);
  }, [game]);

  if (!game) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>Game not found</Text></View>;
  const Component = game.component as any;
  return <Component onGameOver={onGameOver} />;
}
