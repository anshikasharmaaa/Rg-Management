import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, UtensilsCrossed } from "lucide-react";
import useMenuSearch from "../../hooks/useMenuSearch.js";
import { resolveMenuImage } from "../../services/menu.service.js";
import { Skeleton } from "../common/Skeleton.jsx";
import SafeImage from "../common/SafeImage.jsx";
import { ROUTES } from "../../utils/routes.js";

const ResultsSkeleton = () => (
    <div className="p-2" role="status" aria-label="Searching">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-2 h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-12" />
            </div>
        ))}
    </div>
);

const MessageState = ({ icon: Icon, title, message, children }) => (
    <div className="flex flex-col items-center px-6 py-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <Icon size={20} />
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-gray-500">{message}</p>
        {children}
    </div>
);

const SearchPanel = ({ onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [entered, setEntered] = useState(false);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const { results, status, retry } = useMenuSearch(query);
    const active = activeIndex < results.length ? activeIndex : -1;

    // Fade/slide in after mount.
    useEffect(() => {
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    // Close on Escape.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const handleChange = (e) => {
        setQuery(e.target.value);
        setActiveIndex(-1);
    };

    const goTo = (item) => {
        onClose();
        navigate(ROUTES.MENU_ITEM(item._id));
    };

    const moveActive = (next) => {
        setActiveIndex(next);
        listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    };

    const handleKeyDown = (e) => {
        if (status !== "success" || results.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            moveActive((active + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveActive(active <= 0 ? results.length - 1 : active - 1);
        } else if (e.key === "Enter") {
            e.preventDefault();
            goTo(results[active >= 0 ? active : 0]);
        }
    };

    let body;
    if (status === "idle") {
        body = (
            <MessageState
                icon={Search}
                title="Search our menu"
                message="Type a dish name, category or ingredient to get started."
            >
                <Link
                    to={ROUTES.MENU}
                    onClick={onClose}
                    className="mt-4 text-xs font-semibold text-gold-600 hover:text-gold-700"
                >
                    Browse the full menu
                </Link>
            </MessageState>
        );
    } else if (status === "loading") {
        body = <ResultsSkeleton />;
    } else if (status === "error") {
        body = (
            <MessageState
                icon={UtensilsCrossed}
                title="We couldn't load results"
                message="Something went wrong while searching. Please try again."
            >
                <button
                    type="button"
                    onClick={retry}
                    className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                    Try again
                </button>
            </MessageState>
        );
    } else if (results.length === 0) {
        body = (
            <MessageState
                icon={UtensilsCrossed}
                title="No dishes found"
                message="Try a different name or category."
            />
        );
    } else {
        body = (
            <ul ref={listRef} className="p-2">
                {results.map((item, index) => (
                    <li key={item._id}>
                        <Link
                            to={ROUTES.MENU_ITEM(item._id)}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${index === active ? "bg-gold-50" : "hover:bg-gray-50"
                                }`}
                        >
                            <SafeImage
                                src={resolveMenuImage(item.imageUrl)}
                                alt={item.name}
                                Icon={UtensilsCrossed}
                                iconSize={18}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {item.name}
                                </p>
                                {item.category?.name && (
                                    <p className="truncate text-xs text-gray-500">
                                        {item.category.name}
                                    </p>
                                )}
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-gold-600">
                                ₹{item.price}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
        );
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-3 sm:px-4 sm:pt-[12vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Search the menu"
        >
            {/* Dim + blur everything behind the panel. Clicking it closes the panel. */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`absolute inset-0 bg-charcoal-950/50 backdrop-blur-sm transition-opacity duration-200 ${entered ? "opacity-100" : "opacity-0"
                    }`}
            />

            <div
                className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition duration-200 ${entered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                    }`}
            >
                <div className="flex items-center gap-3 px-4 py-3.5">
                    <Search size={18} className="shrink-0 text-gold-600" />
                    <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        value={query}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        maxLength={100}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Search dishes, categories..."
                        aria-label="Search the menu"
                        className="min-w-0 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setActiveIndex(-1);
                                inputRef.current?.focus();
                            }}
                            aria-label="Clear search"
                            className="rounded p-1 text-gray-400 hover:text-gray-700"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-50"
                    >
                        <span className="sm:hidden">Close</span>
                        <span className="hidden sm:inline">Esc</span>
                    </button>
                </div>

                <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain border-t border-gray-100 sm:max-h-[60vh]">
                    {body}
                </div>

                <p className="sr-only" role="status" aria-live="polite">
                    {status === "success"
                        ? `${results.length} ${results.length === 1 ? "dish" : "dishes"} found`
                        : ""}
                </p>
            </div>
        </div>,
        document.body,
    );
};

export default SearchPanel;