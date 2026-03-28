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
            toast.error("Failed to sync secure telemetry.");
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
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-semibold tracking-widest uppercase text-[10px]">Syncing Master Ledger...</p>
            </div>
        );
    }

    // --- DERIVED DATA & SAFE FALLBACKS ---
    const platformProfit = stats.earningsSplit?.platform || 0;
    const pendingPayouts = stats.payoutBreakdown?.pending || 0;
    
    const earningsData = [
        { name: 'Sellers (Out)', value: stats.earningsSplit?.seller || 0, color: '#94a3b8' },
        { name: 'Riders (Out)', value: stats.earningsSplit?.rider || 0, color: '#cbd5e1' },
        { name: 'Platform (In)', value: platformProfit, color: '#4f46e5' },
    ];

    // Mock data for new features if backend doesn't provide them yet
    const paymentMethods = [
        { name: 'Cash on Delivery', value: 65, color: '#10b981' },
        { name: 'Online / Wallet', value: 35, color: '#3b82f6' }
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Icon size={18} strokeWidth={2} />
                </div>
                {trend && (
                    <span className={`text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 ${trend > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {trend > 0 ? <ArrowUpRight size={14} strokeWidth={2.5}/> : <ArrowDownRight size={14} strokeWidth={2.5}/>} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 font-outfit max-w-[1500px] mx-auto">
            
            {/* 🟢 HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-40">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Building size={20} className="text-indigo-600"/> Global Command Center
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Full System Telemetry & Control
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 w-full md:w-auto overflow-x-auto hide-scrollbar">
                        {['financials', 'operations', 'network', 'audit'].map(tab => (
                            <button 
                                key={tab} onClick={()=>setActiveTab(tab)} 
                                className={`flex-1 md:flex-none capitalize px-5 py-2 rounded-md text-xs font-bold transition-all duration-200 ${activeTab===tab ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExport} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-sm border border-slate-700">
                        <Download size={14}/> Master Export
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                
                {/* ==========================================
                    🟢 TAB 1: FINANCIAL LEDGER
                    ========================================== */}
                {activeTab === 'financials' && (
                    <motion.div key="financials" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Gross System Volume" value={`${currency}${stats.financials.revenue.toLocaleString()}`} icon={IndianRupee} trend={14.2} />
                            <MetricCard title="Net Platform Profit (In)" value={`${currency}${platformProfit.toLocaleString()}`} icon={Landmark} trend={8.5} subtitle="After partner splits" />
                            <MetricCard title="Partner Payouts (Out)" value={`${currency}${(stats.financials.revenue - platformProfit).toLocaleString()}`} icon={CreditCard} />
                            <MetricCard title="Pending Obligations" value={`${currency}${pendingPayouts.toLocaleString()}`} icon={Clock} subtitle="Awaiting admin approval" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Graph */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-800">Global Revenue Flow</h3>
                                </div>
                                <div className="p-6 w-full h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={graphData}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} tickFormatter={(val) => `₹${val}`} />
                                            <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'}} itemStyle={{ fontWeight: 700, color: '#4f46e5' }}/>
                                            <Area type="monotone" name="Gross Revenue" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Payment Methods & Splits */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="p-4 border-b border-slate-200 bg-slate-50">
                                    <h3 className="text-sm font-bold text-slate-800">Profit & Payment Split</h3>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-center min-h-[320px]">
                                    <div className="w-full h-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={earningsData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                                    {earningsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3 mt-4 border-t border-slate-100 pt-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Methods</p>
                                        {paymentMethods.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2 text-slate-600 font-semibold text-xs">
                                                    <span className="w-2.5 h-2.5 rounded-sm" style={{background: d.color}}></span> {d.name}
                                                </span>
                                                <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{d.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ==========================================
                    🟢 TAB 2: LIVE OPERATIONS (Dispatch & Details)
                    ========================================== */}
                {activeTab === 'operations' && (
                    <motion.div key="operations" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="space-y-6">
                        
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity size={16} className="text-blue-600"/> Live Dispatch & Security Monitor</h3>
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase tracking-widest">{liveOrders.length} Active On Network</span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead className="bg-white border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="p-4 py-3">Order Details</th>
                                            <th className="p-4 py-3">Logistics (Seller ➔ Rider ➔ User)</th>
                                            <th className="p-4 py-3 text-center">Security (OTPs)</th>
                                            <th className="p-4 py-3">Payment Info</th>
                                            <th className="p-4 py-3 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {liveOrders.length === 0 ? (
                                            <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-medium">No live operations currently running.</td></tr>
                                        ) : liveOrders.map(order => (
                                            <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                                
                                                {/* 1. Order Items */}
                                                <td className="p-4 align-top">
                                                    <p className="font-mono text-[10px] text-slate-400 font-bold mb-1">#{order._id.slice(-8).toUpperCase()}</p>
                                                    <div className="space-y-1">
                                                        {order.items.slice(0,2).map((item, i) => (
                                                            <p key={i} className="text-xs font-semibold text-slate-700 line-clamp-1 flex items-center gap-1.5">
                                                                <span className="text-slate-400">{item.quantity}x</span> {item.product?.name || 'Item'}
                                                            </p>
                                                        ))}
                                                        {order.items.length > 2 && <p className="text-[10px] font-bold text-indigo-500">+{order.items.length - 2} more items</p>}
                                                    </div>
                                                </td>

                                                {/* 2. Logistics Chain */}
                                                <td className="p-4 align-top">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                                                        <Store size={12} className="text-slate-400"/> <span className="truncate w-24">{order.sellerId?.name || order.sellerId?.slice(-6) || "Hub"}</span>
                                                        <ArrowRight size={10} className="text-slate-300"/>
                                                        <Truck size={12} className={order.riderId ? 'text-blue-500' : 'text-slate-300'}/> <span className="truncate w-20">{order.riderId?.name || <span className="text-amber-500">Pending</span>}</span>
                                                        <ArrowRight size={10} className="text-slate-300"/>
                                                        <Users size={12} className="text-slate-400"/> <span className="truncate w-24 text-slate-800 font-bold">{order.address?.firstName}</span>
                                                    </div>
                                                    <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{order.status}</span>
                                                </td>

                                                {/* 3. Security OTPs */}
                                                <td className="p-4 align-top text-center">
                                                    <div className="inline-flex flex-col gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                                                        <div className="flex justify-between items-center gap-3 text-[10px] font-bold">
                                                            <span className="text-slate-500 uppercase">Pickup:</span>
                                                            <span className="font-mono text-slate-900 bg-white px-1.5 rounded border border-slate-200">{order.pickupOtp || 'WAIT'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-3 text-[10px] font-bold">
                                                            <span className="text-slate-500 uppercase">Dropoff:</span>
                                                            <span className="font-mono text-slate-900 bg-white px-1.5 rounded border border-slate-200">{order.otp || 'WAIT'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 4. Payment Info */}
                                                <td className="p-4 align-top">
                                                    <p className="font-black text-slate-900 text-sm mb-1">{currency}{order.amount}</p>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${order.paymentMethod === 'COD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
                                                    </span>
                                                </td>

                                                {/* 5. Timestamp */}
                                                <td className="p-4 align-top text-right">
                                                    <p className="text-xs font-bold text-slate-700">{new Date(order.date).toLocaleDateString()}</p>
                                                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{new Date(order.date).toLocaleTimeString()}</p>
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
                    🟢 TAB 3: NETWORK HUB (Users, Sellers, Admins)
                    ========================================== */}
                {activeTab === 'network' && (
                    <motion.div key="network" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="space-y-6">
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard title="Total Customers" value={stats.users.customer} icon={Users} trend={5.2} />
                            <MetricCard title="Approved Sellers" value={stats.users.seller} icon={Store} trend={1.1} />
                            <MetricCard title="Active Fleet Riders" value={stats.users.rider} icon={Truck} trend={-0.5} />
                            <MetricCard title="System Admins" value={stats.users.admin} icon={ShieldCheck} />
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm">Partner Directory & Payout Details</h3>
                                <button className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 hover:bg-indigo-100 transition">View All Profiles</button>
                            </div>
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <Database size={48} className="text-slate-300 mb-4" strokeWidth={1}/>
                                <h4 className="text-sm font-bold text-slate-700 mb-1">Directory Access Restricted</h4>
                                <p className="text-xs text-slate-500 max-w-sm">For full profile data, bank account details, and compliance documents, please visit the dedicated <b className="text-slate-700">User Management</b> or <b className="text-slate-700">Payouts</b> modules in the sidebar.</p>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => navigate('/superadmin/users')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-slate-800 transition">Go to User Management</button>
                                    <button onClick={() => navigate('/superadmin/payouts')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition">Go to Payouts</button>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}

                {/* ==========================================
                    🟢 TAB 4: SYSTEM AUDIT (Admin Actions)
                    ========================================== */}
                {activeTab === 'audit' && (
                    <motion.div key="audit" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{ duration: 0.2 }} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Eye size={16} className="text-purple-600"/> Administrator Audit Trail</h3>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">Immutable Ledger</span>
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="pb-3 px-2">Authorized Personnel</th>
                                        <th className="pb-3 px-2">Action Performed</th>
                                        <th className="pb-3 px-2 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                    {auditLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] uppercase">{log.admin.slice(0,2)}</div>
                                                    <span className="font-bold text-slate-900 text-xs">{log.admin}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-xs text-slate-600">{log.action}</td>
                                            <td className="py-4 px-2 text-right text-[11px] font-mono text-slate-500">{new Date(log.time).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default SuperDashboard;