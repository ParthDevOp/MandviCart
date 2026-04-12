import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, Polyline } from '@react-google-maps/api';
import { Package, Navigation, CheckCircle, Phone, ShieldCheck, Cpu, Key, Truck } from 'lucide-react';
import { assets } from '../assets/assets'; 
import { useAppContext } from '../context/AppContext';
import { io } from 'socket.io-client';

const ANIMATION_DURATION = 60000; 

// 🟢 FRESH GREENCART MAP STYLES
const MAP_OPTIONS = {
    disableDefaultUI: true, zoomControl: false,
    styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", stylers: [{ color: "#e0f2fe" }] },
        { featureType: "landscape.man_made", stylers: [{ color: "#f8fafc" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
    ]
};

const getInterpolatedPosition = (path, progressPercent) => {
    if (!path || path.length === 0) return null;
    if (progressPercent >= 100) return { lat: path[path.length - 1].lat(), lng: path[path.length - 1].lng() };
    if (progressPercent <= 0) return { lat: path[0].lat(), lng: path[0].lng() };
    const floatIndex = (progressPercent / 100) * (path.length - 1);
    const lowerIndex = Math.floor(floatIndex);
    const upperIndex = Math.ceil(floatIndex);
    const t = floatIndex - lowerIndex; 
    const p1 = path[lowerIndex];
    const p2 = path[upperIndex];
    return { lat: p1.lat() + (p2.lat() - p1.lat()) * t, lng: p1.lng() + (p2.lng() - p1.lng()) * t };
};

// Calculate split arrays for the traveled (gray) vs upcoming (green) routes
const getSplitPaths = (pathPoints, progressPercent, currentPos) => {
    if (!pathPoints || pathPoints.length === 0) return { past: [], future: [] };
    if (progressPercent >= 100) return { past: pathPoints, future: [] };
    if (progressPercent <= 0) return { past: [], future: pathPoints };
    
    const floatIndex = (progressPercent / 100) * (pathPoints.length - 1);
    const lowerIndex = Math.floor(floatIndex);
    
    const exactPos = currentPos && window.google ? new window.google.maps.LatLng(currentPos.lat, currentPos.lng) : pathPoints[lowerIndex];

    const past = [...pathPoints.slice(0, lowerIndex + 1), exactPos];
    const future = [exactPos, ...pathPoints.slice(lowerIndex + 1)];
    return { past, future };
};

const TrackingMap = ({ order }) => {
    const { backendUrl } = useAppContext();
    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY });

    const pickupLoc = order?.pickupCoordinates?.lat ? order.pickupCoordinates : { lat: 21.2580, lng: 73.3060 };
    const dropoffLoc = order?.dropoffCoordinates?.lat ? order.dropoffCoordinates : { lat: 21.2556, lng: 73.3047 };

    const isPreparing = order?.status === 'Order Placed' || order?.status === 'Packing';
    const isPickup = order?.status === 'Ready for Pickup';
    const isDelivery = order?.status === 'Out for Delivery';
    const isDelivered = order?.status === 'Delivered';

    const assignedRider = order?.riderId || null;

    const [directions, setDirections] = useState(null);
    const [pathPoints, setPathPoints] = useState([]);
    const [progress, setProgress] = useState(0);
    const [riderPosition, setRiderPosition] = useState(pickupLoc);
    const [routeMeta, setRouteMeta] = useState({ distance: '', duration: '' });
    const socketRef = useRef(null);

    // Sockets
    useEffect(() => {
        if (!order?._id) return;
        socketRef.current = io(backendUrl);
        socketRef.current.emit("join_order", order._id);
        
        socketRef.current.on("live_location", (data) => {
            setRiderPosition({ lat: data.lat, lng: data.lng });
            if (data.progress) setProgress(data.progress);
        });

        return () => socketRef.current && socketRef.current.disconnect();
    }, [order?._id, backendUrl]);

    // Draw Route
    useEffect(() => {
        if (isLoaded && (isPickup || isDelivery)) {
            const directionsService = new google.maps.DirectionsService();
            const origin = isPickup ? { lat: pickupLoc.lat + 0.01, lng: pickupLoc.lng + 0.01 } : pickupLoc;
            const destination = isPickup ? pickupLoc : dropoffLoc;

            directionsService.route({
                origin, destination, travelMode: google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    setPathPoints(result.routes[0].overview_path);
                    const leg = result.routes[0].legs[0];
                    if (leg) {
                        setRouteMeta({ distance: leg.distance.text, duration: leg.duration.text });
                    }
                }
            });
        }
    }, [isLoaded, order?.status]); 

    // Math Tracker
    useEffect(() => {
        if (pathPoints.length === 0 || (!isDelivery && !isPickup)) return;
        
        const dbStartTime = isPickup ? order.acceptedAt : order.pickedUpAt;
        const safeStartTime = dbStartTime || Date.now(); 

        let animationFrameId;

        const animate = () => {
            const elapsed = Date.now() - safeStartTime; 
            const pct = Math.max(0, Math.min(elapsed / ANIMATION_DURATION, 1));
            
            setProgress(pct * 100);
            const currentPos = getInterpolatedPosition(pathPoints, pct * 100);
            if (currentPos) setRiderPosition(currentPos);

            if (pct < 1) animationFrameId = requestAnimationFrame(animate);
        };
        
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [pathPoints, order?.status, isDelivery, isPickup, order.acceptedAt, order.pickedUpAt]);


    // 🟢 FRESH LOADING SCREEN
    if (!isLoaded) return (
        <div className="h-full w-full bg-white flex flex-col items-center justify-center font-outfit text-green-600 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-green-100">
                <Truck size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-wide">Connecting GPS...</h2>
            <p className="text-gray-400 font-medium mt-2">Locating your valet</p>
        </div>
    );

    // 🟢 FRESH PREPARING / DELIVERED SCREEN
    if (isPreparing || isDelivered) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-8 font-outfit border border-gray-200 rounded-3xl shadow-inner">
                <div className="w-24 h-24 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-200/50">
                    {isDelivered ? <CheckCircle size={40} className="text-green-500" /> : <Package size={40} className="text-gray-400 animate-pulse" />}
                </div>
                <h2 className="text-2xl font-black text-gray-800">{isDelivered ? "Delivery Complete" : "Preparing Package"}</h2>
                <p className="text-gray-500 mt-2 font-medium text-sm tracking-widest uppercase">{isDelivered ? "Successfully Delivered" : "Awaiting Courier Assignment"}</p>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full font-outfit rounded-3xl overflow-hidden border border-gray-200 shadow-lg bg-gray-50">
            {/* Map stays locked onto the Rider's active coordinates continuously */}
            <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={riderPosition || dropoffLoc} zoom={16} options={MAP_OPTIONS}>
                
                {/* Suppress the single-color route */}
                {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, preserveViewport: true, polylineOptions: { strokeOpacity: 0 } }} />}
                
                {/* Draw Dynamic Split Route */}
                {directions && pathPoints.length > 0 && (
                    <>
                        <Polyline path={getSplitPaths(pathPoints, progress, riderPosition).past} options={{ strokeColor: "#94a3b8", strokeWeight: 6, strokeOpacity: 0.6 }} />
                        <Polyline path={getSplitPaths(pathPoints, progress, riderPosition).future} options={{ strokeColor: "#10b981", strokeWeight: 7, strokeOpacity: 0.9 }} />
                    </>
                )}

                <Marker position={pickupLoc} icon={{ url: assets.shop, scaledSize: new google.maps.Size(40, 40) }} />
                <Marker position={dropoffLoc} icon={{ url: assets.home, scaledSize: new google.maps.Size(40, 40) }} />
                <Marker position={riderPosition || pickupLoc} icon={{ url: assets.rider, scaledSize: new google.maps.Size(50, 50), anchor: new google.maps.Point(25, 25) }} zIndex={100} />
            </GoogleMap>

            {/* 🟢 PREMIUM GLASS HUD */}
            <div className="absolute top-6 left-6 right-6 md:right-auto md:w-96 z-10 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-2xl p-5 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-white/50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-100 to-green-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                                    {isDelivery ? <Navigation size={26}/> : <Package size={26}/>}
                                </div>
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span></span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isPickup ? 'VALET DISPATCHED' : 'OUT FOR DELIVERY'}</p>
                                <h3 className="font-black text-slate-800 text-[22px] leading-tight mt-0.5">
                                    {isPickup ? 'Heading to store' : routeMeta.duration ? `Arriving in ${routeMeta.duration}` : 'Arriving...'}
                                </h3>
                                {routeMeta.distance && <p className="text-[11px] font-bold text-slate-500 mt-1">{routeMeta.distance} away from your coordinates.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🟢 PREMIUM RIDER BOTTOM SHEET */}
            {assignedRider && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-3xl z-20 rounded-t-[3rem] border-t border-white shadow-[0_-20px_50px_rgba(0,0,0,0.06)] pb-4">
                    <div className="w-full h-8 flex items-center justify-center"><div className="w-12 h-1.5 bg-slate-200 rounded-full"></div></div>
                    
                    <div className="px-6 pb-6 pt-1">
                        {/* Rider Profile Row */}
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <img src={assignedRider.profileImage || "https://cdn-icons-png.flaticon.com/512/4825/4825038.png"} alt="Rider" className="w-16 h-16 rounded-full border-[3px] border-white object-cover shadow-[0_8px_20px_rgba(16,185,129,0.2)] bg-slate-100 z-10 relative" />
                                <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <ShieldCheck size={12}/> Verified Courier
                                </p>
                                <h4 className="font-black text-slate-800 text-xl tracking-tight leading-none">{assignedRider.name}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-2 bg-slate-100 px-2.5 py-1 rounded-md w-max">
                                    <span>{assignedRider.vehicleNumber || 'Electric Vehicle'}</span>
                                </div>
                            </div>
                            {assignedRider.phone && (
                                <a href={`tel:${assignedRider.phone}`} className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95 pointer-events-auto">
                                    <Phone size={22} fill="currentColor" />
                                </a>
                            )}
                        </div>

                        {/* CUSTOMER DELIVERY OTP DISPLAY */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl text-slate-500 border border-slate-200 shadow-inner">
                                    <Key size={22} className="text-slate-700" />
                                </div>
                                <div className="flex flex-col justify-center h-full pt-0.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security PIN</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-bold">Share explicitly upon package handoff</p>
                                </div>
                            </div>
                            <div className="bg-slate-900 px-6 py-3 rounded-[1.25rem] text-2xl font-black text-emerald-400 tracking-[0.3em] shadow-[0_10px_30px_rgba(15,23,42,0.2)] border border-slate-800">
                                {order.otp || "- - - -"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackingMap;