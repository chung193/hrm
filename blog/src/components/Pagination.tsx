interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages: (number | "...")[] = [];

        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        pages.push(1);

        if (currentPage > 3) pages.push("...");

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push("...");

        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="max-w-4xl w-full mx-auto py-4 overflow-x-auto">
            <div className="w-max min-w-full flex items-center justify-center gap-1">
                {/* Prev */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="
                    flex items-center justify-center w-9 h-9 rounded-lg text-sm
                    text-slate-500 hover:bg-slate-100 hover:text-slate-800
                    dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-150
                "
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                {/* Pages */}
                {getPages().map((page, idx) =>
                    page === "..." ? (
                        <span key={`dot-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`
                            w-9 h-9 rounded-lg text-sm font-medium
                            transition-all duration-150
                            ${currentPage === page
                                    ? "bg-slate-600 text-white shadow-sm shadow-slate-200 dark:bg-slate-300 dark:text-slate-900 dark:shadow-none"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                }
                        `}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="
                    flex items-center justify-center w-9 h-9 rounded-lg text-sm
                    text-slate-500 hover:bg-slate-100 hover:text-slate-800
                    dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-150
                "
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

