import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-5xl font-bold text-gold-600">404</h1>
      <p className="mt-3 text-sm text-gray-500">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-950"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
