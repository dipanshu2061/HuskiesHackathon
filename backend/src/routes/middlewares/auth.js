import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  console.log("token is: ", token)
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // 👈 now available in all protected routes
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
