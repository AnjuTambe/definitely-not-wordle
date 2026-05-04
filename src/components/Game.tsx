"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./Game.module.css";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type Color = 'green' | 'yellow' | 'gray' | '';

interface Guess {
  word: string;
  colors: Color[];
}

export default function Game() {
  const [token, setToken] = useState<string>('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [toast, setToast] = useState<string | null>(null);
  const [invalidShake, setInvalidShake] = useState(false);
  const [keyColors, setKeyColors] = useState<Record<string, Color>>({});

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    try {
      const res = await fetch('/api/start');
      const data = await res.json();
      setToken(data.token);
      setGuesses([]);
      setCurrentGuess('');
      setGameStatus('playing');
      setKeyColors({});
      setToast(null);
    } catch (error) {
      showToast('Failed to start game');
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const onKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'Enter') {
      if (currentGuess.length !== WORD_LENGTH) {
        setInvalidShake(true);
        setTimeout(() => setInvalidShake(false), 500);
        showToast('Not enough letters');
        return;
      }
      submitGuess();
    } else if (key === 'Backspace' || key === 'Delete') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Za-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + key.toUpperCase());
    }
  }, [currentGuess, gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      onKeyPress(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const submitGuess = async () => {
    try {
      const currentGuessNumber = guesses.length + 1;
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: currentGuess, token, guessNumber: currentGuessNumber })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setInvalidShake(true);
        setTimeout(() => setInvalidShake(false), 500);
        showToast(data.error || 'Invalid guess');
        return;
      }

      const newGuess: Guess = { word: currentGuess, colors: data.result };
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      // Update keyboard colors
      const newKeyColors = { ...keyColors };
      for (let i = 0; i < currentGuess.length; i++) {
        const letter = currentGuess[i];
        const color = data.result[i];
        // Green overrides yellow, yellow overrides gray
        if (color === 'green') newKeyColors[letter] = 'green';
        else if (color === 'yellow' && newKeyColors[letter] !== 'green') newKeyColors[letter] = 'yellow';
        else if (color === 'gray' && newKeyColors[letter] !== 'green' && newKeyColors[letter] !== 'yellow') newKeyColors[letter] = 'gray';
      }
      setKeyColors(newKeyColors);

      if (data.isWin) {
        setGameStatus('won');
        showToast('Splendid!');
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
        showToast(data.targetWord ? data.targetWord : 'Game Over'); 
      }
    } catch (error) {
      showToast('Error submitting guess');
    }
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
  ];

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}
      
      <div className={styles.header}>
        NOT WORDLE
      </div>

      <div className={styles.board}>
        {Array.from({ length: MAX_GUESSES }).map((_, i) => {
          const isCurrentRow = i === guesses.length;
          const guess = guesses[i];
          const rowClass = `${styles.row} ${isCurrentRow && invalidShake ? 'shake' : ''}`;

          return (
            <div key={i} className={rowClass}>
              {Array.from({ length: WORD_LENGTH }).map((_, j) => {
                let letter = '';
                let colorClass = '';
                let tileClass = styles.tile;

                if (guess) {
                  letter = guess.word[j];
                  colorClass = guess.colors[j] ? styles[guess.colors[j]] : '';
                  tileClass += ` ${colorClass} flip`; // Apply flip animation to submitted rows
                } else if (isCurrentRow && currentGuess[j]) {
                  letter = currentGuess[j];
                  tileClass += ` ${styles.filled} pop`;
                }

                return (
                  <div key={j} className={tileClass}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={styles.keyboard}>
        {keyboardRows.map((row, i) => (
          <div key={i} className={styles.keyboardRow}>
            {row.map(key => {
              const isWide = key === 'Enter' || key === 'Backspace';
              const colorClass = keyColors[key] ? styles[keyColors[key]] : '';
              return (
                <button
                  key={key}
                  onClick={() => onKeyPress(key)}
                  className={`${styles.key} ${isWide ? styles.wide : ''} ${colorClass}`}
                >
                  {key === 'Backspace' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {(gameStatus === 'won' || gameStatus === 'lost') && (
        <button 
          onClick={startNewGame}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: 'var(--color-correct)', color: '#fff', fontWeight: 'bold' }}
        >
          Play Again
        </button>
      )}
    </div>
  );
}
