"use client"
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PLAYER_SIZE = 50  // Adjusted size for the GIF
const BOMB_SIZE = 20
const ENEMY_SIZE = 25
const GRAVITY = 0.5
const JUMP_FORCE = -12
// Player sprite URL
const PLAYER_SPRITE = "https://media0.giphy.com/media/Pj6dOPa2ZK4tzxlky2/giphy.gif"
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
interface Bomb {
  x: number
  y: number
  collected: boolean
}
interface Level {
  bombs: Bomb[]
  enemies: Enemy[]
}
const generateLevel = (levelNumber: number): Level => {
  const bombs: Bomb[] = []
  const enemies: Enemy[] = []
    const bombCount = 4 + levelNumber * 2
  for (let i = 0; i < bombCount; i++) {
    bombs.push({
      x: Math.random() * (GAME_WIDTH - BOMB_SIZE * 2) + BOMB_SIZE,
      y: Math.random() * (GAME_HEIGHT - BOMB_SIZE * 2) + BOMB_SIZE,
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
  return { bombs, enemies }
}
export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerImageRef = useRef<HTMLImageElement | null>(null)
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
  useEffect(() => {
    const img = new Image()
    img.src = PLAYER_SPRITE
    img.onload = () => {
      playerImageRef.current = img
    }
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
  const [keys, setKeys] = useState({
    ArrowLeft: false,
    ArrowRight: false,
    " ": false,
  })
  useEffect(() => {
    if (!gameStarted || gameOver) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) {
        e.preventDefault()
        if (e.key === " ") {
          const currentTime = Date.now()
          if (currentTime - lastJumpTime > 100) {
            setLastJumpTime(currentTime)
            setPlayer(prev => ({
              ...prev,
              velocityY: JUMP_FORCE
            }))
          }
        }
        setKeys(prev => ({ ...prev, [e.key]: true }))
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys) {
        e.preventDefault()
        setKeys(prev => ({ ...prev, [e.key]: false }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStarted, lastJumpTime, gameOver, keys])
  useEffect(() => {
    if (!gameStarted || gameOver) return
    const gameLoop = setInterval(() => {
      setPlayer(prev => {
        let newX = prev.x
        let newY = prev.y
        let newVelocityY = prev.velocityY
        let newVelocityX = prev.velocityX
        if (keys.ArrowLeft) newVelocityX = -5
        else if (keys.ArrowRight) newVelocityX = 5
        else newVelocityX *= 0.8
        newVelocityY += GRAVITY
        newX += newVelocityX
        newY += newVelocityY
        if (newY > GAME_HEIGHT - PLAYER_SIZE) {
          newY = GAME_HEIGHT - PLAYER_SIZE
          newVelocityY = 0
        }
        if (newY < 0) {
          newY = 0
          newVelocityY = 0
        }
        if (newX < 0) newX = 0
        if (newX > GAME_WIDTH - PLAYER_SIZE) newX = GAME_WIDTH - PLAYER_SIZE
        return {
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          velocityX: newVelocityX
        }
      })
      setCurrentLevel(prevLevel => {
        const updatedEnemies = prevLevel.enemies.map(enemy => {
          let newX = enemy.x
          let newY = enemy.y
          let newVelocityX = enemy.velocityX
          let newVelocityY = enemy.velocityY
          switch (enemy.pattern) {
            case 'horizontal':
              newX += newVelocityX
              if (newX <= 0 || newX >= GAME_WIDTH - ENEMY_SIZE) {
                newVelocityX *= -1
              }
              break
            case 'vertical':
              newY += newVelocityY
              if (newY <= 0 || newY >= GAME_HEIGHT - ENEMY_SIZE) {
                newVelocityY *= -1
              }
              break
            case 'chase':
              newVelocityX = player.x > enemy.x ? 2 : -2
              newVelocityY = player.y > enemy.y ? 2 : -2
              newX += newVelocityX * 0.5
              newY += newVelocityY * 0.5
              break
          }
          return {
            ...enemy,
            x: newX,
            y: newY,
            velocityX: newVelocityX,
            velocityY: newVelocityY
          }
        })
        updatedEnemies.forEach(enemy => {
          if (
            player.x < enemy.x + ENEMY_SIZE &&
            player.x + PLAYER_SIZE > enemy.x &&
            player.y < enemy.y + ENEMY_SIZE &&
            player.y + PLAYER_SIZE > enemy.y
          ) {
            setGameOver(true)
          }
        })
        const updatedBombs = prevLevel.bombs.map(bomb => {
          if (!bomb.collected &&
              Math.abs(player.x - bomb.x) < PLAYER_SIZE &&
              Math.abs(player.y - bomb.y) < PLAYER_SIZE) {
            setScore(prev => prev + 100)
            return { ...bomb, collected: true }
          }
          return bomb
        })
        if (updatedBombs.every(bomb => bomb.collected)) {
          startNewLevel()
        }
        return {
          bombs: updatedBombs,
          enemies: updatedEnemies
        }
      })
    }, 1000 / 60)
    return () => clearInterval(gameLoop)
  }, [gameStarted, keys, player, gameOver])
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
      // Draw player sprite
      if (playerImageRef.current) {
        ctx.drawImage(
          playerImageRef.current,
          player.x,
          player.y,
          PLAYER_SIZE,
          PLAYER_SIZE
        )
      }
      // Draw bombs
      currentLevel.bombs.forEach(bomb => {
        if (!bomb.collected) {
          ctx.fillStyle = '#ffff00'
          ctx.beginPath()
          ctx.arc(bomb.x + BOMB_SIZE/2, bomb.y + BOMB_SIZE/2, BOMB_SIZE/2, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      // Draw enemies
      currentLevel.enemies.forEach(enemy => {
        ctx.fillStyle = '#ff00ff'
        ctx.fillRect(enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE)
      })
      requestAnimationFrame(render)
    }
    render()
  }, [gameStarted, player, currentLevel, gameOver, level])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-zinc-900 to-black">
      <Card className="p-6 bg-zinc-800 text-white">
        <div className="flex justify-between mb-4">
          <div className="text-2xl">Score: {score}</div>
          <div className="text-2xl">Level: {level}</div>
        </div>
        {!gameStarted ? (
          <div className="text-center">
            <h1 className="text-3xl mb-4">Bomb Jack Clone</h1>
            <p className="mb-4">Use arrow keys to move and SPACE to jump (press multiple times to multi-jump!)</p>
            <p className="mb-4">Collect yellow bombs and avoid pink enemies!</p>
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