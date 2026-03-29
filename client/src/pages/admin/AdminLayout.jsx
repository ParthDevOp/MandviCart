import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, ShoppingBag, Package, Truck, LogOut, Store, 
    MessageCircle, Layout, Users, Bike, UserCheck, Menu, X
} from 'lucide-react';

const AdminLayout = () => {
    const { axios, navigate, setUser, setRole } = useAppContext();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const logout = async () => {
        await axios.post('/api/user/logout');
        setUser(null); setRole(null); navigate('/');
    };

    const sidebarLinks = [
        { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Live Orders", path: "/admin/orders", icon: ShoppingBag },
        { name: "Products", path: "/admin/products", icon: Package },
        
        // 🟢 MANAGMENT SECTION
        { name: "Customers", path: "/admin/users", icon: Users },
        { name: "Sellers", path: "/admin/sellers", icon: Store },
        { name: "Riders", path: "/admin/riders", icon: Bike },

        { name: "Site Content", path: "/admin/content", icon: Layout },
        { name: "Support Chat", path: "/admin/chat", icon: MessageCircle },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-outfit">
            {/* Hamburger Button - Mobile Only */}
            <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
                <img src={assets.logo} alt="GreenCart" className="w-24" />
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {sidebarOpen ? (
                        <X size={24} className="text-gray-600" />
                    ) : (
                        <Menu size={24} className="text-gray-600" />
                    )}
                </button>
            </div>

            {/* Overlay for mobile */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/40 z-30"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                <motion.div
                    initial={false}
                    animate={{ x: sidebarOpen ? 0 : "-100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed lg:static lg:translate-x-0 z-40 left-0 top-0 w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 lg:min-h-screen flex flex-col h-screen lg:h-auto"
                >
                    {/* Logo Section */}
                    <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col gap-2">
                        <img src={assets.logo} alt="GreenCart" className="w-24 sm:w-32" />
                        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider flex items-center gap-1 w-fit">
                            <UserCheck size={12} /> ADMIN PANEL
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-3 sm:p-4 space-y-1">
                        {sidebarLinks.map((item) => (
                            <NavLink 
                                key={item.name} 
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all font-medium text-xs sm:text-sm ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <item.icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" /> 
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-3 sm:p-4 border-t border-gray-100">
                        <button 
                            onClick={logout} 
                            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors text-xs sm:text-sm font-medium"
                        >
                            <LogOut size={18} className="flex-shrink-0" /> 
                            <span>Logout</span>
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto flex flex-col w-full">
                <div className="p-4 sm:p-6 md:p-8 flex-1">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;