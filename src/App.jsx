import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://wggddhalnobtnpdhspsf.supabase.co';
const supabaseKey = 'sb_publishable_8DoJUbrXVfE3FHCmEuIFEg_l1vCHqvw';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Vista inicial centrada en Buenos Aires
const INITIAL_VIEW_STATE = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 13,
  maxZoom: 19,
  minZoom: 0
};

// Capa del mapa base de calles (OpenStreetMap)
const tileLayer = new TileLayer({
  id: 'openstreetmap-tiles',
  data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 19,
  tileSize: 256,
  renderSubLayers: props => {
    const {
      bbox: { west, south, east, north }
    } = props.tile;

    return new BitmapLayer(props, {
      data: null,
      image: props.data,
      bounds: [west, south, east, north]
    });
  }
});

export default function App() {
  const [puntos, setPuntos] = useState([
    { id: 'default', longitud: -58.3816, latitud: -34.6037 }
  ]);

  useEffect(() => {
    async function fetchPuntos() {
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('puntos') // Cambia 'puntos' si tu tabla se llama distinto
          .select('*');

        if (!error && data && data.length > 0) {
          setPuntos(data);
        }
      } catch (err) {
        console.error('Error al conectar con Supabase:', err);
      }
    }

    fetchPuntos();
  }, []);

  // Capa para renderizar los puntos
  const puntosLayer = new ScatterplotLayer({
    id: 'puntos-layer',
    data: puntos,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 6,
    radiusMinPixels: 8,
    radiusMaxPixels: 20,
    lineWidthMinPixels: 2,
    getPosition: d => [parseFloat(d.longitud), parseFloat(d.latitud)],
    getFillColor: [255, 0, 0],       // Rojo
    getLineColor: [255, 255, 255]    // Blanco
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', margin: 0, padding: 0, overflow: 'hidden' }}>
      
      {/* 📊 Panel de Mini Dashboard Flotante */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'white',
        padding: '18px 22px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minWidth: '240px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e293b' }}>ISFT N.º 199</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>PoC Georreferenciada</p>
        
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>Registros Activos:</span>
          <span style={{ 
            background: '#2563eb', 
            color: 'white', 
            padding: '3px 10px', 
            borderRadius: '20px', 
            fontSize: '13px', 
            fontWeight: 'bold' 
          }}>
            {puntos.length}
          </span>
        </div>
      </div>

      {/* 🗺️ Visor del Mapa con Deck.gl */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[tileLayer, puntosLayer]}
      />
    </div>
  );
}