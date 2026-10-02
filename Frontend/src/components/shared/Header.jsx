import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import ProfileDropdown from "./ProfileDropdown.jsx";
import { ROUTES } from "../../utils/routes.js";

const desktopLink = (active) =>
    `text-sm font-medium transition-colors ${active ? "text-gold-600" : "text-gray-600 hover:text-gray-900"}`;

const mobileLink = (active) =>
    `rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-gold-50 text-gold-700" : "text-gray-700 hover:bg-gray-100"}`;

// One Header everywhere.
//  - Public pages: <Header />
//  - Dashboards:   <Header fluid onSidebarToggle={...} rightSlot={<Bell />} />
const Header = ({ rightSlot = null, onSidebarToggle = null, fluid = false }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { pathname } = useLocation();
    const { isAuthenticated, role, dashboardPath, profilePath, logout } = useAuth();

    const dashboardMode = typeof onSidebarToggle === "function";
    const panelRoot = role === "admin" ? ROUTES.ADMIN.ROOT : ROUTES.EMPLOYEE.ROOT;

    const links = [
        { label: "Home", to: ROUTES.HOME, active: pathname === ROUTES.HOME },
        ...(isAuthenticated && dashboardPath
            ? [{ label: "Dashboard", to: dashboardPath, active: pathname.startsWith(panelRoot) }]
            : []),
        { label: "Menu", to: ROUTES.MENU, active: pathname.startsWith(ROUTES.MENU) },
        { label: "Contact", to: ROUTES.CONTACT, active: pathname.startsWith(ROUTES.CONTACT) },
    ];

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div
                className={`flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 ${fluid ? "" : "mx-auto max-w-7xl"
                    }`}
            >
                <div className="flex items-center gap-2">
                    {dashboardMode && (
                        <button
                            onClick={onSidebarToggle}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                            aria-label="Open sidebar"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    <Link to={ROUTES.HOME} className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-charcoal-950">
                            RG
                        </div>
                        <div>
                            <p className="text-sm font-semibold leading-tight text-gray-900">RG Restaurant</p>
                            <p className="hidden text-[11px] leading-tight text-gray-500 sm:block">
                                Fine dining, made simple
                            </p>
                        </div>
                    </Link>
                </div>

                <nav className="hidden items-center gap-8 md:flex">
                    {links.map((link) => (
                        <Link key={link.to} to={link.to} className={desktopLink(link.active)}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={`items-center gap-3 ${dashboardMode ? "flex" : "hidden md:flex"}`}>
                    {rightSlot}
                    {isAuthenticated ? (
                        <ProfileDropdown />
                    ) : (
                        <Link
                            to={ROUTES.LOGIN}
                            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90"
                        >
                            Login
                        </Link>
                    )}
                </div>

                {!dashboardMode && (
                    <button
                        onClick={() => setMobileOpen((prev) => !prev)}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                )}
            </div>

            {!dashboardMode && mobileOpen && (
                <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {links.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={mobileLink(link.active)}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {isAuthenticated ? (
                            <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
                                <Link
                                    to={profilePath}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-2 ${mobileLink(pathname === profilePath)}`}
                                >
                                    <User size={16} />
                                    Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileOpen(false);
                                        logout();
                                    }}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                to={ROUTES.LOGIN}
                                onClick={() => setMobileOpen(false)}
                                className="mt-2 rounded-lg bg-gold-500 px-3 py-2.5 text-center text-sm font-semibold text-charcoal-950"
                            >
                                Login
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;