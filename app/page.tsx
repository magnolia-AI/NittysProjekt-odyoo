"use client"
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
export default function Home() {
  const router = useRouter()
    return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-zinc-900 to-black">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-8">
          Bomb Jack Clone
        </h1>
                <p className="text-zinc-200 text-center mb-8">
          A simple browser-based clone of the classic game Bomb Jack
        </p>
        <div className="flex justify-center gap-4">
          <Button
            className="bg-pink-500 hover:bg-pink-600"
            onClick={() => router.push('/game')}
          >
            Play Game
          </Button>
        </div>
      </div>
    </main>
  )
}