import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wggddhalnobtnpdhspsf.supabase.co';
const supabaseKey = 'sb_publishable_8DoJUbrXVfE3FHCmEuIFEg_l1vCHqvw';
const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_VIEW_STATE = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

export default function App() {
  const [data, setData] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data: puntos, error } = await supabase
        .from('puntos')
        .select('*');
      
      if (error) {
        console.error('Error al cargar datos:', error);
      } else {
        setData(puntos || []);
      }
    }
    fetchData();
  }, []);

  const layers = [
    new ScatterplotLayer({
      id: 'scatterplot-layer',
      data,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 5,
      radiusMaxPixels: 15,
      lineWidthMinPixels: 1,
      getPosition: d => [d.longitud, d.latitud],
      getRadius: d => d.valor || 10,
      getFillColor: [255, 0, 100, 200],
      getLineColor: [255, 255, 255],
      onHover: info => setHoverInfo(info)
    })
  ];

  const totalRegistros = data.length;
  const valorPromedio = totalRegistros > 0 
    ? (data.reduce((acc, curr) => acc + (curr.valor || 0), 0) / totalRegistros).toFixed(1) 
    : 0;
  const puntosCriticos = data.filter(d => (d.valor || 0) > 50).length;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', fontFamily: 'sans-serif' }}>
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        background: 'white', padding: '15px 20px', borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', gap: '20px'
      }}>
        <div>
          <h4 style={{ margin: 0, color: '#666', fontSize: '12px' }}>PUNTOS REGISTRADOS</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>{totalRegistros}</p>
        </div>
        <div>
          <h4 style={{ margin: 0, color: '#666', fontSize: '12px' }}>VALOR PROMEDIO</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>{valorPromedio}</p>
        </div>
        <div>
          <h4 style={{ margin: 0, color: '#666', fontSize: '12px' }}>PUNTOS CRÍTICOS</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: 'red' }}>{puntosCriticos}</p>
        </div>
      </div>

      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      >
        {hoverInfo && hoverInfo.object && (
          <div style={{
            position: 'absolute',
            zIndex: 20,
            pointerEvents: 'none',
            left: hoverInfo.x,
            top: hoverInfo.y,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <strong>{hoverInfo.object.nombre}</strong><br />
            Categoría: {hoverInfo.object.categoria}<br />
            Valor: {hoverInfo.object.valor}
          </div>
        )}
      </DeckGL>
    </div>
  );
}