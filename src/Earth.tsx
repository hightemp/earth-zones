import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D earthTexture;
uniform sampler2D politicalTexture;
uniform bool showPoliticalMap;
uniform bool showCenters;
uniform bool showColorBox;
uniform float centersRadius;

varying vec2 vUv;
varying vec3 vPosition;

vec3 getColorByPosition(vec3 pos) {
    vec3 absPos = abs(pos);
    float maxComp = max(absPos.x, max(absPos.y, absPos.z));
    
    vec3 color = vec3(0.0);
    
    if (maxComp == absPos.y) {
        if (pos.y > 0.0) color = vec3(1.0, 1.0, 1.0); // +Y White (Top)
        else color = vec3(0.0, 0.0, 0.0);             // -Y Black (Bottom)
    } else if (maxComp == absPos.x) {
        if (pos.x > 0.0) color = vec3(0.0, 1.0, 0.0); // +X Green
        else color = vec3(0.0, 0.0, 1.0);             // -X Blue
    } else {
        if (pos.z > 0.0) color = vec3(1.0, 0.0, 0.0); // +Z Red
        else color = vec3(1.0, 1.0, 0.0);             // -Z Yellow
    }

    if (showCenters) {
        vec3 norm = normalize(pos);
        if (distance(norm, vec3(1.0, 0.0, 0.0)) < centersRadius ||
            distance(norm, vec3(-1.0, 0.0, 0.0)) < centersRadius ||
            distance(norm, vec3(0.0, 1.0, 0.0)) < centersRadius ||
            distance(norm, vec3(0.0, -1.0, 0.0)) < centersRadius ||
            distance(norm, vec3(0.0, 0.0, 1.0)) < centersRadius ||
            distance(norm, vec3(0.0, 0.0, -1.0)) < centersRadius) {
            return vec3(1.0, 0.0, 0.0); // Red centers
        }
    }
    
    return color;
}

void main() {
    vec3 colorBox = getColorByPosition(vPosition);
    vec4 earthColor = texture2D(earthTexture, vUv);
    
    vec4 finalColor;
    
    if (showColorBox) {
        finalColor = mix(vec4(colorBox, 1.0), earthColor, 0.5);
    } else {
        finalColor = earthColor;
    }

    if (showPoliticalMap) {
        vec2 politicalUv = vUv;
        politicalUv.x += 0.417; // Offset from C++ code
        vec4 politicalColor = texture2D(politicalTexture, politicalUv);
        finalColor = mix(finalColor, politicalColor, 0.5);
    }

    gl_FragColor = finalColor;
}
`;

interface EarthProps {
  showPoliticalMap: boolean;
  showCenters: boolean;
  showColorBox: boolean;
  showAxis: boolean;
}

export const Earth: React.FC<EarthProps> = ({ showPoliticalMap, showCenters, showColorBox, showAxis }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [earthMap, politicalMap] = useLoader(TextureLoader, ['earth.jpg', 'earth_political.jpg']);

  const uniforms = useMemo(
    () => ({
      earthTexture: { value: earthMap },
      politicalTexture: { value: politicalMap },
      showPoliticalMap: { value: showPoliticalMap },
      showCenters: { value: showCenters },
      showColorBox: { value: showColorBox },
      centersRadius: { value: 0.1 }, // Adjusted radius
    }),
    [earthMap, politicalMap]
  );

  useFrame(() => {
    if (meshRef.current) {
        const material = meshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.showPoliticalMap.value = showPoliticalMap;
        material.uniforms.showCenters.value = showCenters;
        material.uniforms.showColorBox.value = showColorBox;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {showAxis && (
        <axesHelper args={[1.5]} />
      )}
    </group>
  );
};