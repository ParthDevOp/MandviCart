import jwt from 'jsonwebtoken';
import User from '../models/User.js'; 
import SystemSetting from "../models/SystemSetting.js";

// ==========================================
// 1. GLOBAL MAINTENANCE CHECK 
// ==========================================
export const checkMaintenance = async (req, res, next) => {
  try {
    // Allow ALL auth-related routes to bypass maintenance 
    const authRoutes = [
        '/api/user/login', 
        '/api/user/clerk-login', // 🟢 CRITICAL FIX: Ensure Clerk login bypasses maintenance
        '/api/user/register', 
        '/api/user/verify-registration', 
        '/api/user/forgot-password', 
        '/api/user/reset-password'
    ];

    if (authRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }

    const settings = await SystemSetting.findOne();
    
    if (settings && settings.maintenanceMode) {
        const token = req.headers.authorization?.split(" ")[1] || req.headers.token;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Allow Super Admin and Admin to access the system to fix issues
                if (['superadmin', 'admin'].includes(decoded.role)) {
                    return next(); 
                }
            } catch (e) {
                // If token is invalid, fall through to the 503 error
            }
        }

        return res.status(503).json({ 
            success: false, 
            message: "System is currently undergoing scheduled maintenance. We will be back shortly.",
            maintenance: true 
        });
    }
    next();
  } catch (error) {
    console.error("Maintenance Check Error:", error.message);
    next();
  }
};

// ==========================================
// 2. PROTECT (Authentication & Security Shield)
// ==========================================
export const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
       return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
    }

    // Instant Ban Eviction
    if (user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Your account has been suspended. Access revoked.' });
    }

    // Defense in Depth
    if (!user.isVerified) {
        return res.status(403).json({ success: false, message: 'Account not verified. Please complete OTP verification.' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id; 
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.', expired: true });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Authorization denied.' });
  }
};

// ==========================================
// 3. AUTHORIZE (Role-Based Access Control)
// ==========================================
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
       return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Forbidden. Your role (${req.user.role}) does not have permission to perform this action.` 
      });
    }
    
    next();
  };
};