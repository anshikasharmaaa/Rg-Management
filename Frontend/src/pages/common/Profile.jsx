import { Link } from "react-router-dom";
import { LayoutDashboard, Home, LogOut, Phone, Mail, ShieldCheck } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import { ROUTES } from "../../utils/routes.js";

const Field = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="truncate text-sm text-gray-900">{value || "—"}</p>
        </div>
    </div>
);

const Profile = () => {
    const { user, role, logout, dashboardPath } = useAuth();
    if (!user) return null;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
                <p className="mt-1 text-sm text-gray-500">Your account details</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
                <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-2xl font-semibold text-charcoal-950">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full bg-gold-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-700">
                                {user.role}
                            </span>
                            {user.status && (
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${user.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                        }`}
                                >
                                    {user.status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {role === "admin" ? (
                        <Field icon={Mail} label="Email" value={user.email} />
                    ) : (
                        <Field icon={Phone} label="Mobile" value={user.mobile} />
                    )}
                    <Field icon={ShieldCheck} label="Access" value={role === "admin" ? "Full admin access" : "Staff access"} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                    <Link
                        to={dashboardPath}
                        className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-950 hover:opacity-90"
                    >
                        <LayoutDashboard size={15} />
                        Dashboard
                    </Link>
                    <Link
                        to={ROUTES.HOME}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        <Home size={15} />
                        Home
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        <LogOut size={15} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;