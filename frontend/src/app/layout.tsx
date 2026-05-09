import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'SOLY — AI Coding Assistant for Web3',
  description: 'Your AI coding assistant built for Solidity and Web3 development. Ask architecture questions, get code reviewed, and ship better smart contracts.',
  openGraph: {
    title: 'SOLY — AI Coding Assistant for Web3',
    description: 'Expert Solidity and Web3 AI coding assistant.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  )
}
