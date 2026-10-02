import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import HomeSearch from "./HomeSearch.jsx";

const Hero = () => {
    return (
        <section className="bg-gradient-to-b from-gold-50/60 to-white">
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
                <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700">
                        <Star size={12} className="fill-gold-500 text-gold-500" />
                        Loved by our regulars
                    </div>

                    <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
                        Great food, <span className="text-gold-600">warm hospitality</span>,
                        every single visit.
                    </h1>

                    <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600">
                        RG Restaurant brings together fresh ingredients, bold flavours and a
                        welcoming space — whether you're dropping in for a quick bite or
                        settling in for a full evening with friends and family.
                    </p>

                    <div className="mt-8 max-w-lg">
                        <HomeSearch />
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/menu"
                            className="flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90"
                        >
                            View Our Menu
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            to="/contact"
                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                        >
                            Visit Us
                        </Link>
                    </div>
                </div>

                <div className="relative">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-card">
                        <img
                            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                            alt="A beautifully plated dish at RG Restaurant"
                            className="h-72 w-full object-cover sm:h-96"
                            onError={(e) => {
                                e.target.style.display = "none";
                            }}
                        />
                    </div>
                    <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-card sm:block">
                        <p className="text-2xl font-bold text-gold-600">4.8/5</p>
                        <p className="text-xs text-gray-500">Average guest rating</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;