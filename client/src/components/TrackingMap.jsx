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
            <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={riderPosition || dropoffLoc} zoom={15} options={MAP_OPTIONS}>
                {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, preserveViewport: false, polylineOptions: { strokeColor: "#94a3b8", strokeWeight: 6, strokeOpacity: 0.5 } }} />}
                <Marker position={pickupLoc} icon={{ url: assets.shop, scaledSize: new google.maps.Size(40, 40) }} />
                <Marker position={dropoffLoc} icon={{ url: assets.home, scaledSize: new google.maps.Size(40, 40) }} />
                <Marker position={riderPosition || pickupLoc} icon={{ url: assets.rider, scaledSize: new google.maps.Size(50, 50), anchor: new google.maps.Point(25, 25) }} zIndex={100} />
            </GoogleMap>

            {/* 🟢 LIGHT FLOATING STATUS HUD */}
            <div className="absolute top-6 left-6 right-20 z-10 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                                    {isDelivery ? <Navigation size={24}/> : <Package size={24}/>}
                                </div>
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span></span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isPickup ? 'VALET DISPATCHED' : 'OUT FOR DELIVERY'}</p>
                                <h3 className="font-black text-gray-800 text-lg leading-tight mt-0.5">{isPickup ? 'Valet heading to store' : 'Arriving at your location'}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-green-500 transition-all ease-linear shadow-[0_0_10px_rgba(34,197,94,0.4)]" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* 🟢 LIGHT RIDER INFO & OTP BOTTOM SHEET */}
            {assignedRider && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl z-20 rounded-t-[2.5rem] border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
                    <div className="w-full h-8 flex items-center justify-center"><div className="w-16 h-1.5 bg-gray-200 rounded-full"></div></div>
                    
                    <div className="px-6 pb-8 pt-2">
                        {/* Rider Profile Row */}
                        <div className="flex items-center gap-4">
                            <img src={assignedRider.profileImage || "https://cdn-icons-png.flaticon.com/512/4825/4825038.png"} alt="Rider" className="w-14 h-14 rounded-full border-2 border-green-100 p-0.5 object-cover shadow-sm bg-gray-50" />
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">YOUR VALET</p>
                                <h4 className="font-black text-gray-800 text-lg tracking-wide leading-none">{assignedRider.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 font-bold mt-1.5">
                                    <ShieldCheck size={14} className="text-green-500"/>
                                    <span>{assignedRider.vehicleNumber || 'Verified Identity'}</span>
                                </div>
                            </div>
                            {assignedRider.phone && (
                                <a href={`tel:${assignedRider.phone}`} className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors shadow-sm active:scale-95 pointer-events-auto">
                                    <Phone size={20} />
                                </a>
                            )}
                        </div>

                        {/* CUSTOMER DELIVERY OTP DISPLAY */}
                        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-500 border border-gray-200 shadow-sm">
                                    <Key size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery PIN</p>
                                    <p className="text-xs text-gray-600 mt-0.5 font-bold">Share with valet at doorstep</p>
                                </div>
                            </div>
                            <div className="bg-green-50 border border-green-200 px-5 py-2.5 rounded-xl text-2xl font-black text-green-700 tracking-[0.2em] shadow-inner">
                                {order.otp || "----"}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackingMap;