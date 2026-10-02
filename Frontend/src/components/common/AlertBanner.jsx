const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
};

const AlertBanner = ({ type = "error", message }) => {
    if (!message) return null;
    return (
        <div
            role={type === "error" ? "alert" : "status"}
            className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}
        >
            {message}
        </div>
    );
};

export default AlertBanner;