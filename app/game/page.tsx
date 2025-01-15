"use client"
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PLAYER_SIZE = 30
const BOMB_SIZE = 20
const GRAVITY = 0.5
const JUMP_FORCE = -12
interface GameObject {
  x: number
  y: number
  velocityY: number
  velocityX: number
}
interface Bomb {
  x: number
  y: number
  collected: boolean
}
export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [lastJumpTime, setLastJumpTime] = useState(0)
  const [player, setPlayer] = useState<GameObject>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_SIZE,
    velocityY: 0,
    velocityX: 0
  })
    const [bombs, setBombs] = useState<Bomb[]>([
    { x: 100, y: 300, collected: false },
    { x: 300, y: 200, collected: false },
    { x: 500, y: 400, collected: false },
    { x: 700, y: 250, collected: false },
  ])
  const [keys, setKeys] = useState({
    ArrowLeft: false,
    ArrowRight: false,
    " ": false,
  })
  useEffect(() => {
    if (!gameStarted) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) {
        e.preventDefault()
        if (e.key === " ") {
          const currentTime = Date.now()
          // Allow new jump if enough time has passed since last jump
          if (currentTime - lastJumpTime > 100) { // 100ms cooldown between jumps
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
  }, [gameStarted, lastJumpTime])
  useEffect(() => {
    if (!gameStarted) return
    const gameLoop = setInterval(() => {
      setPlayer(prev => {
        let newX = prev.x
        let newY = prev.y
        let newVelocityY = prev.velocityY
        let newVelocityX = prev.velocityX
        // Horizontal movement
        if (keys.ArrowLeft) newVelocityX = -5
        else if (keys.ArrowRight) newVelocityX = 5
        else newVelocityX *= 0.8 // Friction
        // Apply gravity
        newVelocityY += GRAVITY
        // Update position
        newX += newVelocityX
        newY += newVelocityY
        // Ground collision
        if (newY > GAME_HEIGHT - PLAYER_SIZE) {
          newY = GAME_HEIGHT - PLAYER_SIZE
          newVelocityY = 0
        }
        // Ceiling collision
        if (newY < 0) {
          newY = 0
          newVelocityY = 0
        }
        // Wall collision
        if (newX < 0) newX = 0
        if (newX > GAME_WIDTH - PLAYER_SIZE) newX = GAME_WIDTH - PLAYER_SIZE
        // Check bomb collection
        setBombs(prevBombs => {
          let updated = false
          const newBombs = prevBombs.map(bomb => {
            if (!bomb.collected &&
                Math.abs(newX - bomb.x) < PLAYER_SIZE &&
                Math.abs(newY - bomb.y) < PLAYER_SIZE) {
              updated = true
              setScore(prev => prev + 100)
              return { ...bomb, collected: true }
            }
            return bomb
          })
          return updated ? newBombs : prevBombs
        })
        return {
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          velocityX: newVelocityX
        }
      })
    }, 1000 / 60) // 60 FPS
    return () => clearInterval(gameLoop)
  }, [gameStarted, keys])
  useEffect(() => {
    if (!gameStarted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      // Draw player
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE)
      // Draw bombs
      bombs.forEach(bomb => {
        if (!bomb.collected) {
          ctx.fillStyle = '#ffff00'
          ctx.beginPath()
          ctx.arc(bomb.x + BOMB_SIZE/2, bomb.y + BOMB_SIZE/2, BOMB_SIZE/2, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      requestAnimationFrame(render)
    }
    render()
  }, [gameStarted, player, bombs])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-zinc-900 to-black">
      <Card className="p-6 bg-zinc-800 text-white">
        <div className="text-2xl mb-4">Score: {score}</div>
        {!gameStarted ? (
          <div className="text-center">
            <h1 className="text-3xl mb-4">Bomb Jack Clone</h1>
            <p className="mb-4">Use arrow keys to move and SPACE to jump (press multiple times to multi-jump!)</p>
            <Button 
              onClick={() => setGameStarted(true)}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Start Game
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