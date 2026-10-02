import api from "./api.js";

// PUBLIC — no auth required. Used by the Home page, public Menu page,
// and the Employee dashboard's read-only menu view.
export const getPublicMenu = async (params = {}) => {
  const response = await api.get("/menu/public", { params });
  return response.data;
};

// PUBLIC — Home page search panel. `signal` lets the caller cancel stale requests.
export const searchPublicMenu = async (query, { signal, limit = 8 } = {}) => {
  const response = await api.get("/menu/public/search", {
    params: { q: query, limit },
    signal,
  });
  return response.data;
};

// PUBLIC — single item for the /menu/:id details page.
export const getPublicMenuItem = async (id) => {
  const response = await api.get(`/menu/public/${encodeURIComponent(id)}`);
  return response.data;
};

// AUTHENTICATED read — admin/employee token both accepted by the backend.
export const getMenuItems = async (params = {}) => {
  const response = await api.get("/menu", { params });
  return response.data;
};

// Safety net only. The backend always answers within ~65s (its own Cloudinary
// deadline), so this never fires on a healthy server. It exists so the UI can
// never spin forever if the backend itself is dead. It is deliberately longer
// than the backend's worst case so the client never gives up while the server
// is still about to save the item.
const UPLOAD_REQUEST_TIMEOUT_MS = 140000;

// `payload` is a FormData instance (see AddMenuItemModal) so an actual
// image file can be attached. We explicitly clear the default JSON
// Content-Type so the browser sets the correct multipart boundary itself.
export const addMenuItem = async (payload) => {
  const response = await api.post("/menu", payload, {
    headers: { "Content-Type": undefined },
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
  });
  return response.data;
};

export const updateMenuItem = async (id, payload) => {
  const response = await api.put(`/menu/${id}`, payload, {
    headers: { "Content-Type": undefined },
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
  });
  return response.data;
};

export const updateMenuItemStatus = async (id, isActive) => {
  const response = await api.patch(`/menu/${id}/status`, { isActive });
  return response.data;
};

export const updateMenuItemAvailability = async (id, isAvailable) => {
  const response = await api.patch(`/menu/${id}/availability`, { isAvailable });
  return response.data;
};

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  return response.data;
};

// Delivery-time optimisation for Cloudinary images ONLY. The stored URL in
// MongoDB is untouched; we just ask Cloudinary to serve a right-sized, modern
// format copy (WebP/AVIF, auto quality, max 1200px wide) so large originals
// don't slow down the Home/Menu pages. This does not limit what can be
// uploaded. Set to "" to serve the original file as-is.
const CLOUDINARY_DELIVERY_TRANSFORM = "f_auto,q_auto,c_limit,w_1200";

const optimizeCloudinaryUrl = (url) => {
  if (!CLOUDINARY_DELIVERY_TRANSFORM || !url.includes("res.cloudinary.com")) {
    return url;
  }
  // Only rewrite plain URLs (…/image/upload/v123/…); leave any URL that
  // already carries transformations alone.
  return url.replace(
    /\/image\/upload\/(v\d+\/)/,
    `/image/upload/${CLOUDINARY_DELIVERY_TRANSFORM}/$1`,
  );
};

// New images are Cloudinary URLs (absolute, used as-is). Older items may still
// hold a relative /uploads/... path served by the backend; build an absolute
// URL for those.
export const resolveMenuImage = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return optimizeCloudinaryUrl(imageUrl);
  const base = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");
  return `${base}${imageUrl}`;
};
