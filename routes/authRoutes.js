const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const { register, login, user, updateProfile } = require('../controllers/authController');
const passport = require("passport");

router.post('/register', upload.single('profilePicture'),  register);
router.post('/login',  login);
router.post('/user', user);
router.put('/update-profile/:id', upload.single('profilePicture'), updateProfile);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.redirect(`yourapp://login-success?token=${req.user.token}`);
  }
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    res.redirect(`yourapp://login-success?token=${req.user.token}`);
  }
);

module.exports = router;
