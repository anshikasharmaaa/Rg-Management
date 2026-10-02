import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import usePublicMenu from "../../hooks/usePublicMenu.js";
import { FoodCardSkeleton } from "../common/Skeleton.jsx";
import EmptyState from "../common/EmptyState.jsx";
import AlertBanner from "../common/AlertBanner.jsx";
import { ROUTES } from "../../utils/routes.js";
import FoodCard from "./FoodCard.jsx";

const MenuPreview = ({ limit, title = "A Taste of Our Menu", showViewAll = true }) => {
    // Data comes from MongoDB via /menu/public; the admin's create / edit / delete
    // events refresh it live (throttled) inside the hook.
    const { items, loading, error } = usePublicMenu();
    const visibleItems = limit ? items.slice(0, limit) : items;

    return (
        <section id="menu-preview" className="bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {title && (
                    <div className="mb-10 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                            From the kitchen
                        </p>
                        <h2 className="mt-2 text-3xl font-bold text-gray-900">{title}</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
                            A few guest favourites — the full menu has plenty more to explore.
                        </p>
                    </div>
                )}

                {loading ? (
                    <FoodCardSkeleton count={limit || 6} />
                ) : error ? (
                    <div className="mx-auto max-w-md">
                        <AlertBanner message={error} />
                    </div>
                ) : visibleItems.length === 0 ? (
                    <EmptyState
                        icon={UtensilsCrossed}
                        title="Menu coming soon"
                        message="Our menu is being updated. Please check back shortly."
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleItems.map((item) => (
                            <FoodCard key={item._id} item={item} />
                        ))}
                    </div>
                )}

                {showViewAll && !loading && !error && items.length > 0 && (
                    <div className="mt-10 text-center">
                        <Link
                            to={ROUTES.MENU}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                        >
                            View Full Menu
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MenuPreview;