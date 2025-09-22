import React from 'react';
import ReactionTime from './ReactionTime';
import FlappyBird from './FlappyBird';
import MemoryMatchPro from './MemoryMatchPro';
import Game2048Pro from './Game2048Pro';
import Snake from './Snake';
import WhackAMole from './WhackAMole';
import GoStopPro from './GoStopPro';
import TexasHoldem from './TexasHoldem';


export type GameId =
  | 'reaction-time'
  | 'flappy-bird'
  | 'memory-pro'
  | '2048-pro'
  | 'snake'
  | 'whack-a-mole'
  | 'gostop-lite'
    | 'poker-holdem';   // 추가

export type GameMeta = {
  id: GameId;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  scoringHint?: string;
};

export const GAMES: GameMeta[] = [
  { id:'reaction-time', title:'Reaction Time', description:'신호 반응 속도 측정', component:ReactionTime, scoringHint:'낮을수록 빠름(1000-ms 저장)' },
  { id:'flappy-bird',   title:'Flappy Bird',   description:'장애물 피해서 비행',   component:FlappyBird, scoringHint:'높을수록 좋음' },
  { id:'memory-pro',    title:'Memory Match',  description:'카드 뒤집어 짝맞추기', component:MemoryMatchPro, scoringHint:'높을수록 좋음' },
  { id:'2048-pro',      title:'2048',          description:'타일 합치기 퍼즐',     component:Game2048Pro, scoringHint:'높을수록 좋음' },
  { id:'snake',         title:'Snake',         description:'먹이 먹고 성장',       component:Snake, scoringHint:'높을수록 좋음' },
  { id:'whack-a-mole',  title:'Whack-A-Mole',  description:'두더지 잡기',          component:WhackAMole, scoringHint:'높을수록 좋음' },
  { id:'gostop-lite', title:'고스톱 ', description:'맞고 간이 룰로 최고 점수 도전', component:GoStopPro, scoringHint:'최종 점수차(플레이어-CPU)' },
{ id:'poker-holdem', title:'Texas Hold’em', description:'2인용 헤즈업 텍사스 홀덤', component:TexasHoldem, scoringHint:'칩 보유액(0이면 종료)' },
];

export const findGame = (id: string) => GAMES.find(g => g.id === id);
