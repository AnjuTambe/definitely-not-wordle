import { NextResponse } from 'next/server';
import { WORDS } from '@/lib/words';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  const randomIndex = Math.floor(Math.random() * WORDS.length);
  const targetWord = WORDS[randomIndex].toUpperCase();
  
  const token = encrypt(targetWord);
  
  return NextResponse.json({ token });
}
