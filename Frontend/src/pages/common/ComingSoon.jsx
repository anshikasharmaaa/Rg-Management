import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const ComingSoon = () => {
  const location = useLocation();
  const moduleName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    .replace(/-/g, " ");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-charcoal-700 bg-charcoal-900 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-400">
        <Construction size={24} />
      </div>
      <h2 className="text-lg font-semibold capitalize text-white">
        {moduleName}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        This module is coming soon. We'll build it out in an upcoming phase.
      </p>
    </div>
  );
};

export default ComingSoon;
