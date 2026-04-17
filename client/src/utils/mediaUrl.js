const backendUploadUrl = import.meta.env.VITE_APP_BACKEND_UPLOAD_URL || '';
const backendBaseUrl = import.meta.env.VITE_APP_BACKEND_URL || '';

// Get full media URL by prepending backend upload URL if path is relative
export const getMediaUrl = (path) => {
    if (!path) return '';

    if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
        try {
            const originalUrl = new URL(path);

            if ((originalUrl.hostname === 'localhost' || originalUrl.hostname === '127.0.0.1') && backendBaseUrl) {
                const backendUrl = new URL(backendBaseUrl);
                return `${backendUrl.origin}${originalUrl.pathname}${originalUrl.search}${originalUrl.hash}`;
            }

            return path;
        } catch {
            return path;
        }
    }

    const uploadUrl = backendUploadUrl || `${window.location.origin}/uploads/`;

    const cleanPath = typeof path === 'string' && path.startsWith('/') ? path.substring(1) : path;

    return `${uploadUrl}${cleanPath}`;
};
