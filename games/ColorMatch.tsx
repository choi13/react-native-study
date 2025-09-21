import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';


const COLORS = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const REAL = { RED: 'red', BLUE: 'blue', GREEN: 'green', YELLOW: 'gold' } as const;


export default function ColorMatch({ onGameOver }: { onGameOver: (score: number) => void }) {
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [word, setWord] = useState('RED');
    const [ink, setInk] = useState('blue');


    useEffect(() => next(), []);
    const next = () => {
        const w = COLORS[Math.floor(Math.random() * COLORS.length)];
        const i = Object.values(REAL)[Math.floor(Math.random() * 4)];
        setWord(w); setInk(i as any); setRound(r => r + 1);
        if (round >= 20) onGameOver(score);
    };


    const answer = (isMatch: boolean) => {
        const correct = REAL[word as keyof typeof REAL] === ink;
        setScore(s => s + (correct === isMatch ? 10 : 0));
        next();
    };


    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, marginBottom: 12 }}>Round {round}</Text>
            <Text style={{ fontSize: 48, color: ink as any, marginBottom: 16 }}>{word}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => answer(true)} style={{ padding: 12, backgroundColor: '#2ecc71', borderRadius: 8 }}>
                    <Text style={{ color: '#fff' }}>일치</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => answer(false)} style={{ padding: 12, backgroundColor: '#e74c3c', borderRadius: 8 }}>
                    <Text style={{ color: '#fff' }}>불일치</Text>
                </TouchableOpacity>
            </View>
            <Text style={{ marginTop: 16 }}>Score: {score}</Text>
        </View>
    );
}