import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`
                fixed bottom-6 right-6 z-50
                flex items-center justify-center
                w-11 h-11 rounded-full
                bg-slate-600 hover:bg-slate-700
                dark:bg-slate-700 dark:hover:bg-slate-600
                text-white shadow-lg
                cursor-pointer
                transition-all duration-300 ease-in-out
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
            `}
            aria-label="Back to top"
        >
            <ArrowUp size={20} />
        </button>
    );
}
