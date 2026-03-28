import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RefreshCcw, CheckCircle, ShieldCheck, Loader2, UserX, Upload, ZoomIn } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const RiderSelfieModal = ({ isOpen, onClose, onVerify }) => {
    const { user } = useAppContext(); 
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null); 
    const [capturedImage, setCapturedImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1); // 🟢 NEW: State for adjusting/zooming image
    
    // AI States
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [scanResult, setScanResult] = useState(null); // 🟢 NEW: Stores the match percentage

    const videoConstraints = { width: 720, height: 720, facingMode: "user" };

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error("Failed to load AI Models", error);
                toast.error("Failed to initialize Security AI.");
            }
        };
        if (isOpen) loadModels();
    }, [isOpen]);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            setImageZoom(1); // Reset zoom
        }
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result); 
                setImageZoom(1); // Reset zoom
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const retake = () => {
        setCapturedImage(null);
        setScanResult(null);
        setImageZoom(1);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
    };

    const submitVerification = async () => {
        if (!user?.profileImage) return toast.error("Update your official profile picture first!");

        setIsVerifying(true);
        const loadToast = toast.loading("Analyzing facial biometric data...");

        try {
            const refImgElement = await faceapi.fetchImage(user.profileImage);
            const capImgElement = await faceapi.fetchImage(capturedImage);

            const refDetection = await faceapi.detectSingleFace(refImgElement).withFaceLandmarks().withFaceDescriptor();
            const capDetection = await faceapi.detectSingleFace(capImgElement).withFaceLandmarks().withFaceDescriptor();

            if (!refDetection) {
                setIsVerifying(false);
                return toast.error("System couldn't detect a face in your Official Profile Picture.", { id: loadToast });
            }
            if (!capDetection) {
                setIsVerifying(false);
                return toast.error("No face detected in the provided image! Please ensure good lighting.", { id: loadToast });
            }

            const distance = faceapi.euclideanDistance(refDetection.descriptor, capDetection.descriptor);
            
            // 🟢 NEW: Human-Friendly Match Percentage Calculation
            // face-api distances usually range from 0.3 (great match) to 0.6+ (no match). 
            // This formula translates it to a beautiful 0-100% score for the UI.
            const matchScore = Math.max(0, Math.min(100, Math.round(100 - (distance / 0.55) * 30)));

            if (distance < 0.55) {
                toast.success("Biometric Match Confirmed!", { id: loadToast });
                setScanResult({ score: matchScore, success: true });
                
                // Show the percentage for 2 seconds, then auto-proceed
                setTimeout(() => {
                    setIsVerifying(false);
                    onVerify({ image: capturedImage, score: matchScore });
                }, 2000);
            } else {
                toast.error("Face does NOT match profile picture! Access Denied.", { id: loadToast });
                setScanResult({ score: matchScore, success: false });
                
                // Show the failure percentage for 3 seconds, then reset
                setTimeout(() => {
                    setIsVerifying(false);
                    retake();
                }, 3000);
            }
        } catch (error) {
            setIsVerifying(false);
            toast.error("Security scan failed. Please try again.", { id: loadToast });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 font-outfit">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    <ShieldCheck className="text-green-600" /> AI Identity Check
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Anti-Proxy Security System</p>
                            </div>
                            <button onClick={onClose} disabled={isVerifying || scanResult} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors border border-slate-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center justify-center bg-slate-100">
                            {!modelsLoaded ? (
                                <div className="w-64 h-64 rounded-full flex flex-col items-center justify-center bg-white shadow-inner text-indigo-500 border-4 border-indigo-100">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading AI Core...</p>
                                </div>
                            ) : (
                                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-200 flex items-center justify-center">
                                    
                                    {!capturedImage ? (
                                        <>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-0">
                                                <Camera size={32} className="mb-2 opacity-50" />
                                                <span className="text-xs font-bold">Camera Unavailable?</span>
                                            </div>
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                screenshotQuality={0.95}
                                                videoConstraints={videoConstraints}
                                                className="w-full h-full object-cover relative z-10"
                                                mirrored={true} 
                                            />
                                        </>
                                    ) : (
                                        <img 
                                            src={capturedImage} 
                                            alt="Captured" 
                                            style={{ transform: `scale(${imageZoom})`, transition: 'transform 0.1s ease-out' }}
                                            className={`w-full h-full object-cover origin-center ${isVerifying && !scanResult ? 'opacity-50 blur-sm' : ''}`} 
                                        />
                                    )}

                                    {/* 🟢 NEW: MATCH PERCENTAGE OVERLAY */}
                                    <AnimatePresence>
                                        {scanResult && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute inset-0 z-30 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center"
                                            >
                                                <div className={`text-5xl font-black ${scanResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {scanResult.score}%
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                                                    Match Score
                                                </div>
                                                {scanResult.success ? (
                                                    <CheckCircle size={24} className="text-emerald-500 mt-3" />
                                                ) : (
                                                    <UserX size={24} className="text-red-500 mt-3" />
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {isVerifying && !scanResult && (
                                        <div className="absolute inset-0 flex items-center justify-center z-20">
                                            <div className="w-16 h-16 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-lg"></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 🟢 NEW: Image Adjustment Zoom Slider */}
                            {capturedImage && !scanResult && !isVerifying && (
                                <div className="mt-6 w-full flex items-center gap-3 px-2">
                                    <ZoomIn size={16} className="text-slate-400" />
                                    <input 
                                        type="range" 
                                        min="1" max="2.5" step="0.05" 
                                        value={imageZoom} 
                                        onChange={(e) => setImageZoom(e.target.value)}
                                        className="w-full accent-indigo-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100">
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />

                            {!capturedImage ? (
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={capture}
                                        disabled={!modelsLoaded}
                                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Camera size={18} /> Capture Face
                                    </button>
                                    
                                    <div className="relative flex items-center py-1">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">OR</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>

                                    <button 
                                        onClick={triggerFileInput}
                                        disabled={!modelsLoaded}
                                        className="w-full py-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Upload size={18} /> Upload Photo
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={retake}
                                        disabled={isVerifying || scanResult}
                                        className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCcw size={18} /> Retake
                                    </button>
                                    <button 
                                        onClick={submitVerification}
                                        disabled={isVerifying || scanResult}
                                        className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isVerifying ? "Scanning..." : "Verify Identity"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RiderSelfieModal;