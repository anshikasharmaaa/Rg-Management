import { useCallback, useRef, useState } from "react";
import { Search } from "lucide-react";
import SearchPanel from "./SearchPanel.jsx";

// The search box shown on the Home page. It looks like an input but opens the
// full search panel (blurred backdrop, autofocused input, live results).
const HomeSearch = () => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);

    const handleClose = useCallback(() => {
        setOpen(false);
        triggerRef.current?.focus();
    }, []);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                className="flex w-full items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-left shadow-card transition-colors hover:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
                <Search size={18} className="shrink-0 text-gold-600" />
                <span className="flex-1 truncate text-sm text-gray-500">
                    Search dishes, categories...
                </span>
            </button>

            {open && <SearchPanel onClose={handleClose} />}
        </>
    );
};

export default HomeSearch;