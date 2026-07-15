'use client';
import { useEffect, useState, use } from "react";
import GameEngine from "@/components/GameEngine";

export default function PlayGame({ params }) {
  const { slug } = use(params);
  const [state, setState] = useState({ status: "loading", config: null });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("not-found");
        return res.json();
      })
      .then((config) => {
        if (!cancelled) setState({ status: "ready", config });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", config: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8EF", color: "#6B6152", fontFamily: "sans-serif" }}>
        Loading game…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8EF", color: "#6B6152", fontFamily: "sans-serif" }}>
        This game isn't available.
      </div>
    );
  }

  return <GameEngine config={state.config} />;
}
