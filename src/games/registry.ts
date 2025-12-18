export type GameRegistryItem = {
  key: string
  displayName: string
  routes: { quiz: string; editor: string }
  enabled?: boolean
}

export const games: GameRegistryItem[] = [
  {
    key: 'game1_guessword',
    displayName: '猜字遊戲',
    routes: { quiz: '/game/game1_guessword/quiz', editor: '/game/game1_guessword/editor' },
    enabled: true,
  },
  {
    key: 'game2_xxx',
    displayName: 'game2 (預留)',
    routes: { quiz: '/game/game2_xxx/quiz', editor: '/game/game2_xxx/editor' },
    enabled: false,
  },
]
