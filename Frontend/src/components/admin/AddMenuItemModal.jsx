import { useState, useEffect, useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import { addMenuItem } from "../../services/menu.service.js";
import { getCategories } from "../../services/category.service.js";
import { extractErrorMessage } from "../../services/api.js";

// Must match the backend fileFilter in middleware/uploadMiddleware.js.
// There is intentionally NO file-size check here: the app doesn't limit image size.
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const AddMenuItemModal = ({ onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    type: "VEG",
    isActive: true,
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCategories({ status: "ACTIVE" })
      .then((result) => setCategories(result.data.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Only JPG, PNG or WEBP images are allowed" }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: "" }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.price || Number(formData.price) < 0)
      newErrors.price = "Enter a valid price";
    if (!formData.category) newErrors.category = "Category is required";
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      fd.append("description", formData.description.trim());
      fd.append("price", Number(formData.price));
      fd.append("category", formData.category);
      fd.append("type", formData.type);
      fd.append("isActive", formData.isActive);
      fd.append("isAvailable", formData.isAvailable);
      if (imageFile) fd.append("image", imageFile);

      await addMenuItem(fd);
      onSuccess();
    } catch (error) {
      setServerError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Menu Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X size={20} />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {categories.length === 0 && (
          <div className="mb-4 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-gold-700">
            No active categories found. Add a category first.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Food Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <ImagePlus size={22} />
                  <span className="text-xs">Click to upload image</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Food Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="e.g. Paneer Tikka"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="Grilled paneer with Indian spices"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Price (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder="249"
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">Select</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Food Type
            </label>
            <div className="flex gap-2">
              {[
                { value: "VEG", label: "Veg" },
                { value: "NON_VEG", label: "Non-Veg" },
                { value: "EGG", label: "Egg" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setFormData((prev) => ({ ...prev, type: opt.value }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${formData.type === opt.value
                    ? "border-gold-500 bg-gold-50 text-gold-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              Available
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (imageFile ? "Uploading..." : "Saving...") : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMenuItemModal;