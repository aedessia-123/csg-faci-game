import GameForm from "../GameForm";

export default function NewGamePage() {
  return (
    <>
      <h1 className="admin-h1">New game</h1>
      <p className="admin-sub">Pick a level, then curate which scenarios belong in this run.</p>
      <GameForm />
    </>
  );
}
