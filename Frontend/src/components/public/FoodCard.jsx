import { UtensilsCrossed } from "lucide-react";
import { resolveMenuImage } from "../../services/menu.service.js";

const TYPE_LABEL = {
    VEG: { label: "Veg", className: "bg-green-50 text-green-700" },
    NON_VEG: { label: "Non-Veg", className: "bg-red-50 text-red-700" },
    EGG: { label: "Egg", className: "bg-amber-50 text-amber-700" },
};

const FoodCard = ({ item }) => {
    const typeInfo = TYPE_LABEL[item.type] || TYPE_LABEL.VEG;
    const imageSrc = resolveMenuImage(item.imageUrl);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card transition-shadow hover:shadow-md">
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={item.name}
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                    }}
                />
            ) : null}
            <div
                className="flex h-44 w-full items-center justify-center bg-gray-100 text-gray-400"
                style={{ display: imageSrc ? "none" : "flex" }}
            >
                <UtensilsCrossed size={28} />
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="shrink-0 font-semibold text-gold-600">₹{item.price}</p>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeInfo.className}`}>
                        {typeInfo.label}
                    </span>
                    {item.category?.name && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {item.category.name}
                        </span>
                    )}
                    {item.isAvailable === false && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            Currently unavailable
                        </span>
                    )}
                </div>

                {item.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-gray-500">{item.description}</p>
                )}
            </div>
        </div>
    );
};

export default FoodCard;
