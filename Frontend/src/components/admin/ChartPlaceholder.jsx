const ChartPlaceholder = ({ title, height = "h-64" }) => {
  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-5 shadow-card">
      <p className="mb-4 text-sm font-semibold text-white">{title}</p>
      <div
        className={`flex ${height} items-center justify-center rounded-lg border border-dashed border-charcoal-700 bg-charcoal-850`}
      >
        <p className="text-xs text-gray-600">
          Chart data will appear here once connected
        </p>
      </div>
    </div>
  );
};

export default ChartPlaceholder;
