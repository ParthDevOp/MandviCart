import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, ShieldCheck, Loader2, ScanFace, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const RiderSelfieModal = ({ isOpen, onClose, onVerify }) => {
    const { user } = useAppContext(); 
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    
    // AI States
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [refDescriptor, setRefDescriptor] = useState(null);
    const [scanResult, setScanResult] = useState(null); 
    const [cameraReady, setCameraReady] = useState(false);
    const [activeScore, setActiveScore] = useState(0);

    const videoConstraints = { width: 720, height: 720, facingMode: "user" };

    useEffect(() => {
        let isMounted = true;
        const loadModelsAndProfile = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                
                // Pre-compute Rider's Official Profile Facial Descriptor
                if (user?.profileImage) {
                    const refImgElement = await faceapi.fetchImage(user.profileImage);
                    const refDetection = await faceapi.detectSingleFace(refImgElement).withFaceLandmarks().withFaceDescriptor();
                    if (refDetection && isMounted) {
                        setRefDescriptor(refDetection.descriptor);
                    } else if (isMounted) {
                        toast.error("Critical: Could not mathematically map the face in your Official Profile Picture!");
                    }
                } else {
                    if(isMounted) toast.error("No official profile picture found for verification!");
                }
                
                if (isMounted) setModelsLoaded(true);
            } catch (error) {
                console.error("Failed to load AI Models", error);
                if (isMounted) toast.error("Failed to initialize Security AI.");
            }
        };
        
        if (isOpen) {
            setScanResult(null);
            setCameraReady(false);
            loadModelsAndProfile();
        }
        return () => { isMounted = false; };
    }, [isOpen, user?.profileImage]);

    // Live Video Feed Recognition Loop
    useEffect(() => {
        let interval;
        if (isOpen && modelsLoaded && refDescriptor && cameraReady) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                    const video = webcamRef.current.video;
                    
                    try {
                        // Run inference
                        const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
                        
                        if (detection) {
                            const distance = faceapi.euclideanDistance(refDescriptor, detection.descriptor);
                            const matchScore = Math.max(0, Math.min(100, Math.round(100 - (distance / 0.55) * 30)));
                            setActiveScore(matchScore);
                            
                            // Draw Live Targeting HUD
                            if (canvasRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
                                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                                faceapi.matchDimensions(canvasRef.current, displaySize);
                                const resizedDetection = faceapi.resizeResults(detection, displaySize);
                                
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                
                                const box = resizedDetection.detection.box;
                                const drawBox = new faceapi.draw.DrawBox(box, { 
                                    label: `${matchScore}% Match`, 
                                    boxColor: distance < 0.50 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                                    drawLabelOptions: { fontColor: '#ffffff', backgroundColor: distance < 0.50 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)' }
                                });
                                drawBox.draw(canvasRef.current);
                            }

                            // 🔥 AUTO VERIFICATION TRIGGER (< 0.50 distance equals strong match)
                            if (distance < 0.50) {
                                clearInterval(interval);
                                const snap = webcamRef.current.getScreenshot();
                                setScanResult({ score: matchScore, success: true, image: snap });
                                
                                // Delay close to let them see success
                                setTimeout(() => {
                                    onVerify({ image: snap, score: matchScore });
                                }, 1500);
                            }
                        } else {
                            setActiveScore(0);
                            // Clear canvas if no face detected
                            if (canvasRef.current) {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            }
                        }
                    } catch (e) {
                         // Safely ignore inference errors during teardown
                    }
                }
            }, 600); // ~1.5 FPS to prevent thermal locking on smartphones while retaining real-time feel
        }
        return () => clearInterval(interval);
    }, [isOpen, modelsLoaded, refDescriptor, cameraReady, onVerify]);

    const handleUserMedia = () => setCameraReady(true);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 font-outfit">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center z-10">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    <ShieldCheck className="text-emerald-600" /> Biometric Sync
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Live Facial Verification Module</p>
                            </div>
                            <button onClick={onClose} disabled={scanResult} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors border border-slate-200">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scanner Viewport */}
                        <div className="p-6 flex flex-col items-center justify-center bg-slate-800 relative h-96 overflow-hidden">
                            
                            {/* Loading State */}
                            {(!modelsLoaded || !refDescriptor) ? (
                                <div className="w-64 h-64 rounded-full flex flex-col items-center justify-center bg-slate-900 shadow-inner text-emerald-500 border-4 border-slate-700 relative z-20">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 text-center px-4">Loading Neural Network...</p>
                                </div>
                            ) : (
                                <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl bg-black flex items-center justify-center z-20">
                                    
                                    {/* Scan Success Overlay */}
                                    {scanResult ? (
                                        <div className="absolute inset-0 z-40 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <CheckCircle className="text-white mb-2" size={48} />
                                            <span className="text-white font-black text-2xl tracking-widest">{scanResult.score}%</span>
                                            <span className="text-emerald-100 text-[10px] uppercase font-bold tracking-widest mt-1">Identity Confirmed</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Live Targeting Reticle Layer */}
                                            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center opacity-30">
                                                <Target size={200} className="text-emerald-500 animate-pulse" strokeWidth={1} />
                                            </div>

                                            {/* The Live Video Feed */}
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                onUserMedia={handleUserMedia}
                                                screenshotFormat="image/jpeg"
                                                screenshotQuality={1}
                                                videoConstraints={videoConstraints}
                                                className="absolute inset-0 w-full h-full object-cover z-10"
                                                mirrored={true} 
                                            />
                                            
                                            {/* Transparent Canvas for Drawing the `face-api` bounding boxes */}
                                            <canvas 
                                                ref={canvasRef} 
                                                className="absolute inset-0 w-full h-full object-cover z-20"
                                                style={{ transform: "scaleX(-1)" }} // Mirrors the canvas drawing to match the mirrored webcam
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Background Scanner Glow Effect */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                                <div className="w-full h-[5px] bg-emerald-500 absolute top-0 left-0 animate-[scan_3s_linear_infinite] shadow-[0_0_20px_10px_rgba(16,185,129,0.5)]"></div>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col items-center">
                            {scanResult ? (
                                <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                    Access Granted
                                </p>
                            ) : (
                                <>
                                    <p className="text-slate-400 font-medium text-center text-xs tracking-wide">
                                        Position your face within the frame. The system will continuously scan & auto-verify you.
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-700">
                                        <ScanFace size={14} className={activeScore > 0 ? "text-emerald-500" : "text-slate-500"} /> 
                                        {activeScore === 0 ? "Searching for Face..." : `Confidence: ${activeScore}%`}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RiderSelfieModal;