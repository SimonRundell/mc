import { useMemo, useState } from 'react';

export default function StationSelect({ options, onSelect, disabled, timeLeft }) {
  const [value, setValue] = useState('');

  const grouped = useMemo(() => {
    const mc = options.find((o) => o.isMCOption);
    const special = options.filter((o) => o.special && !o.isMCOption);
    const normal = options.filter((o) => !o.special && !o.isMCOption);
    return { mc, special, normal };
  }, [options]);

  function handleSubmit(e) {
    e.preventDefault();
    const option = options.find((o) => o.name === value);
    if (option && !option.disabled) {
      onSelect(option);
      setValue('');
    }
  }

  function optionLabel(o) {
    let label = o.name;
    if (o.status !== 'open') label += ' (closed)';
    if (o.disabled && o.reason) label += ` — ${o.reason}`;
    return label;
  }

  return (
    <form className="station-select" onSubmit={handleSubmit}>
      {timeLeft !== null && <div className="station-select__timer">{timeLeft}s</div>}

      <select
        className="station-select__dropdown"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        required
      >
        <option value="" disabled>
          Choose your move&hellip;
        </option>

        {grouped.mc && (
          <option value={grouped.mc.name} disabled={grouped.mc.disabled} title={grouped.mc.reason}>
            {grouped.mc.disabled ? `Mornington Crescent — ${grouped.mc.reason}` : 'Mornington Crescent'}
          </option>
        )}

        <optgroup label="Stations">
          {grouped.normal.map((o, i) => (
            <option key={`${o.name}-${i}`} value={o.name} disabled={o.disabled} title={o.reason}>
              {optionLabel(o)}
            </option>
          ))}
        </optgroup>

        {grouped.special.length > 0 && (
          <optgroup label="Landmarks & hospitals">
            {grouped.special.map((o, i) => (
              <option key={`${o.name}-${i}`} value={o.name} disabled={o.disabled} title={o.reason}>
                {optionLabel(o)}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <button type="submit" className="button-primary" disabled={disabled || !value}>
        Make move
      </button>
    </form>
  );
}
