'use client';
import { useEffect, useState } from "react";

export default function ScenariosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/scenarios")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Delete this scenario? This only works if no game uses it.")) return;
    const res = await fetch(`/api/admin/scenarios/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Couldn't delete");
      return;
    }
    load();
  };

  return (
    <>
      <div className="admin-row-between">
        <div>
          <h1 className="admin-h1">Scenarios</h1>
          <p className="admin-sub">The content bank. Author once, reuse across many games.</p>
        </div>
        <a href="/admin/scenarios/new" className="admin-btn">+ New scenario</a>
      </div>

      {loading ? (
        <p className="admin-sub">Loading…</p>
      ) : items.length === 0 ? (
        <div className="admin-empty">No scenarios yet.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tests</th>
              <th>Occasion</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>
                  {s.competencyA.icon} {s.competencyA.name} + {s.competencyB.icon} {s.competencyB.name}
                </td>
                <td>{s.occasion || "—"}</td>
                <td>
                  <span className={`admin-badge ${s.status.toLowerCase()}`}>{s.status}</span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={`/admin/scenarios/${s.id}`} className="admin-btn secondary">Edit</a>{" "}
                  <button className="admin-btn danger" onClick={() => remove(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
