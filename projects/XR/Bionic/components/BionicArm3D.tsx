import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { Outlines } from '@react-three/drei';
import { ArmState } from '../types';
import { audioService } from '../services/audioService';

// Materials
const carbonMaterial = { color: '#374151', roughness: 0.3, metalness: 0.7 };
const jointMaterial = { color: '#8b5cf6', roughness: 0.2, metalness: 0.8 };
const servoMaterial = { color: '#dc2626', roughness: 0.4, metalness: 0.6 };
const batteryMaterial = { color: '#f59e0b', roughness: 0.3, metalness: 0.5 };
const highlightMaterial = { color: '#14b8a6', emissive: '#14b8a6', emissiveIntensity: 0.5, toneMapped: false };

interface BionicArmProps {
  armState: ArmState;
  isXray: boolean;
  onPartHover: (partId: string | null) => void;
  onPartSelect: (partId: string) => void;
}

const BionicArm3D: React.FC<BionicArmProps> = ({ armState, isXray, onPartHover, onPartSelect }) => {
  const shoulderRef = useRef<Group>(null);
  const elbowRef = useRef<Group>(null);
  const wristRef = useRef<Group>(null);
  const gripGroupRef = useRef<Group>(null);
  
  // Ref to track current grip value for smooth interpolation
  const currentGripStrength = useRef(0);

  // Refs to store previous frame rotations for velocity calculation
  const prevRotations = useRef({
    shoulder: 0,
    elbow: 0,
    wrist: 0,
    grip: 0
  });

  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Smooth animation of joints & Sound Logic
  useFrame((state, delta) => {
    let totalVelocity = 0;

    // Shoulder
    if (shoulderRef.current) {
      const target = MathUtils.degToRad(armState.shoulderAngle);
      shoulderRef.current.rotation.x = MathUtils.lerp(shoulderRef.current.rotation.x, target, 0.1);
      
      const diff = Math.abs(shoulderRef.current.rotation.x - prevRotations.current.shoulder);
      totalVelocity += diff;
      prevRotations.current.shoulder = shoulderRef.current.rotation.x;
    }

    // Elbow
    if (elbowRef.current) {
      const target = MathUtils.degToRad(armState.elbowAngle);
      elbowRef.current.rotation.x = MathUtils.lerp(elbowRef.current.rotation.x, target, 0.1);
      
      const diff = Math.abs(elbowRef.current.rotation.x - prevRotations.current.elbow);
      totalVelocity += diff;
      prevRotations.current.elbow = elbowRef.current.rotation.x;
    }

    // Wrist
    if (wristRef.current) {
      const target = MathUtils.degToRad(armState.wristAngle);
      wristRef.current.rotation.y = MathUtils.lerp(wristRef.current.rotation.y, target, 0.1);
      
      const diff = Math.abs(wristRef.current.rotation.y - prevRotations.current.wrist);
      totalVelocity += diff;
      prevRotations.current.wrist = wristRef.current.rotation.y;
    }

    // Grip (Updated to use Lerp for smoothness)
    if (gripGroupRef.current) {
        // Interpolate grip strength value first
        currentGripStrength.current = MathUtils.lerp(currentGripStrength.current, armState.gripStrength, 0.1);
        
        // Calculate velocity based on strength change
        const gripDiff = Math.abs(currentGripStrength.current - prevRotations.current.grip);
        // Grip moves small distances but has many parts, so we weight it up slightly for sound
        totalVelocity += gripDiff * 0.05; 
        prevRotations.current.grip = currentGripStrength.current;

        // Apply rotation to fingers
        const curlAngle = MathUtils.lerp(0, Math.PI / 2, currentGripStrength.current / 100);
        gripGroupRef.current.children.forEach((child) => {
            child.rotation.x = -curlAngle;
        });
    }

    // Normalize velocity for audio engine (Scaling factor tuned for feel)
    // Typical per-frame movement is small radians, so we multiply to get 0-1 range
    audioService.updateServo(totalVelocity * 30);
  });

  const handlePointerOver = (e: any, partId: string) => {
    e.stopPropagation();
    setHoveredPart(partId);
    onPartHover(partId);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredPart(null);
    onPartHover(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any, partId: string) => {
    e.stopPropagation();
    onPartSelect(partId);
  };

  const materialProps = isXray ? { transparent: true, opacity: 0.3 } : {};
  const innerProps = isXray ? { transparent: true, opacity: 0.8 } : {};

  const Outline = () => <Outlines thickness={2} color="#14b8a6" screenspace opacity={1} transparent={false} angle={0} />;

  return (
    <group position={[0, -2, 0]} scale={[0.8, 0.8, 0.8]}>
      {/* Base / Shoulder */}
      <group>
        <mesh 
            position={[0, 0, 0]} 
            castShadow receiveShadow
            onPointerOver={(e) => handlePointerOver(e, 'base')}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, 'base')}
        >
            <cylinderGeometry args={[1, 1.2, 1.5, 32]} />
            <meshStandardMaterial {...carbonMaterial} {...materialProps} />
            {hoveredPart === 'base' && <Outline />}
        </mesh>
        
        {/* Shoulder Joint Sphere */}
        <mesh 
            position={[0, 1, 0]}
            onPointerOver={(e) => handlePointerOver(e, 'shoulder')}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, 'shoulder')}
        >
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial {...jointMaterial} {...innerProps} />
            {hoveredPart === 'shoulder' && <Outline />}
        </mesh>

        {/* Rotatable Shoulder Group */}
        <group ref={shoulderRef} position={[0, 1, 0]}>
             {/* Upper Arm */}
            <mesh 
                position={[0, 1.5, 0]} castShadow
                onPointerOver={(e) => handlePointerOver(e, 'upperArm')}
                onPointerOut={handlePointerOut}
                onClick={(e) => handleClick(e, 'upperArm')}
            >
                <boxGeometry args={[0.8, 3, 0.8]} />
                <meshStandardMaterial {...carbonMaterial} {...materialProps} />
                {hoveredPart === 'upperArm' && <Outline />}
            </mesh>
            {/* Upper Arm Detail (Servo) */}
            <mesh 
                position={[0, 1, 0.5]}
                onPointerOver={(e) => handlePointerOver(e, 'shoulderServo')}
                onPointerOut={handlePointerOut}
                onClick={(e) => handleClick(e, 'shoulderServo')}
            >
                <boxGeometry args={[0.6, 1, 0.4]} />
                <meshStandardMaterial {...servoMaterial} {...innerProps} />
                {hoveredPart === 'shoulderServo' && <Outline />}
            </mesh>
            
            {/* Elbow Joint */}
            <mesh 
                position={[0, 3, 0]}
                onPointerOver={(e) => handlePointerOver(e, 'elbow')}
                onPointerOut={handlePointerOut}
                onClick={(e) => handleClick(e, 'elbow')}
            >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial {...jointMaterial} {...innerProps} />
                {hoveredPart === 'elbow' && <Outline />}
            </mesh>

            {/* Rotatable Elbow Group */}
            <group ref={elbowRef} position={[0, 3, 0]}>
                {/* Forearm */}
                <mesh 
                    position={[0, 1.5, 0]} castShadow
                    onPointerOver={(e) => handlePointerOver(e, 'forearm')}
                    onPointerOut={handlePointerOut}
                    onClick={(e) => handleClick(e, 'forearm')}
                >
                    <cylinderGeometry args={[0.5, 0.6, 3, 16]} />
                    <meshStandardMaterial {...carbonMaterial} {...materialProps} />
                    {hoveredPart === 'forearm' && <Outline />}
                </mesh>
                 {/* Battery Pack */}
                 <mesh 
                    position={[0, 1.5, -0.4]}
                    onPointerOver={(e) => handlePointerOver(e, 'battery')}
                    onPointerOut={handlePointerOut}
                    onClick={(e) => handleClick(e, 'battery')}
                 >
                    <capsuleGeometry args={[0.2, 1.5, 4, 8]} />
                    <meshStandardMaterial {...batteryMaterial} {...innerProps} />
                    {hoveredPart === 'battery' && <Outline />}
                </mesh>
                {/* Wiring Neon Strip */}
                <mesh position={[0.4, 1.5, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 2.8]} />
                    <meshStandardMaterial {...highlightMaterial} />
                </mesh>

                {/* Wrist Joint */}
                <group position={[0, 3, 0]}>
                     <mesh
                        onPointerOver={(e) => handlePointerOver(e, 'wrist')}
                        onPointerOut={handlePointerOut}
                        onClick={(e) => handleClick(e, 'wrist')}
                     >
                        <sphereGeometry args={[0.5, 32, 32]} />
                        <meshStandardMaterial {...jointMaterial} {...innerProps} />
                        {hoveredPart === 'wrist' && <Outline />}
                    </mesh>

                    {/* Rotatable Wrist Group */}
                    <group ref={wristRef}>
                         {/* Palm */}
                        <mesh 
                            position={[0, 0.6, 0]} castShadow
                            onPointerOver={(e) => handlePointerOver(e, 'hand')}
                            onPointerOut={handlePointerOut}
                            onClick={(e) => handleClick(e, 'hand')}
                        >
                            <boxGeometry args={[1, 1.2, 0.3]} />
                            <meshStandardMaterial {...carbonMaterial} {...materialProps} />
                            {hoveredPart === 'hand' && <Outline />}
                        </mesh>
                        
                        {/* Fingers Group */}
                        <group ref={gripGroupRef} position={[0, 1.2, 0]}>
                             {/* Fingers (Grouped interaction for simplicity) */}
                             {[-0.3, 0, 0.3].map((x, i) => (
                                <group key={i} position={[x, 0, 0]}>
                                    <mesh 
                                        position={[0, 0.4, 0]}
                                        onPointerOver={(e) => handlePointerOver(e, 'hand')}
                                        onPointerOut={handlePointerOut}
                                        onClick={(e) => handleClick(e, 'hand')}
                                    >
                                        <boxGeometry args={[0.15, 0.8, 0.15]} />
                                        <meshStandardMaterial {...carbonMaterial} {...materialProps} />
                                        {hoveredPart === 'hand' && <Outline />}
                                    </mesh>
                                </group>
                             ))}
                             {/* Thumb */}
                             <group position={[0.4, -0.4, 0.2]} rotation={[0, 0, -0.5]}>
                                <mesh 
                                    position={[0, 0.3, 0]}
                                    onPointerOver={(e) => handlePointerOver(e, 'hand')}
                                    onPointerOut={handlePointerOut}
                                    onClick={(e) => handleClick(e, 'hand')}
                                >
                                    <boxGeometry args={[0.15, 0.6, 0.15]} />
                                    <meshStandardMaterial {...carbonMaterial} {...materialProps} />
                                    {hoveredPart === 'hand' && <Outline />}
                                </mesh>
                             </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
      </group>
    </group>
  );
};

export default BionicArm3D;
