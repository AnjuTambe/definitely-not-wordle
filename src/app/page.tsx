import Game from "@/components/Game";

export const metadata = {
  title: 'Not Wordle',
  description: 'A definitely not Wordle game built for the fullstack intern project.',
};

export default function Home() {
  return (
    <main>
      <Game />
    </main>
  );
}
