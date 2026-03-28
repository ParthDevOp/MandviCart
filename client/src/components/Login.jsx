import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SignIn, useUser } from '@clerk/clerk-react'; 

// 🟢 THE FIX: Move appearance OUTSIDE the component so Clerk doesn't infinitely loop!
const clerkAppearance = {
    variables: {
        colorPrimary: '#16a34a', 
        colorText: '#1f2937',    
        colorBackground: 'transparent', 
        colorInputBackground: '#f9fafb', 
        colorInputText: '#1f2937',
        borderRadius: '12px',
        fontFamily: '"Outfit", sans-serif',
    },
    elements: {
        rootBox: "mx-auto w-full",
        card: "shadow-none p-6 sm:p-8 bg-transparent", 
        headerTitle: "text-2xl font-bold tracking-tight text-gray-900",
        headerSubtitle: "text-gray-500 text-sm mt-1",
        socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all rounded-xl py-3",
        socialButtonsBlockButtonText: "font-medium text-gray-700",
        dividerLine: "bg-gray-200",
        dividerText: "text-gray-400 text-xs font-medium uppercase tracking-wider",
        formFieldLabel: "text-gray-700 font-medium text-sm mb-1",
        formFieldInput: "rounded-xl border-gray-200 bg-gray-50 py-2.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all shadow-sm",
        formButtonPrimary: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 rounded-xl transition-all py-3 font-semibold text-[15px] normal-case tracking-wide mt-2",
        footerActionText: "text-gray-500",
        footerActionLink: "text-green-600 hover:text-green-700 font-semibold hover:underline",
        identityPreviewText: "text-gray-700 font-medium",
        identityPreviewEditButton: "text-green-600 hover:text-green-700 transition-colors",
    }
};

const Login = () => {
    const { setShowUserLogin } = useAppContext();
    const { isSignedIn } = useUser(); 

    useEffect(() => {
        if (isSignedIn) {
            setShowUserLogin(false);
        }
    }, [isSignedIn, setShowUserLogin]);

    return (
        <div className='fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 sm:p-6'>
            <button 
                onClick={() => setShowUserLogin(false)} 
                className="absolute top-6 right-6 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-lg transition-all z-[1001] hover:rotate-90 duration-300"
            >
                <X size={24} strokeWidth={2} />
            </button>

            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[400px]"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-[2rem] blur-lg opacity-30"></div>

                <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-gray-100">
                    <SignIn 
                        routing="hash" 
                        forceRedirectUrl={false} 
                        appearance={clerkAppearance} 
                        localization={{
                            signIn: {
                                start: {
                                    title: 'Sign in to Mandvi Cart',
                                }
                            }
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default Login;