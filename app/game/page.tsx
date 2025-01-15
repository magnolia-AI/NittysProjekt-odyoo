"use client"
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PLAYER_SIZE = 40
const COIN_SIZE = 20
const ENEMY_SIZE = 40
const GRAVITY = 0.5
const JUMP_FORCE = -12
// Batman logo SVG path
const BATMAN_LOGO = `
  M40 20
  C40 20, 38 15, 35 15
  C32 15, 30 18, 30 20
  C30 22, 32 25, 35 25
  C38 25, 40 20, 40 20
  M20 20
  C20 20, 22 15, 25 15
  C28 15, 30 18, 30 20
  C30 22, 28 25, 25 25
  C22 25, 20 20, 20 20
  M30 23
  L35 28
  L25 28
  L30 23
`
interface GameObject {
  x: number
  y: number
  velocityY: number
  velocityX: number
}
interface Enemy {
  x: number
  y: number
  velocityX: number
  velocityY: number
  pattern: 'horizontal' | 'vertical' | 'chase'
}
interface Coin {
  x: number
  y: number
  collected: boolean
}
interface Level {
  coins: Coin[]
  enemies: Enemy[]
}
const generateLevel = (levelNumber: number): Level => {
  const coins: Coin[] = []
  const enemies: Enemy[] = []
    const coinCount = 4 + levelNumber * 2
  for (let i = 0; i < coinCount; i++) {
    coins.push({
      x: Math.random() * (GAME_WIDTH - COIN_SIZE * 2) + COIN_SIZE,
      y: Math.random() * (GAME_HEIGHT - COIN_SIZE * 2) + COIN_SIZE,
      collected: false
    })
  }
  const enemyCount = Math.min(2 + Math.floor(levelNumber / 2), 6)
  const patterns: ('horizontal' | 'vertical' | 'chase')[] = ['horizontal', 'vertical', 'chase']
    for (let i = 0; i < enemyCount; i++) {
    enemies.push({
      x: Math.random() * (GAME_WIDTH - ENEMY_SIZE * 2) + ENEMY_SIZE,
      y: Math.random() * (GAME_HEIGHT - ENEMY_SIZE * 2) + ENEMY_SIZE,
      velocityX: (Math.random() * 2 + 2) * (Math.random() < 0.5 ? 1 : -1),
      velocityY: (Math.random() * 2 + 2) * (Math.random() < 0.5 ? 1 : -1),
      pattern: patterns[i % patterns.length]
    })
  }
  return { coins, enemies }
}
export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lastJumpTime, setLastJumpTime] = useState(0)
  const [player, setPlayer] = useState<GameObject>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_SIZE,
    velocityY: 0,
    velocityX: 0
  })
  const [currentLevel, setCurrentLevel] = useState<Level>(generateLevel(1))
  const batmanLogoImage = useRef<HTMLImageElement | null>(null)
  const jokerImage = useRef<HTMLImageElement | null>(null)
  const coinImage = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    // Create Batman logo
    const canvas = document.createElement('canvas')
    canvas.width = PLAYER_SIZE
    canvas.height = PLAYER_SIZE
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE)
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      ctx.beginPath()
      const path = new Path2D(BATMAN_LOGO)
      ctx.stroke(path)
            batmanLogoImage.current = new Image()
      batmanLogoImage.current.src = canvas.toDataURL()
    }
    // Load Joker and coin images
    jokerImage.current = new Image()
    jokerImage.current.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBmaWxsPSIjZmYwMGZmIiBkPSJNNDQ4IDI1NmMwLTI1LjQtMTMuMi00OS4zLTM1LjItNjIuOWwtMjYuOC0xNi43QzM5NC43IDE2OS44IDQwMCAxNTIuMiA0MDAgMTMzLjJWMTA4YzAtMjcuNy0xOC41LTUyLjItNDUuMy01OS43bC0yLjYtLjdDMzQ1LjIgNDUuNiAzMzguNiA0NCAzMzIgNDRoLTI0Yy0xMy4zIDAtMjQtMTAuNy0yNC0yNFYxMmMwLTYuNi01LjQtMTItMTItMTJoLTk2Yy02LjYgMC0xMiA1LjQtMTIgMTJ2OGMwIDEzLjMtMTAuNyAyNC0yNCAyNGgtMjRjLTYuNiAwLTEzLjIgMS42LTIwLjEgMy42bC0yLjYgLjdDNjYuNSA1NS44IDQ4IDgwLjMgNDggMTA4djI1LjJjMCAxOS0yLjMgMzYuNiAxMC44IDQ0LjJsLTI2LjggMTYuN0MxMy4yIDIwNi43IDAgMjMwLjYgMCAyNTZzMTMuMiA0OS4zIDM1LjIgNjIuOWwyNi44IDE2LjdDNTMuMyAzNDIuMiA0OCAzNTkuOCA0OCAzNzguOFY0MDRjMCAyNy43IDE4LjUgNTIuMiA0NS4zIDU5LjdsMi42IC43YzcgMiAxMy42IDMuNiAyMC4xIDMuNmgyNGMxMy4zIDAgMjQgMTAuNyAyNCAyNHY4YzAgNi42IDUuNCAxMiAxMiAxMmg5NmM2LjYgMCAxMi01LjQgMTItMTJ2LThjMC0xMy4zIDEwLjctMjQgMjQtMjRoMjRjNi42IDAgMTMuMi0xLjYgMjAuMS0zLjZsMi42LS43QzM4MS41IDQ1Ni4yIDQwMCA0MzEuNyA0MDAgNDA0di0yNS4yYzAtMTkgNS43LTM2LjYtNy40LTQ0LjJsMjYuOC0xNi43QzQzNC44IDMwNS4zIDQ0OCAyODEuNCA0NDggMjU2ek0yMDggMjI0YzAtMTcuNyAxNC4zLTMyIDMyLTMyaDMyYzE3LjcgMCAzMiAxNC4zIDMyIDMydjY0YzAgMTcuNy0xNC4zIDMyLTMyIDMyaC0zMmMtMTcuNyAwLTMyLTE0LjMtMzItMzJ2LTY0eiIvPjwvc3ZnPg=='
        coinImage.current = new Image()
    coinImage.current.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmZkNzAwIiBkPSJNNTEyIDgwYzAgMTguOS00LjkgMzYuMi0xMy4zIDUxLjNDNDY5LjggMTQ1LjggNDI5LjEgMTYwIDM4NCAxNjBzLTg1LjgtMTQuMi0xMTQuNy0yOC43QzI2MC4zIDExNi4yIDI1NS40IDk4LjkgMjU1LjQgODBzNC45LTM2LjIgMTMuMy01MS4zQzI5OC4yIDE0LjIgMzM4LjkgMCAzODQgMHM4NS44IDE0LjIgMTE0LjcgMjguN0M1MDcuMSA0My44IDUxMiA2MS4xIDUxMiA4MHoiLz48L3N2Zz4='
  }, [])
  const resetGame = () => {
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - PLAYER_SIZE,
      velocityY: 0,
      velocityX: 0
    })
    setCurrentLevel(generateLevel(1))
  }
  const startNewLevel = () => {
    setLevel(prev => prev + 1)
    setPlayer({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - PLAYER_SIZE,
      velocityY: 0,
      velocityX: 0
    })
    setCurrentLevel(generateLevel(level + 1))
  }
  // ... [Previous key handling code remains the same]
  useEffect(() => {
    if (!gameStarted || gameOver) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      // Draw level number
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`Level: ${level}`, GAME_WIDTH - 20, 40)
      // Draw player (Batman logo)
      if (batmanLogoImage.current) {
        ctx.drawImage(batmanLogoImage.current, player.x, player.y, PLAYER_SIZE, PLAYER_SIZE)
      }
      // Draw coins
      currentLevel.coins.forEach(coin => {
        if (!coin.collected && coinImage.current) {
          ctx.drawImage(coinImage.current, coin.x, coin.y, COIN_SIZE, COIN_SIZE)
        }
      })
      // Draw enemies (Joker)
      currentLevel.enemies.forEach(enemy => {
        if (jokerImage.current) {
          ctx.drawImage(jokerImage.current, enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE)
        }
      })
      if (!gameOver) {
        requestAnimationFrame(render)
      }
    }
    render()
  }, [gameStarted, player, currentLevel, gameOver, level])
  // ... [Rest of the game logic remains the same]
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-zinc-900 to-black">
      <Card className="p-6 bg-zinc-800 text-white">
        <div className="flex justify-between mb-4">
          <div className="text-2xl">Score: {score}</div>
          <div className="text-2xl">Level: {level}</div>
        </div>
        {!gameStarted ? (
          <div className="text-center">
            <h1 className="text-3xl mb-4">Batman Coin Collector</h1>
            <p className="mb-4">Use arrow keys to move and SPACE to jump (press multiple times to multi-jump!)</p>
            <p className="mb-4">Collect coins and avoid the Jokers!</p>
            <Button 
              onClick={() => setGameStarted(true)}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Start Game
            </Button>
          </div>
        ) : gameOver ? (
          <div className="text-center">
            <h2 className="text-3xl mb-4">Game Over!</h2>
            <p className="mb-4">Final Score: {score}</p>
            <p className="mb-4">Reached Level: {level}</p>
            <Button 
              onClick={() => {
                resetGame()
                setGameStarted(true)
              }}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Play Again
            </Button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="border border-zinc-600"
          />
        )}
      </Card>
    </div>
  )
}