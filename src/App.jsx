import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Vista inicial (ajusta latitud y longitud según tu zona, por defecto Buenos Aires)
const INITIAL_VIEW_STATE = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 13,
  maxZoom: 19,
  minZoom: 0
};

// Mapa base de calles optimizado (CartoDB Voyager)
const tileLayer = new TileLayer({
  id: 'base-map-tile',
  data: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  maxZoom: 19,
  minZoom: 0,
  subdomains: ['a', 'b', 'c', 'd'],
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
      const { data, error } = await supabase.from('puntos').select('*');
      if (!error && data) {
        setPuntos(data);
      }
    }
    fetchPuntos();
  }, []);

  // Capa de tus puntos georreferenciados
  const puntosLayer = new ScatterplotLayer({
    id: 'puntos-layer',
    data: puntos,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 6,
    radiusMinPixels: 6,
    radiusMaxPixels: 15,
    lineWidthMinPixels: 2,
    getPosition: d => [parseFloat(d.longitud), parseFloat(d.latitud)],
    getFillColor: [255, 0, 0],       // Rojo para destacar los puntos
    getLineColor: [255, 255, 255]    // Borde blanco
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, margin: 0, padding: 0, overflow: 'hidden' }}>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[tileLayer, puntosLayer]}
      />
    </div>
  );
}