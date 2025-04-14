const mongoose = require('mongoose');

const schemaHome = new mongoose.Schema({
  name: String,
  images: String,
  chargelevel: String,
  batteryLevel: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100 
  },
  lastUpdate: { 
    type: Date, 
    default: Date.now 
  },
  alerts: [{
    message: String,
    level: String, // 'low', 'critical', etc.
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }]
});

module.exports = mongoose.model('Home', schemaHome);



