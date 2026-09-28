export default function RuleCard({ effects }) {
  if (!effects) return null;
  const { rule } = effects;

  return (
    <div className="rule-card">
      <div className="rule-card__header">
        <span className="rule-card__label">Tonight's rule</span>
      </div>
      <h2 className="rule-card__name">{rule.name}</h2>
      <p className="rule-card__description">{rule.description}</p>
    </div>
  );
}
