// Temporary frontend-only preview data for the public website.
// Replace with a real public GET /api/menu/public (active + available items)
// endpoint once one exists — the shape (name, description, price, image,
// category) is designed to match the existing MenuItem model so the swap
// is a drop-in replacement.

const publicMenuData = [
  {
    id: "preview-1",
    name: "Wood-Fired Margherita Pizza",
    description:
      "San Marzano tomatoes, fresh mozzarella, basil, extra virgin olive oil.",
    price: 349,
    category: "Pizza",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "preview-2",
    name: "Classic Smash Burger",
    description:
      "Double smashed patty, aged cheddar, house sauce, brioche bun.",
    price: 299,
    category: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "preview-3",
    name: "Creamy Alfredo Pasta",
    description: "Fettuccine tossed in a rich parmesan cream sauce with herbs.",
    price: 279,
    category: "Main Course",
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "preview-4",
    name: "Garden Fresh Salad",
    description: "Seasonal greens, cherry tomatoes, feta, citrus vinaigrette.",
    price: 199,
    category: "Starters",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "preview-5",
    name: "Grilled Sirloin Steak",
    description: "8oz sirloin, herb butter, roasted vegetables, red wine jus.",
    price: 649,
    category: "Main Course",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "preview-6",
    name: "Molten Chocolate Cake",
    description:
      "Warm chocolate cake with a gooey center, vanilla bean ice cream.",
    price: 179,
    category: "Desserts",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=700&q=80",
  },
];

export default publicMenuData;
