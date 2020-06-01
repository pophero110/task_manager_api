const express = require("express");
const router = express.Router();
const User = require("../models/user");
const mongoose = require("mongoose");
const auth = require('../middleware/auth')
const sharp = require('sharp')
const multer = require('multer')
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");
const upload = multer({
  // dest: "images",
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error("File must be a jpg|jpeg|png"));
    }
    callback(undefined, true);
    // callback(new Error('File must be a PDF'))
    // cb(undefined, true)
    // cb(undefined, false)
  },
});
//login
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken() 
    res.send({user, token})
  } catch (error) {
    res.status(400).send(error.message);
  }
});
//logout
router.post('/users/logout', auth, async (req, res) => {
    try {
      req.user.tokens = req.user.tokens.filter((element) => {
        return element.token !== req.token;
      });
      await req.user.save()

      res.send(req.user)
    } catch(error) {
      res.status(500).send()
    }
})
//logout all
router.post('/users/logoutAll', auth, async (req,res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    
    res.send(req.user)
  } catch(error) {
    res.status(500).send()
  }
})
//Create&signup
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()

    res.status(201).send({user, token});
  } catch (error) {
    res.status(400).send({error: error.message});
  }
});

//Read
//read profile
router.get("/users/me", auth ,async (req, res) => {
   res.send(req.user)
});

//Update
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowdUpdated = ["name", "password", "age"];
  const isValidUpdate = updates.every((update) =>
    allowdUpdated.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid user updates" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user)
  } catch (error) {
    res.status(500).send();
  }
});

//upload user avatar
router.post('/users/me/avatar',auth,  upload.single('avatar') ,async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({width:250, height: 250}).png().toBuffer()  
  req.user.avatar = buffer
  await req.user.save()
  res.send(req.user)
}, (error, req, res, next) => {
  res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar',auth ,async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  
  res.send(req.user)
})

router.get('/users/:id/avatar' , async (req,res) => {
  try {
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar) {
        throw new Error()
    }

    res.set('Content-Type','image/png')
    res.send(user.avatar)
  } catch(error) {
    res.status(404).send()
  }
})

module.exports = router;
