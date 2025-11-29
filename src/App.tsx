import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Earth } from './Earth'
import { Cities, type City } from './Cities'
import './App.css'

function App() {
  const [showAxis, setShowAxis] = useState(true)
  const [showEarth, setShowEarth] = useState(true)
  const [showPoliticalMap, setShowPoliticalMap] = useState(true)
  const [showCenters, setShowCenters] = useState(true)
  const [showColorBox, setShowColorBox] = useState(true)
  const [showCities, setShowCities] = useState(true)
  const [showCity, setShowCity] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  const handleCitySelect = (city: City) => {
      setSelectedCityId(city.id);
  }

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            {showEarth && (
                <Earth 
                    showPoliticalMap={showPoliticalMap} 
                    showCenters={showCenters} 
                    showColorBox={showColorBox}
                    showAxis={showAxis}
                />
            )}
            <Cities 
                showCities={showCities} 
                showCity={showCity} 
                filter={cityFilter}
                selectedCityId={selectedCityId}
                onCitySelect={handleCitySelect}
            />
          </Suspense>
          <OrbitControls />
        </Canvas>
      </div>
      
      <div className="ui-panel">
        <div className="group-box">
            <h3>Options</h3>
            <label>
                <input type="checkbox" checked={showAxis} onChange={e => setShowAxis(e.target.checked)} />
                Show axis
            </label>
            <label>
                <input type="checkbox" checked={showEarth} onChange={e => setShowEarth(e.target.checked)} />
                Show earth
            </label>
            <label>
                <input type="checkbox" checked={showPoliticalMap} onChange={e => setShowPoliticalMap(e.target.checked)} />
                Show political map
            </label>
            <label>
                <input type="checkbox" checked={showCenters} onChange={e => setShowCenters(e.target.checked)} />
                Show centers
            </label>
            <label>
                <input type="checkbox" checked={showColorBox} onChange={e => setShowColorBox(e.target.checked)} />
                Show color box
            </label>
            <label>
                <input type="checkbox" checked={showCities} onChange={e => setShowCities(e.target.checked)} />
                Show all cities
            </label>
            <label>
                <input type="checkbox" checked={showCity} onChange={e => setShowCity(e.target.checked)} />
                Show cities
            </label>
            
            <input 
                type="text" 
                placeholder="Filter cities..." 
                value={cityFilter} 
                onChange={e => setCityFilter(e.target.value)} 
                style={{ marginTop: '10px', width: '100%' }}
            />
            
            <CityList 
                filter={cityFilter} 
                onSelect={handleCitySelect} 
                selectedId={selectedCityId}
            />
        </div>
      </div>
    </div>
  )
}

// Separate component for list to handle data loading independently if needed, 
// but here we can just reuse the logic or pass data. 
// Since Cities component loads data, we might want to lift state up or duplicate loading.
// For simplicity, let's lift state up in a real app, but here I'll just duplicate the loading logic 
// or better yet, move the loading to App.tsx.

// Let's move loading to App.tsx to avoid double loading and share data.
// But wait, I already wrote Cities.tsx. I will refactor Cities.tsx to accept data.
// Actually, I'll just make a small helper here to load cities for the list, 
// or better, refactor Cities.tsx to be just a renderer and load data in App.tsx.
// Refactoring is cleaner.

export default App

import Papa from 'papaparse';
import { useEffect } from 'react';

const CityList = ({ filter, onSelect, selectedId }: { filter: string, onSelect: (c: City) => void, selectedId: number | null }) => {
    const [cities, setCities] = useState<City[]>([]);

    useEffect(() => {
        Papa.parse('world_cities.csv', {
          download: true,
          complete: (results) => {
            const parsedCities: City[] = results.data
              .map((row: any, index) => {
                 if (row.length < 4) return null;
                 return {
                   id: index,
                   name: row[0],
                   lat: parseFloat(row[2]),
                   lon: parseFloat(row[3]),
                   country: row[1]
                 };
              })
              .filter((city): city is City => city !== null && !isNaN(city.lat) && !isNaN(city.lon));
            setCities(parsedCities);
          }
        });
      }, []);

    const filtered = cities.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="city-list">
            {filtered.map(city => (
                <div 
                    key={city.id} 
                    className={`city-item ${selectedId === city.id ? 'selected' : ''}`}
                    onClick={() => onSelect(city)}
                >
                    {city.name}
                </div>
            ))}
        </div>
    )
}
