import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import { ROUTES } from "../../utils/routes.js";

const Footer = () => {
    const { isAuthenticated, dashboardPath } = useAuth();

    return (
        <footer className="border-t border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-charcoal-950">
                                RG
                            </div>
                            <p className="text-sm font-semibold text-gray-900">RG Restaurant</p>
                        </div>
                        <p className="mt-3 max-w-xs text-sm text-gray-500">
                            Fresh, flavourful food served with genuine hospitality.
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Quick Links
                        </p>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
                            <Link to={ROUTES.HOME} className="hover:text-gold-600">Home</Link>
                            <Link to={ROUTES.MENU} className="hover:text-gold-600">Menu</Link>
                            <Link to={ROUTES.CONTACT} className="hover:text-gold-600">Contact</Link>
                            {isAuthenticated ? (
                                <Link to={dashboardPath} className="hover:text-gold-600">Dashboard</Link>
                            ) : (
                                <Link to={ROUTES.LOGIN} className="hover:text-gold-600">Login</Link>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Get in Touch
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                                <MapPin size={14} className="text-gold-600" />
                                Your Restaurant Address Here
                            </p>
                            <p className="flex items-center gap-2">
                                <Phone size={14} className="text-gold-600" />
                                +91 00000 00000
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail size={14} className="text-gold-600" />
                                hello@rgrestaurant.com
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
                    © {new Date().getFullYear()} RG Restaurant. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;