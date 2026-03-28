import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, ShieldCheck, Activity, Settings, LogOut, ArrowLeft,
    Users, DollarSign, Layout, MessageSquare, Bell, Menu, X
} from 'lucide-react';

const SuperLayout = () => {
    const { axios, navigate, setUser, setRole } = useAppContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const logout = async () => {
        await axios.post('/api/user/logout');
        setUser(null); setRole(null); navigate('/');
    };

    const links = [
        { name: "Overview", path: "/superadmin/dashboard", icon: LayoutDashboard },
        { name: "Manage Admins", path: "/superadmin/admins", icon: ShieldCheck },
        { name: "User Management", path: "/superadmin/users", icon: Users },
        { name: "Payout Requests", path: "/superadmin/payouts", icon: DollarSign },
        { name: "Content Manager", path: "/superadmin/content", icon: Layout },
        { name: "Chat Monitor", path: "/superadmin/chat", icon: MessageSquare },
        { name: "Activity Logs", path: "/superadmin/logs", icon: Activity },
        { name: "System Settings", path: "/superadmin/settings", icon: Settings },
        { name: "Announcements", path: "/superadmin/notifications", icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-outfit overflow-hidden">
            
            {/* 🟢 MOBILE HEADER */}
            <div className="md:hidden bg-slate-950 text-white p-4 flex justify-between items-center z-50 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/30">
                        <ShieldCheck size={18} className="text-white"/>
                    </div>
                    <h2 className="text-xl font-black tracking-tight">MandviCart <span className="text-purple-400">OS</span></h2>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-800 rounded-lg text-slate-300">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* 🟢 SIDEBAR (Desktop + Mobile Slide-out) */}
            <AnimatePresence>
                {(isMobileMenuOpen || window.innerWidth >= 768) && (
                    <motion.div 
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className={`fixed md:relative top-0 left-0 w-72 h-full bg-slate-950 border-r border-slate-800/60 flex flex-col shadow-2xl z-50 md:z-auto md:translate-x-0 ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}
                    >
                        <div className="p-6 border-b border-slate-800/60 hidden md:flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="flex items-center gap-2 text-purple-400 font-bold tracking-widest text-[10px] uppercase">
                                <ShieldCheck size={14}/> Super Admin Console
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">MandviCart <span className="text-purple-500">OS</span></h2>
                        </div>

                        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto hide-scrollbar mt-4 md:mt-0">
                            {links.map((item) => (
                                <NavLink 
                                    key={item.name} 
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => `group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm relative overflow-hidden
                                    ${isActive ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40 border border-purple-500/30' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-white shadow-[0_0_10px_white]"></div>}
                                            <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-hover:text-purple-400'}`} /> 
                                            {item.name}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-slate-800/60 space-y-2 bg-slate-950/50">
                            <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors text-sm font-bold group">
                                <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors"><ArrowLeft size={14} /></div> Store Admin View
                            </button>
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-bold border border-transparent hover:border-rose-500/20">
                                <LogOut size={18} /> Logout System
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* 🟢 CONTENT AREA */}
            <div className="flex-1 overflow-y-auto h-[calc(100vh-73px)] md:h-screen relative bg-slate-50">
                <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-purple-900/10 via-purple-900/5 to-slate-50 pointer-events-none"></div>
                <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <Outlet />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
export default SuperLayout;