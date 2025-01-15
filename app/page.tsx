'use client'
  
  import { Button } from '@/components/ui/button'
  
  export default function Home() {
  return (
  <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-zinc-900 to-black">
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
      <h1 className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-8">
        Welcome to Magnolia
      </h1>
      
      <p className="text-zinc-200 text-center mb-8">
        Get started by editing <code className="font-mono font-bold">app/page.tsx</code>
      </p>
  
      <div className="flex justify-center gap-4">
        <Button
          className="bg-pink-500 hover:bg-pink-600"
          onClick={() => window.open('https://nextjs.org/docs', '_blank')}
        >
          Next.js Docs
        </Button>
        <Button
          className="bg-violet-500 hover:bg-violet-600"
          onClick={() => window.open('https://tailwindcss.com/docs', '_blank')}
        >
          Tailwind Docs
        </Button>
      </div>
    </div>
  </main>
  )
  }