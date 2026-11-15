import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://xunrwdipjoihrxiodcrv.supabase.co';
const supabaseKey = 'sb_publishable_dNmgKG_IgfE9Becl-aFXjA_T7X7Nhob';

const supabase = createClient(supabaseUrl, supabaseKey);

// Vista inicial centrada en la zona
const INITIAL_VIEW_STATE = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 12,
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
  const [puntos, setPuntos] = useState([]);

  useEffect(() => {
    async function fetchPuntos() {
      try {
        const { data, error } = await supabase
          .from('puntos')
          .select('*');

        if (error) {
          console.error('Error en Supabase:', error.message);
        } else if (data && data.length > 0) {
          console.log('Datos cargados con éxito:', data);
          setPuntos(data);
        } else {
          console.warn('La tabla puntos está vacía o no devolvió registros.');
        }
      } catch (err) {
        console.error('Error de red al conectar con Supabase:', err);
      }
    }

    fetchPuntos();
  }, []);

  // Capa para renderizar los puntos dinámicos
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
    getFillColor: d => {
      // Si la cantidad supera 3 se pinta de rojo, si no de naranja
      return (d.cantidad || 1) > 3 
        ? [255, 69, 0, 200]   // Rojo / Naranja rojizo (Alta frecuencia)
        : [255, 165, 0, 180];  // Naranja (Baja frecuencia)
    },
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', margin: 0, padding: 0, overflow: 'hidden' }}>
      
      {/* 📊 Panel de Mini Dashboard Flotante con Leyenda */}
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
        minWidth: '260px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e293b' }}>ISFT N.º 199</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>PoC Georreferenciada</p>
        
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />
        
        {/* Contador de Registros */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
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

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />

        {/* 🎨 Leyenda de Colores */}
        <div style={{ fontSize: '12px', color: '#475569' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1e293b' }}>Frecuencia de Siniestros:</p>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: '#ff4500', borderRadius: '50%', display: 'inline-block', marginRight: '8px' }}></span>
            <span>Alta frecuencia (Mayor a 5)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: '#ffa500', borderRadius: '50%', display: 'inline-block', marginRight: '8px' }}></span>
            <span>Baja frecuencia (1 a 3)</span>
          </div>
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