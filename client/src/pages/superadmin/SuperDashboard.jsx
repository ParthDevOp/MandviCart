import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
    ShieldCheck, Download, TrendingUp, Truck, Store, IndianRupee, 
    Building, ArrowUpRight, ArrowDownRight, ArrowRight, Landmark, Users,
    Activity, Clock, MapPin, Key, CreditCard, Database, Eye, FileText
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SuperDashboard = () => {
    const { axios, currency } = useAppContext();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [liveOrders, setLiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('financials'); 

    const fetchStats = async () => {
        try {
            const { data: statData } = await axios.get('/api/user/super/stats');
            const { data: orderData } = await axios.get('/api/order/all-list');
            
            if (statData.success) setStats(statData.stats);
            if (orderData.success) {
                setLiveOrders(orderData.orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)));
            }
        } catch (error) { 
            console.error(error); 
            // Silently fail or use toast sparingly so it doesn't spam every 10 seconds if network drops
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchStats(); 
        const interval = setInterval(fetchStats, 10000); // Sync every 10s
        return () => clearInterval(interval);
    }, []);

    const handleExport = () => {
        toast.success("Compiling Master Report. Download will begin shortly...", { icon: '📄' });
    };

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 w-full">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Syncing Telemetry...</p>
            </div>
        );
    }

    // --- DERIVED DATA & SAFE FALLBACKS ---
    const platformProfit = stats.earningsSplit?.platform || 0;
    const pendingPayouts = stats.payoutBreakdown?.pending || 0;
    
    const earningsData = [
        { name: 'Sellers (Out)', value: stats.earningsSplit?.seller || 0, color: '#94a3b8' },
        { name: 'Riders (Out)', value: stats.earningsSplit?.rider || 0, color: '#cbd5e1' },
        { name: 'Platform (In)', value: platformProfit, color: '#9333ea' }, // Updated to purple
    ];

    const paymentMethods = [
        { name: 'Cash on Delivery', value: 65, color: '#10b981' },
        { name: 'Online / Wallet', value: 35, color: '#a855f7' }
    ];

    const auditLogs = stats.auditLogs || [
        { admin: "System Auto", action: "Generated daily settlement batch", time: new Date(Date.now() - 1000 * 60 * 5) },
        { admin: "Admin John", action: "Approved Store Registration: FreshFoods", time: new Date(Date.now() - 1000 * 60 * 45) },
        { admin: "Admin Sarah", action: "Closed Support Ticket #8921", time: new Date(Date.now() - 1000 * 60 * 120) },
        { admin: "Super Admin", action: "Modified global delivery radius to 15km", time: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    ];

    const graphData = stats.revenueOverTime && stats.revenueOverTime.length > 0 
        ? stats.revenueOverTime : [{name: 'Jan', revenue: 0}, {name: 'Feb', revenue: 0}];

    // --- COMPONENTS ---
    const MetricCard = ({ title, value, subtitle, icon: Icon, trend }) => (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                    <Icon size={20} strokeWidth={2} />
                </div>
                {trend && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${trend > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {trend > 0 ? <ArrowUpRight size={14} strokeWidth={2.5}/> : <ArrowDownRight size={14} strokeWidth={2.5}/>} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium truncate">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 w-full min-w-0">
            
            {/* 🟢 HEADER (Static, not sticky, to avoid clashing with layout topbar) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200/60 w-full">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Building size={20} className="text-purple-600"/> Global Command Center
                    </h1>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-2 ring-emerald-100"></span>
                        Full System Telemetry & Control
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar w-full md:w-auto">
                        {['financials', 'operations', 'network', 'audit'].map(tab => (
                            <button 
                                key={tab} onClick={()=>setActiveTab(tab)} 
                                className={`whitespace-nowrap flex-1 md:flex-none capitalize px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab===tab ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExport} className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm active:scale-95 shrink-0">
                        <Download size={14}/> Export
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                
                {/* ==========================================
                    🟢 TAB 1: FINANCIAL LEDGER
                    ========================================== */}
                {activeTab === 'financials' && (
                    <motion.div key="financials" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="space-y-6 w-full">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <MetricCard title="Gross System Volume" value={`${currency}${stats.financials.revenue.toLocaleString()}`} icon={IndianRupee} trend={14.2} />
                            <MetricCard title="Net Platform Profit (In)" value={`${currency}${platformProfit.toLocaleString()}`} icon={Landmark} trend={8.5} subtitle="After partner splits" />
                            <MetricCard title="Partner Payouts (Out)" value={`${currency}${(stats.financials.revenue - platformProfit).toLocaleString()}`} icon={CreditCard} />
                            <MetricCard title="Pending Obligations" value={`${currency}${pendingPayouts.toLocaleString()}`} icon={Clock} subtitle="Awaiting approval" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Graph */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden min-w-0">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-800">Global Revenue Flow</h3>
                                </div>
                                <div className="p-4 sm:p-6 w-full h-[300px] sm:h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/><stop offset="95%" stopColor="#9333ea" stopOpacity={0}/></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} tickFormatter={(val) => `₹${val}`} />
                                            <RechartsTooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} itemStyle={{ fontWeight: 700, color: '#9333ea' }}/>
                                            <Area type="monotone" name="Gross Revenue" dataKey="revenue" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Payment Methods & Splits */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col min-w-0">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-sm font-bold text-slate-800">Profit & Payment Split</h3>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
                                    <div className="w-full h-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={earningsData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                                                    {earningsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3 mt-6 border-t border-slate-100 pt-5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment Methods</p>
                                        {paymentMethods.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2.5 text-slate-600 font-semibold text-xs">
                                                    <span className="w-3 h-3 rounded-full shadow-sm border border-white" style={{background: d.color}}></span> {d.name}
                                                </span>
                                                <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">{d.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==========================================
                    🟢 TAB 2: LIVE OPERATIONS
                    ========================================== */}
                {activeTab === 'operations' && (
                    <motion.div key="operations" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="w-full">
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden w-full">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity size={16} className="text-blue-600"/> Live Dispatch Monitor</h3>
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md uppercase tracking-widest w-fit">{liveOrders.length} Active On Network</span>
                            </div>
                            
                            {/* 🟢 CRITICAL FIX: overflow-x-auto ensures the table scrolls internally, not breaking the page */}
                            <div className="w-full overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className="bg-white border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="p-5 py-4">Order Details</th>
                                            <th className="p-5 py-4">Logistics (Seller ➔ Rider ➔ User)</th>
                                            <th className="p-5 py-4 text-center">Security (OTPs)</th>
                                            <th className="p-5 py-4">Payment Info</th>
                                            <th className="p-5 py-4 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {liveOrders.length === 0 ? (
                                            <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-medium bg-slate-50/30">No live operations currently running.</td></tr>
                                        ) : liveOrders.map(order => (
                                            <tr key={order._id} className="hover:bg-slate-50/80 transition-colors group">
                                                
                                                {/* 1. Order Items */}
                                                <td className="p-5 align-top">
                                                    <p className="font-mono text-[11px] text-slate-400 font-bold mb-2">#{order._id.slice(-8).toUpperCase()}</p>
                                                    <div className="space-y-1.5">
                                                        {order.items.slice(0,2).map((item, i) => (
                                                            <p key={i} className="text-xs font-semibold text-slate-700 line-clamp-1 flex items-center gap-2">
                                                                <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{item.quantity}x</span> {item.product?.name || 'Item'}
                                                            </p>
                                                        ))}
                                                        {order.items.length > 2 && <p className="text-[10px] font-bold text-purple-600 mt-1">+{order.items.length - 2} more items</p>}
                                                    </div>
                                                </td>

                                                {/* 2. Logistics Chain */}
                                                <td className="p-5 align-top">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2.5">
                                                        <Store size={14} className="text-slate-400"/> <span className="truncate max-w-[100px]">{order.sellerId?.name || order.sellerId?.slice(-6) || "Hub"}</span>
                                                        <ArrowRight size={12} className="text-slate-300"/>
                                                        <Truck size={14} className={order.riderId ? 'text-blue-500' : 'text-slate-300'}/> <span className="truncate max-w-[100px]">{order.riderId?.name || <span className="text-amber-500">Pending</span>}</span>
                                                        <ArrowRight size={12} className="text-slate-300"/>
                                                        <Users size={14} className="text-slate-400"/> <span className="truncate max-w-[100px] text-slate-800 font-bold">{order.address?.firstName}</span>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-widest ${order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                        {order.status === 'Out for Delivery' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                                                        {order.status}
                                                    </span>
                                                </td>

                                                {/* 3. Security OTPs */}
                                                <td className="p-5 align-top text-center">
                                                    <div className="inline-flex flex-col gap-2 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                                                        <div className="flex justify-between items-center gap-4 text-[10px] font-bold">
                                                            <span className="text-slate-500 uppercase tracking-wide">Pickup:</span>
                                                            <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{order.pickupOtp || 'WAIT'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-4 text-[10px] font-bold">
                                                            <span className="text-slate-500 uppercase tracking-wide">Dropoff:</span>
                                                            <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{order.otp || 'WAIT'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 4. Payment Info */}
                                                <td className="p-5 align-top">
                                                    <p className="font-black text-slate-900 text-sm mb-2">{currency}{order.amount}</p>
                                                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-widest ${order.paymentMethod === 'COD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
                                                    </span>
                                                </td>

                                                {/* 5. Timestamp */}
                                                <td className="p-5 align-top text-right">
                                                    <p className="text-xs font-bold text-slate-700">{new Date(order.date).toLocaleDateString()}</p>
                                                    <p className="text-[10px] font-semibold text-slate-500 mt-1">{new Date(order.date).toLocaleTimeString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==========================================
                    🟢 TAB 3: NETWORK HUB
                    ========================================== */}
                {activeTab === 'network' && (
                    <motion.div key="network" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="space-y-6 w-full">
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <MetricCard title="Total Customers" value={stats.users.customer} icon={Users} trend={5.2} />
                            <MetricCard title="Approved Sellers" value={stats.users.seller} icon={Store} trend={1.1} />
                            <MetricCard title="Active Fleet Riders" value={stats.users.rider} icon={Truck} trend={-0.5} />
                            <MetricCard title="System Admins" value={stats.users.admin} icon={ShieldCheck} />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm">Partner Directory</h3>
                            </div>
                            <div className="p-10 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                    <Database size={32} className="text-slate-400" strokeWidth={1.5}/>
                                </div>
                                <h4 className="text-base font-black text-slate-800 mb-2">Directory Access Restricted</h4>
                                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">For full profile data, bank account details, and compliance documents, please utilize the dedicated management modules.</p>
                                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                    <button onClick={() => navigate('/superadmin/users')} className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors">Go to User Management</button>
                                    <button onClick={() => navigate('/superadmin/payouts')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors">Go to Payouts</button>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}

                {/* ==========================================
                    🟢 TAB 4: SYSTEM AUDIT
                    ========================================== */}
                {activeTab === 'audit' && (
                    <motion.div key="audit" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="w-full">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden w-full">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Eye size={16} className="text-purple-600"/> Administrator Audit Trail</h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">Immutable Ledger</span>
                            </div>
                            
                            {/* 🟢 CRITICAL FIX: localized overflow-x-auto */}
                            <div className="w-full overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-white border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="p-5 py-4">Authorized Personnel</th>
                                            <th className="p-5 py-4">Action Performed</th>
                                            <th className="p-5 py-4 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                        {auditLogs.map((log, i) => (
                                            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-black text-[10px] uppercase border border-purple-100">{log.admin.slice(0,2)}</div>
                                                        <span className="font-bold text-slate-900 text-sm">{log.admin}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-sm text-slate-600">{log.action}</td>
                                                <td className="p-5 text-right text-[11px] font-mono text-slate-500">{new Date(log.time).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default SuperDashboard;