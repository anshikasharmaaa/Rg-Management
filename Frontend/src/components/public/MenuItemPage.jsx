import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, UtensilsCrossed } from "lucide-react";
import Header from "../shared/Header.jsx";
import Footer from "./Footer.jsx";
import SafeImage from "../common/SafeImage.jsx";
import EmptyState from "../common/EmptyState.jsx";
import AlertBanner from "../common/AlertBanner.jsx";
import { Skeleton } from "../common/Skeleton.jsx";
import usePublicMenuItem from "../../hooks/usePublicMenuItem.js";
import { resolveMenuImage } from "../../services/menu.service.js";
import { ROUTES } from "../../utils/routes.js";

const TYPE_LABEL = {
    VEG: { label: "Veg", className: "bg-green-50 text-green-700" },
    NON_VEG: { label: "Non-Veg", className: "bg-red-50 text-red-700" },
    EGG: { label: "Egg", className: "bg-amber-50 text-amber-700" },
};

const DetailSkeleton = () => (
    <div
        className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
        role="status"
        aria-label="Loading dish"
    >
        <Skeleton className="h-72 w-full rounded-2xl sm:h-96" />
        <div>
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="mt-4 h-8 w-2/3" />
            <Skeleton className="mt-4 h-6 w-20" />
            <Skeleton className="mt-6 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
    </div>
);

const MenuItemPage = () => {
    const { id } = useParams();
    const { item, loading, error, notFound } = usePublicMenuItem(id);
    const typeInfo = TYPE_LABEL[item?.type] || TYPE_LABEL.VEG;

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    to={ROUTES.MENU}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                    <ArrowLeft size={16} />
                    Back to menu
                </Link>

                {loading ? (
                    <DetailSkeleton />
                ) : notFound ? (
                    <EmptyState
                        icon={UtensilsCrossed}
                        title="Dish not found"
                        message="This dish may have been removed or is no longer on our menu."
                    />
                ) : !item ? (
                    <div className="mx-auto max-w-md">
                        <AlertBanner message={error} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-card">
                            <SafeImage
                                src={resolveMenuImage(item.imageUrl)}
                                alt={item.name}
                                Icon={UtensilsCrossed}
                                iconSize={40}
                                className="h-72 w-full object-cover sm:h-96"
                            />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeInfo.className}`}>
                                    {typeInfo.label}
                                </span>
                                {item.category?.name && (
                                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                        {item.category.name}
                                    </span>
                                )}
                                {item.isAvailable === false && (
                                    <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                        Currently unavailable
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                                {item.name}
                            </h1>
                            <p className="mt-3 text-2xl font-semibold text-gold-600">₹{item.price}</p>

                            {item.description && (
                                <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600">
                                    {item.description}
                                </p>
                            )}

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to={ROUTES.MENU}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90"
                                >
                                    Browse Full Menu
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to={ROUTES.CONTACT}
                                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                                >
                                    Visit Us
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
};

export default MenuItemPage;