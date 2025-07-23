import React, { useRef, useState, useEffect } from 'react';
import { GEOFENCE_CENTER } from '../geofenceConfig';

const GEOFENCE_RADIUS_METERS = 150; // 100-200m

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Stub for future AI processing
function processImageForAI(imageDataUrl: string) {
  // Placeholder for AI processing
  console.log('Image ready for AI processing:', imageDataUrl);
}

const CameraCapture: React.FC<{
  onCapture: (img: string) => void;
  location: { lat: number; lon: number } | null;
}> = ({ onCapture, location }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!capturing) return;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        setError('Camera access denied or unavailable.');
      }
    })();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturing]);

  const handleCapture = () => {
    if (!videoRef.current || !location) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    // Overlay timestamp and geolocation
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
    ctx.fillStyle = 'white';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`Time: ${timestamp}`, 10, canvas.height - 45);
    ctx.fillText(`Lat: ${location.lat.toFixed(5)}`, 10, canvas.height - 20);
    ctx.fillText(`Lon: ${location.lon.toFixed(5)}`, 220, canvas.height - 20);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCapture(dataUrl);
    processImageForAI(dataUrl);
  };

  if (!capturing) {
    return (
      <button type="button" onClick={() => setCapturing(true)} style={{ marginBottom: 8 }}>
        Open Live Camera
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', maxWidth: 320, borderRadius: 8, background: '#000' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={handleCapture} disabled={!location}>
          Capture Photo
        </button>
      </div>
    </div>
  );
};

const Form: React.FC = () => {
  const [fields, setFields] = useState({ name: '', email: '', comments: '' });
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [geoAllowed, setGeoAllowed] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const getLocation = () => {
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon });
        const dist = haversine(lat, lon, GEOFENCE_CENTER.lat, GEOFENCE_CENTER.lon);
        setGeoAllowed(dist <= GEOFENCE_RADIUS_METERS);
        setGeoError(dist <= GEOFENCE_RADIUS_METERS ? '' : `You are ${Math.round(dist)}m from the allowed location.`);
        setGeoLoading(false);
      },
      (err) => {
        setGeoError('Geolocation permission denied or unavailable. Please enable location and try again.');
        setGeoAllowed(false);
        setGeoLoading(false);
      }
    );
  };

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleCapture = (img: string) => {
    if (img && img.startsWith('data:image')) {
      setImages((prev) => [...prev, img]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Submit logic here (e.g., send to API)
    setTimeout(() => {
      alert('Form submitted!');
      setSubmitting(false);
      window.location.reload();
    }, 1000);
  };

  const isFormValid =
    fields.name.trim() !== '' &&
    fields.email.trim() !== '' &&
    fields.comments.trim() !== '' &&
    images.length > 0;

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 0,
      position: 'relative',
    }}>
      {/* App Bar */}
      <header style={{
        width: '100%',
        height: 56,
        background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: 1,
        boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10,
      }}>
        Form
      </header>
      {/* Safe area for app bar */}
      <div style={{ height: 56 }} />
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: 24,
        margin: '24px 0 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label>
            Name:
            <input
              name="name"
              value={fields.name}
              onChange={handleFieldChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                marginTop: 4,
                marginBottom: 0,
                boxSizing: 'border-box',
              }}
            />
          </label>
          <label>
            Email:
            <input
              name="email"
              type="email"
              value={fields.email}
              onChange={handleFieldChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                marginTop: 4,
                marginBottom: 0,
                boxSizing: 'border-box',
              }}
            />
          </label>
          <label>
            Message:
            <textarea
              name="message"
              value={fields.comments}
              onChange={e => setFields({ ...fields, comments: e.target.value })}
              rows={4}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                marginTop: 4,
                marginBottom: 0,
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: 80,
                maxHeight: 240,
              }}
            />
          </label>
          <label>
            Capture Images (Live Camera Only):
            <CameraCapture onCapture={handleCapture} location={location} />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, justifyContent: 'center' }}>
            {images.map((img, i) => (
              <img key={i} src={img} style={{ width: 100, marginRight: 8, marginBottom: 8 }} />
            ))}
          </div>
          <div style={{ color: geoAllowed ? '#059669' : '#dc2626', marginBottom: 8, textAlign: 'center', fontWeight: 500, fontSize: 15 }}>
            {geoLoading ? 'Getting location...' : geoError || 'Location OK'}
          </div>
          <button type="button" onClick={getLocation} style={{
            marginBottom: 8,
            background: '#f1f5f9',
            color: '#334155',
            border: 'none',
            borderRadius: 12,
            padding: '14px 0',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            Retry Location
          </button>
          <button type="submit" disabled={!geoAllowed || submitting || !isFormValid} style={{
            marginTop: 8,
            background: geoAllowed && isFormValid ? '#2563eb' : '#94a3b8',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '16px 0',
            fontWeight: 700,
            fontSize: 18,
            cursor: geoAllowed && isFormValid ? 'pointer' : 'not-allowed',
            boxShadow: geoAllowed && isFormValid ? '0 2px 8px rgba(37,99,235,0.10)' : 'none',
            transition: 'background 0.2s',
            letterSpacing: 1,
          }}>
            Submit
          </button>
        </form>
      </div>
      {/* Safe area for bottom on mobile */}
      <div style={{ height: 24 }} />
    </main>
  );
};

export default Form; 