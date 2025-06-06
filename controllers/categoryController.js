const Category = require('../models/categorymodel');
const fs = require("fs");
const path = require("path");
// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description} = req.body;
    console.log(name, description);
    console.log(req.files)

    if (!req.files || !req.files.icon) {
        return res.status(400).json({
          success: false,
          message: "Image not found",
        });
      }
      const {icon}=req.files;
      console.log(icon)
      const iconPath=`icon-${Date.now()}-${icon.name}`;
      console.log(iconPath);
      const imageUploadPath = path.join(
        __dirname,
        `../public/icon/${iconPath}`
      );  
        const directoryPath = path.join(__dirname, "../public/icon");
        if (!fs.existsSync(directoryPath)) {
          fs.mkdirSync(directoryPath, { recursive: true });
        }
    
    await icon.mv(imageUploadPath);
    const category = new Category({
      name: name,
      description: description,
      icon: iconPath,
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
    console.error(error)
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a specific category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a category by ID
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a category by ID
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
