import React from 'react';
import AuthBackground from './AuthBackground';

const AuthWrapper = ({ children }) => {
    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
            <AuthBackground />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white/92 p-6 shadow-2xl sm:p-7">
                {children}
            </div>
        </div>
    );
};

export default AuthWrapper;
