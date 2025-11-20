const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const pc = require("../controllers/productController");

router.get("/", auth, pc.listProducts);
router.get("/:id", auth, pc.getProduct);

router.post("/", auth, upload.array("images", 10), pc.addProduct);

router.put("/:id/approval", auth, pc.updateApproval);
router.put("/:id", auth, pc.updateProduct);
router.put("/:id/visible", auth, pc.toggleVisible);

router.delete("/:id", auth, pc.deleteProduct);

module.exports = router;
