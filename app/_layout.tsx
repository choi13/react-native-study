import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
// import { auth } from '../lib/firebase';
import {auth} from '../lib/firebase';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) await signInAnonymously(auth);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) {
    return (
      <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Mini Arcade' }} />
      <Stack.Screen name="games/[id]" options={{ title: 'Play' }} />
    </Stack>
  );
}
