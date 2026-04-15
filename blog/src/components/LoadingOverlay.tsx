const LoadingOverlay = () => {
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            style={{ pointerEvents: 'auto' }}
        >
            <div className="flex flex-col items-center gap-4">
                <img
                    src="/waiting.gif"
                    alt="Đang tải..."
                    className="h-16 w-16 sm:h-20 sm:w-20"
                />
                <p className="text-white text-sm sm:text-base font-medium">Đang xử lý...</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
