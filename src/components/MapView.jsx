import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconAnchor: [12, 41],
});

function RecenterMap({ center }) {
  const map = useMap();
  map.setView(center, 10);
  return null;
}

export default function MapView({ geoData }) {
  if (!geoData?.loc) {
    return (
      <div className="panel map-panel fade-in">
        <h2>Map</h2>
        <p className="muted">Location coordinates are unavailable for this IP.</p>
      </div>
    );
  }

  const [lat, lng] = geoData.loc.split(',').map(Number);
  const center = [lat, lng];

  return (
    <div className="panel map-panel fade-in">
      <h2>Map</h2>
      <MapContainer center={center} zoom={10} scrollWheelZoom className="leaflet-map">
        <RecenterMap center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={markerIcon}>
          <Popup>
            {geoData.city || 'Unknown City'}, {geoData.country || 'Unknown Country'}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
