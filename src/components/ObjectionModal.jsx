export default function ObjectionModal({ objection, players }) {
  if (!objection) return null;

  const caller = players.find((p) => p.id === objection.callerId);
  const objector = objection.objectorId ? players.find((p) => p.id === objection.objectorId) : null;

  return (
    <div className="objection-modal__backdrop">
      <div className="objection-modal">
        <p className="objection-modal__line">{caller?.name} calls Mornington Crescent!</p>

        {objection.stage !== 'called' && objection.raised && (
          <p className="objection-modal__line objection-modal__line--objection">
            {objector?.name} objects!
          </p>
        )}

        {objection.stage === 'ruled' && objection.raised && (
          <p
            className={`objection-modal__line objection-modal__line--ruling ${
              objection.upheld ? 'is-upheld' : 'is-dismissed'
            }`}
          >
            {objection.upheld ? 'Objection upheld. Play continues.' : 'Objection overruled. The call stands!'}
          </p>
        )}

        {objection.stage !== 'called' && !objection.raised && (
          <p className="objection-modal__line objection-modal__line--ruling is-dismissed">
            No objection. The call stands!
          </p>
        )}
      </div>
    </div>
  );
}
