import ScenarioForm from "../ScenarioForm";

export default function NewScenarioPage() {
  return (
    <>
      <h1 className="admin-h1">New scenario</h1>
      <p className="admin-sub">Every scenario needs exactly 4 options, each scoring against 2 competencies.</p>
      <ScenarioForm />
    </>
  );
}
