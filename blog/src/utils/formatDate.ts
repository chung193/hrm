export const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return "—";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

// Kèm giờ
export const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "—";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Get full media URL by prepending backend upload URL if path is relative
export const getMediaUrl = (path: string | undefined): string => {
    if (!path) return "";

    // If already a full URL (starts with http:// or https://), return as is
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    // If it's a relative path, prepend the backend upload URL
    const uploadUrl = import.meta.env.VITE_APP_BACKEND_UPLOAD_URL || "http://localhost:8000/storage/";

    // Remove leading slash if path has one to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;

    return `${uploadUrl}${cleanPath}`;
};