// Live (debounced) search sends partial input on every pause. Characters like
// "(" or "[" would make MongoDB reject the $regex with a 500. Escape them once,
// here, so every existing controller's search keeps working unchanged.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const sanitizeSearchQuery = (req, res, next) => {
  for (const key of ["search", "q"]) {
    const value = req.query[key];
    if (typeof value === "string") {
      req.query[key] = escapeRegex(value.trim().slice(0, 100));
    } else if (value !== undefined) {
      delete req.query[key];
    }
  }
  next();
};
