export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
    data: {},
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  // If a response has already started, Express must handle it.
  if (res.headersSent) return next(err);

  const statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // 4xx messages are meant for the client. 5xx messages can contain internals,
  // so in production they are replaced with a generic one.
  const hideDetails =
    statusCode >= 500 && process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: hideDetails
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
    data: {},
  });
};
