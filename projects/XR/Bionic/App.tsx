import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import BionicArm3D from './components/BionicArm3D';
import AIModal from './components/AIModal';
import { ArmState, QuizQuestion, GameMission } from './types';
import { audioService } from './services/audioService';

// Component Data Dictionary
const COMPONENT_DATA: Record<string, { title: string; specs: string; desc: string }> = {
  base: { 
    title: "Base Mount", 
    specs: "Titanium Alloy • 4-Point Fixation", 
    desc: "Provides structural stability and interfaces with the user's residual limb socket." 
  },
  shoulder: { 
    title: "Shoulder Joint", 
    specs: "3-DOF Spherical • 12Nm Torque", 
    desc: "The main rotator cuff assembly providing multi-directional movement capabilities." 
  },
  upperArm: { 
    title: "Upper Arm Chassis", 
    specs: "Carbon Fiber Reinforced Polymer", 
    desc: "Lightweight, durable housing protecting internal cabling and servo motors." 
  },
  shoulderServo: { 
    title: "Shoulder Actuator", 
    specs: "High-Torque Digital Servo • 20kg/cm", 
    desc: "Primary drive unit for lifting and heavy load manipulation." 
  },
  elbow: { 
    title: "Elbow Joint", 
    specs: "Hinge Mechanism • 0-135° ROM", 
    desc: "Allows for flexion and extension with integrated position encoding." 
  },
  forearm: { 
    title: "Forearm Unit", 
    specs: "Neural Processing Core Inside", 
    desc: "Houses the main logic board, signal processors, and haptic feedback drivers." 
  },
  battery: { 
    title: "Power Cell", 
    specs: "Li-Ion 5000mAh • 14.8V", 
    desc: "High-capacity swappable battery pack ensuring 8 hours of continuous operation." 
  },
  wrist: { 
    title: "Wrist Rotator", 
    specs: "Micro-Precision Servo • 360°", 
    desc: "Enables fine manipulation and rotational positioning of the hand." 
  },
  hand: { 
    title: "Myoelectric Hand", 
    specs: "5-Finger Independent • 20kg Grip", 
    desc: "Advanced anthropomorphic manipulator with tactile pressure sensors." 
  }
};

// Quiz Data
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Which component is primarily responsible for creating torque in the joint?",
    options: ["Capacitor", "Servo Actuator", "Resistor", "Carbon Chassis"],
    correct: 1,
    category: "Technical"
  },
  {
    id: 2,
    question: "Complete the sentence: 'The sensor ___ electrical signals from the muscle.'",
    options: ["detects", "detecting", "detect", "detection"],
    correct: 0,
    category: "Language"
  },
  {
    id: 3,
    question: "What is the primary function of the 'DOF' specification?",
    options: ["To measure battery life", "To indicate Degrees of Freedom", "To calculate weight", "To control heat"],
    correct: 1,
    category: "Technical"
  },
  {
    id: 4,
    question: "Which preposition is correct? 'The battery is mounted ___ the forearm.'",
    options: ["at", "of", "inside", "for"],
    correct: 2,
    category: "Language"
  },
  {
    id: 5,
    question: "If the 'Torque' metric is high, it means the arm is applying more:",
    options: ["Speed", "Rotational Force", "Voltage", "Data"],
    correct: 1,
    category: "Technical"
  }
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isXray, setIsXray] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Interaction State
  const [activePartId, setActivePartId] = useState<string | null>(null);
  
  // Quiz & Game State
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [currentMission, setCurrentMission] = useState<GameMission | null>(null);
  const [missionMessage, setMissionMessage] = useState<string>("");

  // Arm State
  const [armState, setArmState] = useState<ArmState>({
    shoulderAngle: 0,
    elbowAngle: 0,
    wristAngle: 0,
    gripStrength: 0,
  });

  // Metrics (Simulated)
  const [metrics, setMetrics] = useState({
    torque: 0,
    power: 0,
    battery: 92,
    signal: 78
  });

  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Audio on first interaction
  useEffect(() => {
    const initAudio = () => {
      audioService.init();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Recalculate metrics when arm moves
  useEffect(() => {
    const shoulderLoad = Math.abs(armState.shoulderAngle) / 90;
    const elbowLoad = armState.elbowAngle / 135;
    const gripLoad = armState.gripStrength / 100;
    
    setMetrics({
        torque: +(8.2 + shoulderLoad * 4 + elbowLoad * 2).toFixed(1),
        power: Math.round(24 + shoulderLoad * 8 + elbowLoad * 4 + gripLoad * 6),
        battery: Math.max(0, Math.floor(92 - (Date.now() % 1000) / 100)), // dummy drain
        signal: Math.min(100, Math.round(78 + Math.random() * 10))
    });
  }, [armState]);

  // Game Logic Loop
  useEffect(() => {
    if (!gameActive || !currentMission) return;

    const { target, tolerance } = currentMission;
    let aligned = true;

    if (target.shoulderAngle !== undefined && Math.abs(armState.shoulderAngle - target.shoulderAngle) > tolerance) aligned = false;
    if (target.elbowAngle !== undefined && Math.abs(armState.elbowAngle - target.elbowAngle) > tolerance) aligned = false;
    if (target.wristAngle !== undefined && Math.abs(armState.wristAngle - target.wristAngle) > tolerance) aligned = false;
    if (target.gripStrength !== undefined && Math.abs(armState.gripStrength - target.gripStrength) > tolerance) aligned = false;

    if (aligned) {
      completeMission();
    }
  }, [armState, gameActive, currentMission]);

  const handleSliderChange = (key: keyof ArmState, value: number) => {
    setArmState(prev => ({ ...prev, [key]: value }));
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Try to select a female voice (heuristic based on common voice names)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        (v.name.includes('Google US English') || 
         v.name.includes('Zira') || 
         v.name.includes('Samantha') || 
         v.name.includes('Female')) && v.lang.includes('en')
      ) || voices.find(v => v.lang.includes('en'));

      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const addXP = (amount: number) => {
    const newXP = xp + amount;
    if (newXP >= 100) {
      setLevel(l => l + 1);
      setXp(newXP - 100);
      speak("Level up! Systems upgraded.");
    } else {
      setXp(newXP);
    }
  };

  const startMission = () => {
    setGameActive(true);
    setQuizOpen(false);
    
    // Generate Random Mission
    const shoulderTgt = Math.floor(Math.random() * 60) - 30; // -30 to 30
    const elbowTgt = Math.floor(Math.random() * 90);
    
    const mission: GameMission = {
      description: `Calibration Required: Set Shoulder to ${shoulderTgt}° and Elbow to ${elbowTgt}°`,
      target: { shoulderAngle: shoulderTgt, elbowAngle: elbowTgt },
      tolerance: 5,
      points: 50
    };
    
    setCurrentMission(mission);
    setMissionMessage(mission.description);
    speak("New calibration mission received. Adjust parameters to match targets.");
  };

  const completeMission = () => {
    if (!currentMission) return;
    speak("Calibration successful. Efficiency increased.");
    addXP(currentMission.points);
    setGameActive(false);
    setCurrentMission(null);
    setMissionMessage("Calibration Complete! Standing by for next task.");
    setTimeout(() => setMissionMessage(""), 3000);
  };

  const handleQuizAnswer = (optionIndex: number) => {
    const question = QUIZ_QUESTIONS[currentQuizIndex];
    if (optionIndex === question.correct) {
      speak("Correct. Database updated.");
      addXP(20);
    } else {
      speak("Incorrect. Please review specifications.");
    }
    
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setTimeout(() => {
        speak("Module complete.");
        setQuizOpen(false);
        setCurrentQuizIndex(0);
      }, 1000);
    }
  };

  const handlePartHover = (partId: string | null) => {
    setActivePartId(partId);
  };

  const handlePartSelect = (partId: string) => {
    setActivePartId(partId);
    audioService.playClick();
    if (COMPONENT_DATA[partId]) {
        const { title, desc } = COMPONENT_DATA[partId];
        speak(`${title}. ${desc}`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0b1120] flex flex-col items-center justify-center z-50">
        <div className="w-20 h-20 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
        <h2 className="mt-8 text-teal-500 tracking-[0.2em] font-bold text-xl">INITIALIZING LAB</h2>
        <div className="mt-4 w-48 h-1 bg-gray-800 rounded overflow-hidden">
            <div className="h-full bg-teal-500 animate-[pulse_1s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#0b1120]" ref={appRef}>
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 1, 6]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 15, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#14b8a6" />
            
            <Suspense fallback={null}>
                <Environment preset="city" />
                <BionicArm3D 
                  armState={armState} 
                  isXray={isXray} 
                  onPartHover={handlePartHover}
                  onPartSelect={handlePartSelect}
                />
                <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
            </Suspense>
            
            <OrbitControls minDistance={3} maxDistance={10} target={[0, 0, 0]} />
        </Canvas>
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
            {/* Left: Branding & Level */}
            <div className="flex gap-4">
              <div className="bg-[#101828]/90 backdrop-blur-md border border-teal-500/30 rounded-lg p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
                  <div>
                      <h1 className="text-lg font-bold text-teal-400 tracking-wider">BIONIC ARM LAB</h1>
                      <div className="text-xs text-gray-400 font-code tracking-widest">SYSTEM ONLINE</div>
                  </div>
              </div>

              {/* Gamification Badge */}
              <div className="bg-[#101828]/90 backdrop-blur-md border border-purple-500/30 rounded-lg p-3 flex flex-col justify-center min-w-[140px]">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-purple-400 font-bold">LEVEL {level}</span>
                    <span className="text-gray-400">{xp}/100 XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${xp}%` }}
                    ></div>
                  </div>
              </div>
            </div>

            {/* Right: Controls & Toggles */}
            <div className="flex gap-3">
                <button 
                  onClick={startMission}
                  className={`px-4 py-2 rounded-lg font-code text-xs tracking-wider border transition-all ${gameActive ? 'bg-orange-500/20 border-orange-500 text-orange-400 animate-pulse' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                >
                  {gameActive ? 'MISSION ACTIVE' : 'START CALIBRATION'}
                </button>

                <button 
                  onClick={() => setQuizOpen(!quizOpen)}
                  className={`px-4 py-2 rounded-lg font-code text-xs tracking-wider border transition-all ${quizOpen ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                >
                  TRAINING MODULE
                </button>

                <div className="w-px h-10 bg-white/10 mx-1"></div>

                <button 
                    onClick={() => setIsXray(!isXray)}
                    className={`p-3 rounded-full border transition-all ${isXray ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    title="Toggle X-Ray"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </button>
                <button 
                    onClick={() => setShowAIModal(true)}
                    className="p-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white border border-teal-400/50 shadow-[0_0_15px_rgba(20,184,166,0.5)] hover:scale-105 transition-transform"
                    title="Open AI Vision Lab"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </button>
            </div>
        </div>

        {/* Game Active Overlay */}
        {(gameActive || missionMessage) && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none transition-all duration-300 z-20">
             <div className="bg-[#101828]/90 backdrop-blur-xl border border-orange-500 rounded-lg p-4 shadow-[0_0_30px_rgba(249,115,22,0.3)] min-w-[400px] text-center">
                <h3 className="text-orange-400 font-bold text-sm uppercase tracking-wider mb-2 animate-pulse">
                   ⚠ MISSION OBJECTIVE ⚠
                </h3>
                <p className="text-white text-base font-code">
                   {missionMessage}
                </p>
                {gameActive && currentMission && (
                  <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
                     <span>TGT Shoulder: {currentMission.target.shoulderAngle}°</span>
                     <span>TGT Elbow: {currentMission.target.elbowAngle}°</span>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Dynamic Info Toast (only if game not active to avoid clutter) */}
        {!gameActive && activePartId && COMPONENT_DATA[activePartId] && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none transition-all duration-300">
                <div className="bg-[#101828]/80 backdrop-blur-xl border-t-2 border-teal-500 rounded-lg p-4 shadow-[0_0_30px_rgba(20,184,166,0.3)] min-w-[300px] text-center">
                    <h3 className="text-teal-400 font-bold text-lg uppercase tracking-wider mb-1">
                        {COMPONENT_DATA[activePartId].title}
                    </h3>
                    <div className="text-white text-xs font-code bg-white/10 inline-block px-2 py-1 rounded mb-2">
                        {COMPONENT_DATA[activePartId].specs}
                    </div>
                    <p className="text-gray-300 text-sm">
                        {COMPONENT_DATA[activePartId].desc}
                    </p>
                </div>
            </div>
        )}

        {/* Right Side Panel - Quiz Module */}
        <div className={`absolute top-24 right-6 w-80 pointer-events-auto transition-transform duration-300 transform ${quizOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
            <div className="bg-[#101828]/95 backdrop-blur-md border-r-4 border-teal-500 rounded-l-lg p-6 shadow-2xl h-auto max-h-[70vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                    <span className="text-teal-400 font-bold tracking-widest">NEURAL TRAINING</span>
                    <button onClick={() => setQuizOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>

                <div className="mb-4">
                   <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-wider">
                      <span>Question {currentQuizIndex + 1}/{QUIZ_QUESTIONS.length}</span>
                      <span className={QUIZ_QUESTIONS[currentQuizIndex].category === 'Technical' ? 'text-blue-400' : 'text-green-400'}>
                        {QUIZ_QUESTIONS[currentQuizIndex].category}
                      </span>
                   </div>
                   <h3 className="text-white font-medium mb-4 min-h-[60px]">
                      {QUIZ_QUESTIONS[currentQuizIndex].question}
                   </h3>
                   
                   <div className="space-y-2">
                      {QUIZ_QUESTIONS[currentQuizIndex].options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          className="w-full text-left p-3 rounded bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500 text-sm text-gray-300 transition-all"
                        >
                          {String.fromCharCode(65 + idx)}. {option}
                        </button>
                      ))}
                   </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-gray-500">
                   Earn XP by completing training modules and calibration tasks.
                </div>
            </div>
        </div>

        {/* Side Panel (Left) - Controls */}
        <div className="absolute top-36 left-6 w-80 pointer-events-auto transition-transform duration-300 transform translate-x-0">
            <div className="bg-[#101828]/90 backdrop-blur-md border-l-4 border-teal-500 rounded-r-lg p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                    <span className="text-teal-400 font-bold tracking-widest">ARM CONTROL</span>
                </div>

                <div className="space-y-6">
                    {/* Shoulder */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Shoulder Flexion</span>
                            <span className="text-teal-400 font-code font-bold">{armState.shoulderAngle}°</span>
                        </div>
                        <input 
                            type="range" min="-90" max="90" step="1"
                            value={armState.shoulderAngle}
                            onChange={(e) => handleSliderChange('shoulderAngle', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400"
                        />
                    </div>

                    {/* Elbow */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Elbow Flexion</span>
                            <span className="text-teal-400 font-code font-bold">{armState.elbowAngle}°</span>
                        </div>
                        <input 
                            type="range" min="0" max="135" step="1"
                            value={armState.elbowAngle}
                            onChange={(e) => handleSliderChange('elbowAngle', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400"
                        />
                    </div>

                    {/* Wrist */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Wrist Rotation</span>
                            <span className="text-teal-400 font-code font-bold">{armState.wristAngle}°</span>
                        </div>
                        <input 
                            type="range" min="-90" max="90" step="1"
                            value={armState.wristAngle}
                            onChange={(e) => handleSliderChange('wristAngle', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400"
                        />
                    </div>

                    {/* Grip */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Grip Strength</span>
                            <span className="text-teal-400 font-code font-bold">{armState.gripStrength}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" step="1"
                            value={armState.gripStrength}
                            onChange={(e) => handleSliderChange('gripStrength', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
                        />
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/10">
                    <div className="bg-black/30 p-2 rounded text-center border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase">Torque</div>
                        <div className="text-orange-500 font-code font-bold text-lg">{metrics.torque} <span className="text-xs">Nm</span></div>
                    </div>
                     <div className="bg-black/30 p-2 rounded text-center border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase">Power</div>
                        <div className="text-purple-500 font-code font-bold text-lg">{metrics.power} <span className="text-xs">W</span></div>
                    </div>
                     <div className="bg-black/30 p-2 rounded text-center border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase">Signal</div>
                        <div className="text-teal-500 font-code font-bold text-lg">{metrics.signal} <span className="text-xs">%</span></div>
                    </div>
                     <div className="bg-black/30 p-2 rounded text-center border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase">Battery</div>
                        <div className="text-blue-500 font-code font-bold text-lg">{metrics.battery} <span className="text-xs">%</span></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 w-full text-center pointer-events-none">
            <div className="inline-block bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <span className="text-gray-400 text-xs">ADVANCED MECHATRONICS LAB V3.0 • GEMINI NANO ENABLED</span>
            </div>
        </div>
      </div>

      <AIModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
        captureRef={appRef}
      />
    </div>
  );
};

export default App;
