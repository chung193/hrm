import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

interface LoadingContextType {
    showLoading: () => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoadingContext = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoadingContext must be used within LoadingProvider');
    }
    return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);

    const showLoading = () => setLoading(true);
    const hideLoading = () => setLoading(false);

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading }}>
            {children}
            {loading && <LoadingOverlay />}
        </LoadingContext.Provider>
    );
};
