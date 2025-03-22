const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const { newProduct, 
    getProducts, 
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getFilteredProducts } = require('../controllers/productController')

router.post('/new',  upload.array('images', 10), newProduct);
router.get('/get', getProducts);
router.get('/search', getFilteredProducts);
router.get('/:id', getSingleProduct);
router.put('/update/:id', upload.array('newImages', 10), updateProduct);
router.delete('/delete/:id', deleteProduct);



module.exports = router;    