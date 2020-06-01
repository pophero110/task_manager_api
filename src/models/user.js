const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error("Age must be a positive number");
      }
    },
  },
  email: {
    type: String,
    required: true,
    unique:true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error('password can not contain phase of "password"');
      }
    },
  },
  tokens: [{
    token: {
      type:String,
      required: true
    }
  }],
  avatar: {
    type:Buffer
  }
}, {

  timestamps:true

});

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});



//hide user sentitive data (password, token)
userSchema.methods.toJSON = function() {
  const user = this
  const userObj = user.toObject()
  
  delete userObj.password
  delete userObj.tokens
  delete userObj.avatar
  return userObj
}

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = await jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET
  );

  user.tokens = user.tokens.concat({ token })
  user.save()
  return token;
};

//add new method to User model that login a user by email and password
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("unable to login in");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login in");
  }

  return user;
}; 

//hash password before collection.save() event
userSchema.pre('save', async function(next) {
  const user = this
  //only hash the password when the password is modified or created
  //isModified provided by Mongoose
  if(user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  next()
})

//Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
  const user = this
  await Task.deleteMany({owner: user._id})
  next()
})
const User = mongoose.model("User",userSchema);

module.exports = User
