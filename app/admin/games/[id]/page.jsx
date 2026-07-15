'use client';
import { use } from "react";
import GameForm from "../GameForm";

export default function EditGamePage({ params }) {
  const { id } = use(params);
  return (
    <>
      <h1 className="admin-h1">Edit game</h1>
      <GameForm gameId={id} />
    </>
  );
}
