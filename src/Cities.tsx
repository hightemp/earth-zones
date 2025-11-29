import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as THREE from 'three';

export interface City {
  name: string;
  lat: number;
  lon: number;
  country: string;
  id: number;
}

interface CitiesProps {
  showCities: boolean;
  showCity: boolean;
  filter: string;
  selectedCityId: number | null;
  onCitySelect?: (city: City) => void;
}

export const Cities: React.FC<CitiesProps> = ({ showCities, showCity, filter, selectedCityId }) => {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    Papa.parse('world_cities.csv', {
      download: true,
      complete: (results) => {
        const parsedCities: City[] = results.data
          .map((row: any, index) => {
             // Assuming CSV format based on C++ code: name, ?, lat, lon
             // C++: oSplitedLine[0] (name), oSplitedLine[2] (lat), oSplitedLine[3] (lon)
             if (row.length < 4) return null;
             return {
               id: index,
               name: row[0],
               lat: parseFloat(row[2]),
               lon: parseFloat(row[3]),
               country: row[1] // Assuming country is at index 1
             };
          })
          .filter((city): city is City => city !== null && !isNaN(city.lat) && !isNaN(city.lon));
        setCities(parsedCities);
      },
      error: (err) => {
          console.error("Error parsing CSV:", err);
      }
    });
  }, []);

  const filteredCities = useMemo(() => {
      if (!filter) return cities;
      const lowerFilter = filter.toLowerCase();
      return cities.filter(c => c.name.toLowerCase().includes(lowerFilter));
  }, [cities, filter]);

  // Convert lat/lon to 3D position
  // Three.js Sphere: Y is up.
  // We need to match the texture.
  // Let's try standard conversion first.
  const getPosition = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 300) * (Math.PI / 180); // +180 might be needed depending on texture start
    
    // Standard spherical to cartesian (Y up)
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
  };

  // Create geometry for all cities (points)
  const pointsGeometry = useMemo(() => {
      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];
      
      filteredCities.forEach(city => {
          const pos = getPosition(city.lat, city.lon, 1.01); // Slightly above surface
          positions.push(pos.x, pos.y, pos.z);
          colors.push(1, 0, 0); // Red
      });
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return geometry;
  }, [filteredCities]);

  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {/* Rotation adjustment to match texture if needed. Usually textures start at -180 or 0. */}
      
      {showCities && (
        <points geometry={pointsGeometry}>
          <pointsMaterial size={0.01} vertexColors />
        </points>
      )}

      {showCity && selectedCityId !== null && (
          <CityMarker city={cities.find(c => c.id === selectedCityId)} getPosition={getPosition} />
      )}
    </group>
  );
};

const CityMarker: React.FC<{ city?: City, getPosition: (lat: number, lon: number, r: number) => THREE.Vector3 }> = ({ city, getPosition }) => {
    if (!city) return null;
    const pos = getPosition(city.lat, city.lon, 1.0);
    const posHigh = getPosition(city.lat, city.lon, 1.1); // Line sticking out

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([pos, posHigh]);

    return (
        <group>
            <lineSegments geometry={lineGeometry}>
                <lineBasicMaterial color="yellow" />
            </lineSegments>
            <mesh position={posHigh}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color="yellow" />
            </mesh>
        </group>
    );
}