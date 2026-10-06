import { useMemo, useState } from 'react';

export default function StationSelect({ options, onSelect, disabled, timeLeft }) {
  const [value, setValue] = useState('');

  // Only selectable options are listed; anything disabled is left out.
  const grouped = useMemo(() => {
    const shown = options.filter((o) => !o.disabled);
    const mc = shown.find((o) => o.isMCOption);
    const special = shown.filter((o) => o.special && !o.isMCOption);
    const normal = shown.filter((o) => !o.special && !o.isMCOption);
    return { mc, special, normal };
  }, [options]);

  // A choice made earlier can drop off the shortlist when the turn moves on,
  // so only keep it if it is still selectable.
  const selected = options.find((o) => o.name === value && !o.disabled) ? value : '';

  function handleSubmit(e) {
    e.preventDefault();
    const option = options.find((o) => o.name === selected);
    if (option && !option.disabled) {
      onSelect(option);
      setValue('');
    }
  }

  function optionLabel(o) {
    let label = o.name;
    if (o.status !== 'open') label += ' (closed)';
    return label;
  }

  return (
    <form className="station-select" onSubmit={handleSubmit}>
      {timeLeft !== null && <div className="station-select__timer">{timeLeft}s</div>}

      <select
        className="station-select__dropdown"
        value={selected}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        required
      >
        <option value="" disabled>
          Choose your move&hellip;
        </option>

        {grouped.mc && (
          <option value={grouped.mc.name}>Mornington Crescent</option>
        )}

        <optgroup label="Stations">
          {grouped.normal.map((o, i) => (
            <option key={`${o.name}-${i}`} value={o.name}>
              {optionLabel(o)}
            </option>
          ))}
        </optgroup>

        {grouped.special.length > 0 && (
          <optgroup label="Landmarks & hospitals">
            {grouped.special.map((o, i) => (
              <option key={`${o.name}-${i}`} value={o.name}>
                {optionLabel(o)}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <button type="submit" className="button-primary" disabled={disabled || !selected}>
        Make move
      </button>
    </form>
  );
}
