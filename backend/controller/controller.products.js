const Product = require("../modules/module.products");
const User = require("../modules/module.user");

// Add Product — stores userId & updates user’s product list
exports.addProduct = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !price)
      return res.status(400).json({ error: "Product name and price required" });

    // Find the logged-in user from JWT
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Create product linked to this user
    const newProduct = new Product({
      name,
      price,
      category,
      user: user._id
    });
    await newProduct.save();

    // Add product ID to user’s list
    user.products.push(newProduct._id);
    await user.save();

    res.json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ error: "Error adding product" });
  }
};

// Get all products with user info
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("user", "username");
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch products" });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("user", "username");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: "Invalid product ID" });
  }
};

// Delete product and remove reference from user
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Verify ownership (optional)
    if (product.user.toString() !== req.user.id)
      return res.status(403).json({ error: "You can only delete your own products" });

    // Remove product reference from user
    await User.findByIdAndUpdate(product.user, { $pull: { products: product._id } });

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete product" });
  }
};
