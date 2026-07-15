'use client';
import { use } from "react";
import ScenarioForm from "../ScenarioForm";

export default function EditScenarioPage({ params }) {
  const { id } = use(params);
  return (
    <>
      <h1 className="admin-h1">Edit scenario</h1>
      <ScenarioForm scenarioId={id} />
    </>
  );
}
