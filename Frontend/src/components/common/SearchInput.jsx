import { Search, X } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Search...", className = "" }) => (
    <div className={`relative flex-1 ${className}`}>
        <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        {value && (
            <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
            >
                <X size={14} />
            </button>
        )}
    </div>
);

export default SearchInput;