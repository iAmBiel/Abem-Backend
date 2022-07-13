const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  socialname: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  address: {
    type: String,
    required: true
  },
  cityandstate: {
    type: String,
    required: true
  },
  cellphone: {
    type: Number,
    required: true
  },
  birthdate: {
    type: String,
    required: true
  },
  mothername: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  cpf: {
    type: Number,
    required: true
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;