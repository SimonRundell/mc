import { useState } from 'react';

export default function NameEntryModal({ defaultName, score, onSubmit, onDismiss }) {
  const [name, setName] = useState(defaultName || '');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(name.trim() || 'Anonymous');
  }

  return (
    <div className="name-entry-modal__backdrop">
      <form className="name-entry-modal" onSubmit={handleSubmit}>
        <h3>A top ten score!</h3>
        <p>
          {score} points is good enough for the board. Enter a name for the record books.
        </p>
        <input
          type="text"
          value={name}
          maxLength={40}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
        <div className="name-entry-modal__actions">
          <button type="button" className="button-secondary" onClick={onDismiss}>
            Skip
          </button>
          <button type="submit" className="button-primary">
            Save score
          </button>
        </div>
      </form>
    </div>
  );
}
