import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { motion } from "framer-motion";
import { 
    LayoutDashboard, ShoppingBag, Package, Truck, LogOut, Store, 
    MessageCircle, Layout, Users, Bike, UserCheck 
} from 'lucide-react';

const AdminLayout = () => {
    const { axios, navigate, setUser, setRole } = useAppContext();

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
            {/* Sidebar */}
            <div className="w-full lg:w-64 bg-white border-b lg:border-r border-gray-200 lg:min-h-screen flex flex-col">
                {/* Logo Section */}
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col gap-2">
                    <img src={assets.logo} alt="GreenCart" className="w-24 sm:w-32" />
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider flex items-center gap-1 w-fit">
                        <UserCheck size={12} /> ADMIN PANEL
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-x-auto lg:overflow-x-visible">
                    {sidebarLinks.map((item) => (
                        <NavLink 
                            key={item.name} 
                            to={item.path}
                            className={({ isActive }) => `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all font-medium text-xs sm:text-sm whitespace-nowrap lg:whitespace-normal ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <item.icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" /> 
                            <span className="hidden sm:inline">{item.name}</span>
                            <span className="sm:hidden text-[8px]">{item.name}</span>
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
                        <span className="hidden sm:inline">Logout</span>
                        <span className="sm:hidden text-[8px]">Logout</span>
                    </button>
                </div>
            </div>

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