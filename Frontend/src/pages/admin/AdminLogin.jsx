import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import useAdminAuth from "../../hooks/useAdminAuth.js";
import useEmployeeAuth from "../../hooks/useEmployeeAuth.js";
import { ROUTES } from "../../utils/routes.js";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAdminAuth();
  const { logout: employeeLogout } = useEmployeeAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;
  const redirectTo =
    from && from.startsWith(ROUTES.ADMIN.ROOT) && from !== ROUTES.ADMIN.LOGIN
      ? from
      : ROUTES.ADMIN.DASHBOARD;

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);
    const result = await login(formData.email.trim(), formData.password);
    setSubmitting(false);

    if (result.success) {
      employeeLogout(); // never keep two sessions alive at once
      navigate(redirectTo, { replace: true });
    } else {
      setServerError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Link to={ROUTES.HOME} className="mb-4 inline-block text-xs font-medium text-gray-500 hover:text-gray-700">
          ← Back to Home
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 text-xl font-bold text-charcoal-950">
              R
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to manage your restaurant
            </p>
          </div>

          {serverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="admin@restaurant.com"
                autoComplete="username"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Staff member?{" "}
            <Link to={ROUTES.LOGIN} className="font-medium text-gold-600 hover:underline">
              Staff login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;