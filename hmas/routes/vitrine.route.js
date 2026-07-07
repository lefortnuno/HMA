const router = require("express").Router();
const ctrl   = require("../controllers/vitrine.controller");
const admin  = require("../middlewares/admin.middleware");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// ── Public ────────────────────────────────────────────────────
router.get("/biens",     ctrl.getAllBiens);
router.get("/biens/:id", ctrl.getBienById);

// ── Upload photo (admin) ──────────────────────────────────────
router.post("/upload", admin.checkUtilisateur, upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ── Admin CRUD ────────────────────────────────────────────────
router.post("/biens",       admin.checkUtilisateur, ctrl.createBien);
router.put("/biens/:id",    admin.checkUtilisateur, ctrl.updateBien);
router.delete("/biens/:id", admin.checkUtilisateur, ctrl.deleteBien);

module.exports = router;
