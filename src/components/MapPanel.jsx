import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function makeIcon(label, variant) {
  return L.divIcon({
    className: `map-pin map-pin--${variant}`,
    html: `<span>${label}</span>`,
    iconSize: [26, 26],
  });
}

export default function MapPanel({ moveHistory, hidden }) {
  if (hidden) {
    return (
      <div className="map-panel map-panel--hidden">
        <p>The map is hidden under tonight's rule.</p>
      </div>
    );
  }

  const pinned = moveHistory.filter((m) => m.coordinates);
  const positions = pinned.map((m) => [m.coordinates.lat, m.coordinates.lon]);

  return (
    <div className="map-panel">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={11}
        scrollWheelZoom={false}
        className="map-panel__map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color: '#dc241f', weight: 3 }} />
        )}
        {pinned.map((m, i) => (
          <Marker
            key={`${i}-${m.stationName}`}
            position={[m.coordinates.lat, m.coordinates.lon]}
            icon={makeIcon(i + 1, m.isMC ? 'mc' : m.special ? 'special' : 'normal')}
          >
            <Tooltip>{m.stationName}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
