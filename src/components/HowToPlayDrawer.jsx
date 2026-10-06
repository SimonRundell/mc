import { useEffect, useState } from 'react';

/**
 * Fixed "How to play" button that opens a drawer from the right. The
 * drawer pretends the rules page has gone missing by showing a stock
 * Apache 404 page, which is about as much as anyone has ever been told.
 *
 * @returns {JSX.Element}
 */
export default function HowToPlayDrawer() {
  const [open, setOpen] = useState(false);

  // Escape closes the drawer, as players would expect from any overlay.
  useEffect(() => {
    if (!open) return undefined;

    /** @param {KeyboardEvent} e */
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="button-primary how-to-play__button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="how-to-play-drawer"
      >
        How to play Mornington Crescent
      </button>

      <div
        className={`how-to-play__backdrop${open ? ' how-to-play__backdrop--open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="how-to-play-drawer"
        className={`how-to-play__drawer${open ? ' how-to-play__drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="How to play Mornington Crescent"
        inert={!open}
      >
        <div className="how-to-play__chrome">
          <span className="how-to-play__address">
            http://localhost/rules/mornington-crescent.html
          </span>
          <button
            type="button"
            className="how-to-play__close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="how-to-play__page">
          <h1>Not Found</h1>
          <p>The requested URL /rules/mornington-crescent.html was not found on this server.</p>
          <p>
            Additionally, a 404 Not Found error was encountered while trying to use an
            ErrorDocument to handle the request.
          </p>
          <hr />
          <address>Apache/2.4.62 (Win64) OpenSSL/3.1.7 PHP/8.3.12 Server at localhost Port 80</address>
        </div>
      </aside>
    </>
  );
}
