import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Truck, CheckCircle, XCircle, Clock, RefreshCw, 
    Key, ShoppingBag, X, ChevronRight, Store, MapPin, AlertCircle, Receipt, Download, CreditCard, Banknote 
} from 'lucide-react';

import TrackingMap from '../components/TrackingMap'; 

// 🟢 NEW: Animated Card Component for Active Orders
const AnimatedTrackingCard = ({ order, onTrack }) => {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="animated-tracker-card shadow-xl shadow-emerald-900/5 border border-emerald-100">
            <div className="tracker-time-badge shadow-sm">
                <div className="tracker-clock-icon"></div>
                <span>{currentTime}</span>
            </div>

            <div className="tracker-illustration">
                <div className="tracker-conveyor-belt"></div>
                <div className="tracker-package">
                    <div className="tracker-box">
                        <div className="tracker-box-face tracker-box-top">
                            <div className="tracker-tape"></div>
                            <div className="tracker-tape tracker-tape-horizontal"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="tracker-content">
                <div className="tracker-card-title flex items-center justify-between">
                    Live Tracking 
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase tracking-widest font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        {order.status}
                    </span>
                </div>
                <p className="tracker-card-description">
                    Your order from <strong>MandviCart</strong> is currently in progress. Tap below to open the live GPS map and monitor your delivery.
                </p>
            </div>

            <div className="tracker-footer">
                <button onClick={() => onTrack(order)} className="tracker-view-status-btn">
                    Open Live Map
                </button>
                <div className="tracker-status-message">
                    <div className="tracker-package-icon"></div>
                    <span className="font-medium text-emerald-600">OTP: <span className="font-black text-lg tracking-widest text-slate-800 ml-1">{order.otp || "WAIT"}</span></span>
                </div>
            </div>
        </div>
    );
};

const MyOrders = () => {
    const [myOrders, setMyOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const { currency, axios, user, navigate, setIsMapOpen } = useAppContext(); 

    const fetchMyOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/user');
            if (data.success) {
                setMyOrders(data.orders);
            }
        } catch (error) { console.log(error); }
    };

    const handleTrackLive = (order) => {
        setSelectedOrder(order);
        setIsMapOpen(true); 
    };

    const closeMap = () => {
        setSelectedOrder(null);
        setIsMapOpen(false); 
    };

    const cancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this shipment?")) return;
        try {
            const { data } = await axios.post('/api/order/cancel', { orderId });
            if (data.success) {
                toast.success(data.message);
                fetchMyOrders();
            } else { toast.error(data.message); }
        } catch (error) { toast.error(error.message); }
    };

    const handleReportIssue = async (order) => {
        if (!window.confirm("Do you want to report an issue with this order and request a refund?")) return;
        
        const loadToast = toast.loading("Opening support ticket...");
        try {
            const autoMessage = `Hi, I have an issue with Order #${order._id.slice(-6).toUpperCase()}. The item is faulty/damaged and I would like to request a refund.`;
            const formData = new FormData();
            formData.append('text', autoMessage);
            
            const { data } = await axios.post('/api/chat/send', formData);
            
            if (data.success) {
                toast.success("Support ticket created!", { id: loadToast });
                navigate('/contact'); 
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) {
            toast.error("Failed to connect to support.", { id: loadToast });
        }
    };

    const handleDownloadBill = (order) => {
        const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const deliveryFee = order.amount - subtotal; 
        const orderDate = new Date(order.date || Date.now()).toLocaleString();

        const printWindow = window.open('', '_blank');
        
        const html = `
            <html>
            <head>
                <title>Invoice - Order #${order._id.slice(-6).toUpperCase()}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { font-size: 32px; font-weight: 900; color: #10b981; letter-spacing: -1px; }
                    .invoice-title { text-align: right; }
                    .invoice-title h2 { margin: 0; font-size: 28px; color: #111; letter-spacing: 2px; }
                    .invoice-title p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
                    .details-container { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .details-box { width: 48%; }
                    .details-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                    .details-box p { margin: 4px 0; font-size: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    table th { background: #f4f4f5; text-align: left; padding: 12px; font-size: 14px; color: #555; text-transform: uppercase; border-bottom: 2px solid #ddd; }
                    table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 15px; }
                    .totals-container { width: 100%; display: flex; justify-content: flex-end; }
                    .totals { width: 300px; }
                    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; border-bottom: 1px solid #f4f4f5; }
                    .totals-row.grand-total { font-size: 20px; font-weight: bold; color: #10b981; border-bottom: none; border-top: 2px solid #111; padding-top: 12px; margin-top: 5px; }
                    .footer { margin-top: 50px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header">
                        <div class="logo">MandviCart</div>
                        <div class="invoice-title">
                            <h2>TAX INVOICE</h2>
                            <p>Order ID: #${order._id.toUpperCase()}</p>
                            <p>Date: ${orderDate}</p>
                        </div>
                    </div>
                    
                    <div class="details-container">
                        <div class="details-box">
                            <h3>Billed To</h3>
                            <p><strong>${order.address?.firstName} ${order.address?.lastName}</strong></p>
                            <p>${order.address?.street}</p>
                            <p>${order.address?.city}, ${order.address?.state} - ${order.address?.zipcode}</p>
                            <p>Phone: ${order.address?.phone}</p>
                        </div>
                        <div class="details-box" style="text-align: right;">
                            <h3>Payment Info</h3>
                            <p><strong>Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                            <p><strong>Status:</strong> ${order.payment ? 'Paid' : 'Pending'}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th>Size</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td><strong>${item.product?.name || 'Item'}</strong></td>
                                    <td>${item.size || 'N/A'}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">${currency}${item.price}</td>
                                    <td style="text-align: right;">${currency}${item.price * item.quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals-container">
                        <div class="totals">
                            <div class="totals-row">
                                <span>Subtotal:</span>
                                <span>${currency}${subtotal}</span>
                            </div>
                            <div class="totals-row">
                                <span>Delivery Fee:</span>
                                <span>${currency}${deliveryFee}</span>
                            </div>
                            <div class="totals-row grand-total">
                                <span>Grand Total:</span>
                                <span>${currency}${order.amount}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for shopping with MandviCart!</p>
                        <p>If you have any questions concerning this invoice, contact our support team.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const getStatusColor = (status) => {
        if (status === 'Delivered') return 'text-green-600 bg-green-50 border-green-100';
        if (status === 'Cancelled') return 'text-red-600 bg-red-50 border-red-100';
        if (status === 'Out for Delivery') return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-orange-600 bg-orange-50 border-orange-100';
    };

    const getStatusIcon = (status) => {
        if (status === 'Delivered') return <CheckCircle size={16}/>;
        if (status === 'Cancelled') return <XCircle size={16}/>;
        if (status === 'Out for Delivery') return <Truck size={16}/>;
        return <Clock size={16}/>;
    };

    useEffect(() => {
        if (user) {
            fetchMyOrders();
            const interval = setInterval(fetchMyOrders, 5000); 
            return () => clearInterval(interval);
        }
    }, [user]);

    const groupedOrders = Object.values(myOrders.reduce((acc, order) => {
        const dateKey = order.date; 
        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: order.date,
                totalAmount: 0,
                shipments: [] 
            };
        }
        acc[dateKey].shipments.push(order);
        acc[dateKey].totalAmount += order.amount;
        return acc;
    }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 🟢 Extract Active Orders for the Hero Section
    const activeOrders = myOrders.filter(o => ['Packing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status));

    return (
        <>
        {/* 🟢 INJECTED STYLES FOR THE ANIMATED CARD */}
        <style>{`
            .animated-tracker-card {
                background: white; border-radius: 24px; width: 100%; max-width: 450px;
                padding: 25px; position: relative; overflow: hidden; margin: 0 auto;
            }
            .tracker-time-badge {
                position: absolute; top: 15px; right: 15px; background: #1a1a1a; color: white;
                padding: 6px 10px; border-radius: 50px; display: flex; align-items: center; gap: 6px;
                font-size: 11px; font-weight: 600; z-index: 10;
            }
            .tracker-clock-icon { width: 16px; height: 16px; border: 1.5px solid white; border-radius: 50%; position: relative; }
            .tracker-clock-icon::before {
                content: ""; position: absolute; width: 1.5px; height: 6px; background: white;
                top: 2px; left: 50%; transform: translateX(-50%); transform-origin: bottom; animation: clockHand 2s infinite linear;
            }
            @keyframes clockHand { 0% { transform: translateX(-50%) rotate(0deg); } 100% { transform: translateX(-50%) rotate(360deg); } }
            .tracker-illustration { width: 100%; height: 180px; margin-bottom: 25px; position: relative; display: flex; justify-content: center; align-items: center; }
            .tracker-conveyor-belt { position: absolute; width: 100%; height: 70px; background: #e0e0e0; border-radius: 6px; overflow: hidden; top: 80px; }
            .tracker-conveyor-belt::before {
                content: ""; position: absolute; width: 200%; height: 100%;
                background: repeating-linear-gradient(90deg, transparent, transparent 30px, #d0d0d0 30px, #d0d0d0 35px);
                animation: conveyorMove 3s linear infinite;
            }
            @keyframes conveyorMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .tracker-package { position: relative; width: 100px; height: 100px; animation: packageSlide 4s ease-in-out infinite; z-index: 5; }
            @keyframes packageSlide { 0%, 100% { transform: translateX(-100px); } 50% { transform: translateX(100px); } }
            .tracker-box { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; animation: boxRotate 4s ease-in-out infinite; }
            @keyframes boxRotate { 0%, 100% { transform: rotateY(0deg); } 25% { transform: rotateY(-10deg); } 75% { transform: rotateY(10deg); } }
            .tracker-box-face { position: absolute; width: 100px; height: 100px; background: white; border: 2px solid #ddd; border-radius: 6px; }
            .tracker-box-top { background: linear-gradient(135deg, #fff 0%, #f5f5f5 100%); transform: translateY(-12px); }
            .tracker-tape { position: absolute; width: 30px; height: 100%; background: #10b981; left: 50%; transform: translateX(-50%); opacity: 0.9; }
            .tracker-tape-horizontal { width: 100%; height: 30px; top: 50%; transform: translateY(-50%); left: 0; }
            .tracker-content { position: relative; z-index: 2; transform: translateY(-20px); }
            .tracker-card-title { font-size: 1.25rem; color: #1a1a1a; margin-bottom: 12px; font-weight: 800; }
            .tracker-card-description { font-size: 0.85rem; color: #666; line-height: 1.5; margin-bottom: 25px; }
            .tracker-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; padding-top: 18px; border-top: 1px solid #e8e8e8; }
            .tracker-view-status-btn { background: #1a1a1a; color: white; border: 1.5px solid #1a1a1a; padding: 12px 32px; border-radius: 50px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; width: 100%; }
            .tracker-view-status-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); background: #000; }
            .tracker-status-message { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; width: 100%; justify-content: center; }
            .tracker-package-icon { width: 24px; height: 24px; background: #f5f5f5; border: 1.5px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative; }
            .tracker-package-icon::after { content: ""; width: 12px; height: 2px; background: #ddd; }
            .tracker-package-icon::before { content: ""; width: 2px; height: 12px; background: #ddd; position: absolute; }
        `}</style>

        <div className='mt-20 pb-20 px-4 md:px-16 lg:px-32 bg-gray-50 min-h-screen font-outfit relative z-0'>
            
            {/* MAP MODAL OVERLAY */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[9999] bg-slate-950 w-full h-full flex flex-col animate-fade-in">
                    <button 
                        onClick={closeMap} 
                        className="absolute top-6 left-6 z-[10000] p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg text-white hover:bg-red-500 hover:border-red-500 transition-all"
                    >
                        <X size={24} />
                    </button>
                    <TrackingMap order={selectedOrder} />
                </div>
            )}

            <div className='flex justify-between items-end mb-8 pt-8'>
                <div>
                    <h2 className='text-3xl font-black text-gray-800'>My Orders</h2>
                    <p className='text-gray-500 mt-1'>Track, manage, and download invoices</p>
                </div>
                <button onClick={fetchMyOrders} className='p-2 bg-white rounded-full shadow-sm hover:rotate-180 transition-transform duration-500 border border-gray-100'>
                    <RefreshCw size={20} className="text-gray-600"/>
                </button>
            </div>

            {/* 🟢 ACTIVE DELIVERIES HERO SECTION */}
            {activeOrders.length > 0 && (
                <div className="mb-10 p-6 bg-emerald-50 border border-emerald-100 rounded-[2.5rem]">
                    <h3 className="text-emerald-800 font-black text-xl mb-6 text-center">Active Deliveries</h3>
                    <div className="flex flex-wrap justify-center gap-6">
                        {activeOrders.map(order => (
                            <AnimatedTrackingCard key={order._id} order={order} onTrack={handleTrackLive} />
                        ))}
                    </div>
                </div>
            )}

            {/* 🟢 ORDER HISTORY SECTION */}
            {myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">No orders yet</h3>
                    <button onClick={() => navigate('/products')} className="mt-6 px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2">
                        Start Shopping <ChevronRight size={18}/>
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    <h3 className="text-xl font-bold text-gray-800 ml-2">Order History</h3>
                    {groupedOrders.map((group, groupIndex) => (
                        <div key={groupIndex} className='bg-white rounded-[2.5rem] p-1 shadow-sm border border-gray-200'>
                            
                            <div className="px-8 py-5 flex justify-between items-center bg-gray-50/80 rounded-t-[2.5rem] border-b border-gray-200">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ORDER PLACED</p>
                                    <p className="font-bold text-gray-800">{new Date(group.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">GRAND TOTAL</p>
                                    <p className="text-2xl font-black text-gray-900">{currency}{group.totalAmount}</p>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {group.shipments.map((order, i) => (
                                    <div key={i} className="p-6 md:p-8">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Store size={20} /></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SHIPMENT {i+1}</p>
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mt-1 ${getStatusColor(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        {order.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="font-mono text-xs font-bold text-gray-400">#{order._id.slice(-6).toUpperCase()}</p>
                                        </div>
                                        
                                        {/* Products List */}
                                        <div className="space-y-4 mb-6">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 items-center">
                                                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center">
                                                        <img src={item.product?.image?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt=""/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 text-sm">{item.product?.name || 'Item'}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity} • {item.size}</p>
                                                    </div>
                                                    <p className="font-bold text-gray-800 text-sm">{currency}{(item.price * item.quantity) || (item.product?.offerPrice * item.quantity)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Detailed Order Summary Block */}
                                        <div className="bg-gray-50 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border border-gray-100">
                                            <div>
                                                <p className="font-bold text-gray-800 mb-1">Delivery Address:</p>
                                                <p className="text-gray-600">{order.address?.firstName} {order.address?.lastName}</p>
                                                <p className="text-gray-500 text-xs mt-0.5">{order.address?.street}, {order.address?.city}</p>
                                                <p className="text-gray-500 text-xs">{order.address?.state} - {order.address?.zipcode}</p>
                                            </div>
                                            <div className="md:text-right">
                                                <p className="font-bold text-gray-800 mb-1">Payment Method:</p>
                                                <p className="text-gray-600 inline-flex items-center gap-1 md:justify-end w-full">
                                                    {order.paymentMethod === 'cod' ? <Banknote size={14}/> : <CreditCard size={14}/>} 
                                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                                </p>
                                                <p className="text-xs mt-1 font-medium">
                                                    Status: <span className={order.payment ? "text-green-600" : "text-orange-500"}>{order.payment ? "Paid" : "Pending"}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-dashed border-gray-200">
                                            {/* OTP Display */}
                                            {['Ready for Pickup', 'Out for Delivery', 'Packing'].includes(order.status) ? (
                                                <div className="flex items-center gap-3 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 w-full md:w-auto">
                                                    <Key size={16} className="text-yellow-700"/>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-yellow-700 uppercase mr-2">OTP</span>
                                                        <span className="text-lg font-black text-gray-900 tracking-widest">{order.otp || "...."}</span>
                                                    </div>
                                                </div>
                                            ) : <div></div>}
                                            
                                            <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                                                {/* Live Track Button */}
                                                {['Out for Delivery', 'Ready for Pickup'].includes(order.status) && (
                                                    <button 
                                                        onClick={() => handleTrackLive(order)} 
                                                        className="flex-1 md:flex-none px-5 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 animate-pulse text-sm"
                                                    >
                                                        <MapPin size={16} /> Track Live
                                                    </button>
                                                )}
                                                
                                                {/* Cancel Button */}
                                                {!['Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status) && (
                                                    <button onClick={() => cancelOrder(order._id)} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all text-sm">
                                                        Cancel
                                                    </button>
                                                )}

                                                {/* View Bill / Download Invoice */}
                                                {order.status === 'Delivered' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleDownloadBill(order)} 
                                                            className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                                                        >
                                                            <Download size={16} /> Download Bill
                                                        </button>

                                                        <button 
                                                            onClick={() => handleReportIssue(order)} 
                                                            className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                                                        >
                                                            <AlertCircle size={16} /> Report Issue
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </>
    );
};

export default MyOrders;


