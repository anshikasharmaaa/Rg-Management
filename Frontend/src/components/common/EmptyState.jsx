const EmptyState = ({ icon: Icon, title, message }) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <Icon size={24} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
    </div>
);

export default EmptyState;