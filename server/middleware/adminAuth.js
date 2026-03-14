const { signTokenPayload } = require("../controllers/adminController");

function parseToken(token) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signTokenPayload(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (decodedPayload.exp < Date.now()) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    return null;
  }
}

module.exports = function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Admin authorization required" });
  }

  const payload = parseToken(token);

  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }

  req.admin = payload;
  next();
};
