import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, User, ChevronDown, Home, LayoutDashboard } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import { ROUTES } from "../../utils/routes.js";

const itemClass =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50";

const ProfileDropdown = () => {
    const { user, logout, dashboardPath, profilePath } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    if (!user) return null;

    const initial = user.name?.charAt(0)?.toUpperCase() || "U";
    const close = () => setOpen(false);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 pr-3 text-sm hover:bg-gray-50"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-charcoal-950">
                    {initial}
                </span>
                <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight text-gray-900">{user.name}</span>
                    <span className="block text-[11px] leading-tight text-gray-500">{user.role}</span>
                </span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                >
                    <div className="border-b border-gray-100 px-3 py-2.5">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
                        <span className="mt-1.5 inline-block rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700">
                            {user.role}
                        </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                        <Link to={ROUTES.HOME} onClick={close} className={itemClass}>
                            <Home size={15} />
                            Home
                        </Link>
                        <Link to={dashboardPath} onClick={close} className={itemClass}>
                            <LayoutDashboard size={15} />
                            Dashboard
                        </Link>
                        <Link to={profilePath} onClick={close} className={itemClass}>
                            <User size={15} />
                            Profile
                        </Link>
                        <button
                            onClick={() => {
                                close();
                                logout();
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                            <LogOut size={15} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;