import { useState } from 'react'
import { Quiz } from './components/Quiz'
import { Explorer } from './components/Explorer'
import './App.css'

type Tab = 'quiz' | 'explore'

export default function App() {
  const [tab, setTab] = useState<Tab>('quiz')

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo">◷</span> Doomsday Trainer
        </h1>
        <p className="tagline">
          Practice Conway's algorithm for finding the day of the week of any date.
        </p>
      </header>

      <nav className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'quiz'}
          className={tab === 'quiz' ? 'active' : ''}
          onClick={() => setTab('quiz')}
        >
          Quiz me
        </button>
        <button
          role="tab"
          aria-selected={tab === 'explore'}
          className={tab === 'explore' ? 'active' : ''}
          onClick={() => setTab('explore')}
        >
          Break down a date
        </button>
      </nav>

      <main>{tab === 'quiz' ? <Quiz /> : <Explorer />}</main>

      <footer className="app-footer">
        <p>
          The Doomsday rule was devised by John Conway. Every date is verified
          against the exhaustively-tested algorithm in{' '}
          <code>src/doomsday.ts</code>.
        </p>
      </footer>
    </div>
  )
}
