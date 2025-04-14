const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  email: { type: String, unique: true },
  phone: String,
  specialite: String,
  country: String,
  profileImage: { type: String, default: 'default-profile.jpg' }
});

module.exports = mongoose.model('User', userSchema);