import { useState, useEffect } from "react";
import { UtensilsCrossed } from "lucide-react";
import Header from "../shared/Header.jsx";
import Footer from "./Footer.jsx";
import FoodCard from "./FoodCard.jsx";
import SearchInput from "../common/SearchInput.jsx";
import EmptyState from "../common/EmptyState.jsx";
import AlertBanner from "../common/AlertBanner.jsx";
import { FoodCardSkeleton } from "../common/Skeleton.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import usePublicMenu from "../../hooks/usePublicMenu.js";

const chipClass = (active) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${active
        ? "border-gold-500 bg-gold-500 text-charcoal-950"
        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
    }`;

const MenuPage = () => {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const debouncedSearch = useDebounce(search, 400);

    const { items, loading, error } = usePublicMenu({ search: debouncedSearch, category });

    // Category chips come from the API data (unfiltered load), not a hardcoded list.
    useEffect(() => {
        if (debouncedSearch.trim() || category) return;
        const map = new Map();
        items.forEach((item) => {
            if (item.category?._id) map.set(item.category._id, item.category.name);
        });
        setCategories(Array.from(map, ([id, name]) => ({ id, name })));
    }, [items, debouncedSearch, category]);

    const hasFilters = Boolean(debouncedSearch.trim() || category);

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="border-b border-gray-200 bg-gold-50/50 py-14 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                    RG Restaurant
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Our Menu</h1>
                <p className="mx-auto mt-3 max-w-xl px-4 text-sm text-gray-500">
                    A selection of what we serve. Ask your server about daily specials.
                </p>
            </div>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-6 space-y-4">
                    <div className="mx-auto flex max-w-xl">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search dishes..."
                        />
                    </div>

                    {categories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:justify-center">
                            <button onClick={() => setCategory("")} className={chipClass(!category)}>
                                All
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={chipClass(category === cat.id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <FoodCardSkeleton count={6} />
                ) : error ? (
                    <div className="mx-auto max-w-md">
                        <AlertBanner message={error} />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={UtensilsCrossed}
                        title={hasFilters ? "No dishes match your search" : "Menu coming soon"}
                        message={
                            hasFilters
                                ? "Try a different name or category."
                                : "Our menu is being updated. Please check back shortly."
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <FoodCard key={item._id} item={item} />
                        ))}
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
};

export default MenuPage;