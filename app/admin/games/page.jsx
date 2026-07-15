'use client';
import { useEffect, useState } from "react";

export default function GamesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/games")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Delete this game? This can't be undone.")) return;
    await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <div className="admin-row-between">
        <div>
          <h1 className="admin-h1">Games</h1>
          <p className="admin-sub">A named, publishable bundle of scenarios for a level + occasion. Play at /play/&lt;slug&gt;.</p>
        </div>
        <a href="/admin/games/new" className="admin-btn">+ New game</a>
      </div>

      {loading ? (
        <p className="admin-sub">Loading…</p>
      ) : items.length === 0 ? (
        <div className="admin-empty">No games yet.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Level</th>
              <th>Occasion</th>
              <th>Scenarios</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td><code>{g.slug}</code></td>
                <td>{g.level.key}</td>
                <td>{g.occasion || "—"}</td>
                <td>{g.scenarios.length}</td>
                <td>
                  <span className={`admin-badge ${g.status.toLowerCase()}`}>{g.status}</span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={`/admin/games/${g.id}`} className="admin-btn secondary">Edit</a>{" "}
                  {g.status === "PUBLISHED" && (
                    <a href={`/play/${g.slug}`} target="_blank" rel="noreferrer" className="admin-btn secondary">Play</a>
                  )}{" "}
                  <button className="admin-btn danger" onClick={() => remove(g.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
