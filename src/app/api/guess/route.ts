import { NextResponse } from 'next/server';
import { WORDS } from '@/lib/words';
import { decrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { guess, token, guessNumber } = await request.json();

    if (!guess || guess.length !== 5) {
      return NextResponse.json({ error: 'Guess must be 5 letters long.' }, { status: 400 });
    }

    const upperGuess = guess.toUpperCase();
    const isWordValid = WORDS.some(w => w.toUpperCase() === upperGuess);
    
    if (!isWordValid) {
      return NextResponse.json({ error: 'Not in word list' }, { status: 400 });
    }

    const targetWord = decrypt(token);
    
    // Evaluate guess
    const targetArr = targetWord.split('');
    const guessArr = upperGuess.split('');
    const result: ('green' | 'yellow' | 'gray')[] = Array(5).fill('gray');
    
    // First pass: find greens
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'green';
        targetArr[i] = null as any; // Mark as used
        guessArr[i] = null as any; // Mark as used
      }
    }
    
    // Second pass: find yellows
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] !== null && targetArr.includes(guessArr[i])) {
        result[i] = 'yellow';
        targetArr[targetArr.indexOf(guessArr[i])] = null as any; // Mark as used
      }
    }

    const isWin = result.every(color => color === 'green');
    const isLoss = !isWin && guessNumber === 6;

    return NextResponse.json({ 
      result, 
      isWin,
      targetWord: isLoss ? targetWord : undefined 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
