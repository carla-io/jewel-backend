const Product = require ('../models/product');
const cloudinary = require('cloudinary').v2;


exports.newProduct = async (req, res, next) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Uploaded Files:", req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded" });
        }

        let imagesLinks = [];

        // Function to upload image buffer to Cloudinary
        const uploadImage = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "products", width: 150, crop: "scale" },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Upload Error:", error);
                            reject(error);
                        } else {
                            resolve({
                                public_id: result.public_id,
                                url: result.secure_url,
                            });
                        }
                    }
                );
                uploadStream.end(fileBuffer); // Send buffer to Cloudinary
            });
        };

        // Upload all images
        for (let file of req.files) {
            try {
                const uploadedImage = await uploadImage(file.buffer);
                imagesLinks.push(uploadedImage);
            } catch (error) {
                console.log(error);
            }
        }

        req.body.images = imagesLinks;
        // req.body.user = req.user.id;

        const product = await Product.create(req.body);

        if (!product) {
            return res.status(400).json({ success: false, message: "Product not created" });
        }

        return res.status(201).json({ success: true, product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getProducts = async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.find();

        // Check if products exist
        if (!products || products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found",
            });
        }

        // Ensure correct image retrieval
        const productsWithImages = products.map(product => {
            return {
                ...product.toObject(),
                image: product.images.length > 0 ? product.images[0].url : null, // ✅ Correctly gets the first image URL
            };
        });

        return res.status(200).json({
            success: true,
            products: productsWithImages,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.getSingleProduct = async (req, res, next) => {
    try {
        console.log("Request params:", req.params);
        console.log("Product ID:", req.params.id);
        
        // Find the product by ID from the request parameters
        const product = await Product.findById(req.params.id);

        // Check if the product exists
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Return the found product
        return res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.updateProduct = async (req, res, next) => {
    try {
        console.log("🔹 [START] Updating product...");

        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        console.log("✅ Product found:", product._id);

        // ✅ Keep existing images
        let updatedImages = [];
        if (req.body.existingImages) {
            updatedImages = Object.values(req.body.existingImages).map(img => ({
                public_id: img.public_id,
                url: img.url,
            }));
        }

        // ✅ Upload new images
        if (req.files && req.files.length > 0) {
            console.log(`📤 Uploading ${req.files.length} new images...`);

            const uploadImage = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: "products", width: 150, crop: "scale" },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve({ public_id: result.public_id, url: result.secure_url });
                        }
                    );
                    uploadStream.end(fileBuffer);
                });
            };

            const imageFiles = req.files;

            for (let file of imageFiles) {
                const uploadedImage = await uploadImage(file.buffer);
                updatedImages.push(uploadedImage);
            }
        }

        // ✅ Update product with new & existing images
        product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, images: updatedImages },
            { new: true, runValidators: true, useFindAndModify: false }
        );

        console.log("✅ Product updated successfully:", product._id);
        return res.status(200).json({ success: true, product });

    } catch (error) {
        console.error("❌ Error updating product:", error);
        return res.status(500).json({ success: false, message: "Server error while updating product" });
    }
};






exports.deleteProduct = async (req, res, next) => {
    try {
        // Step 1: Find the product by ID
        const product = await Product.findById(req.params.id);

        // Step 2: If product is not found, return 404 error
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Step 3: Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            for (let i = 0; i < product.images.length; i++) {
                await cloudinary.uploader.destroy(product.images[i].public_id);
            }
        }

        // Step 4: Delete the product from the database
        await Product.findByIdAndDelete(req.params.id);

        // Step 5: Return success response
        return res.status(200).json({
            success: true,
            message: 'Product and associated images deleted successfully',
        });
        
    } catch (error) {
        // Handle any errors that occur
        console.error("Error deleting product:", error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error, could not delete product',
        });
    }
};


exports.getFilteredProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice } = req.query;
        let query = {};

        console.log("🔍 Received query params:", req.query);

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by category
        if (category && category !== "All") {
            query.category = category;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        console.log("🔍 Constructed Query:", query);

        // Fetch products from MongoDB
        const products = await Product.find(query);

        console.log("✅ Found Products:", products.length);

        return res.status(200).json(products);
    } catch (error) {
        console.error("❌ Error fetching filtered products:", error.message);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};






