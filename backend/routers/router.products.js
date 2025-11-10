const express = require("express");
const {
  addProduct,
  getProducts,
  getProductById,
  deleteProduct
} = require("../controller/controller.products");

const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/add", verifyToken, addProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;
