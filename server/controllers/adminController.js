const crypto = require("crypto");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "civictrack-admin-secret";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function signTokenPayload(payload) {
  return crypto
    .createHmac("sha256", ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
}

function createAdminToken(username) {
  const payload = JSON.stringify({
    username,
    role: "admin",
    exp: Date.now() + TOKEN_TTL_MS,
  });

  const encodedPayload = encodeBase64Url(payload);
  const signature = signTokenPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

exports.createAdminToken = createAdminToken;
exports.signTokenPayload = signTokenPayload;

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  const token = createAdminToken(username);

  res.json({
    token,
    admin: {
      username,
      role: "admin",
    },
  });
};
