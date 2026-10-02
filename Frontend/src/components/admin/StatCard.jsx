const StatCard = ({ label, value, icon: Icon, accent = false }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-colors hover:border-gold-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {Icon && (
          <div
            className={`rounded-lg p-2 ${
              accent ? "bg-gold-50 text-gold-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};

export default StatCard;
