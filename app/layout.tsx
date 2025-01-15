import './globals.css'
  import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  
  const inter = Inter({ subsets: ['latin'] })
  
  export const metadata: Metadata = {
  title: 'Magnolia App',
  description: 'Built with Next.js and Tailwind CSS',
  }
  
  export default function RootLayout({
  children,
  }: {
  children: React.ReactNode
  }) {
  return (
  <html lang="en" className="h-full">
    <body className={`${inter.className} h-full`}>{children}</body>
  </html>
  )
  }