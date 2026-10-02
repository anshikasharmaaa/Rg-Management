import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

// Image with a clean fallback if the URL is empty or fails to load.
const SafeImage = ({ src, alt, className = "", iconSize = 24, Icon = BookOpen }) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (!src || failed) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
            >
                <Icon size={iconSize} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className={className}
        />
    );
};

export default SafeImage;