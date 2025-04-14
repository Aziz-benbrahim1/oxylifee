const mongoose = require('mongoose');
const Home = require('../models/home');

// Connexion une fois au lieu de à chaque requête
mongoose.connect('mongodb://localhost:27017/respirateur')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

exports.getallhomes = async (req, res) => {
  try {
    const homes = await Home.find({});
    res.render("server.ejs", { homes: homes });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
};



exports.getHomeById = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);
    if (!home) {
      return res.status(404).send("Home not found");
    }
    
    // Vérification des données
    console.log('Home trouvé:', {
      _id: home._id,
      name: home.name,
      startdate: home.startdate,
      enddate: home.enddate,
      chargelevel: home.chargelevel
    });
    res.render('details', { home: home });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
};


exports.updateBatteryLevel = async (req, res) => {
  try {
    const updatedHome = await Home.findByIdAndUpdate(
      req.params.id,
      { 
        batteryLevel: req.body.level,
        lastUpdate: new Date() 
      },
      { new: true }
    );


     // Vérifier et créer une alerte si nécessaire
     if (req.body.level < 20) {
      const home = await Home.findById(req.params.id);
      if (!home.alerts.some(a => a.level === 'critical' && !a.read)) {
        await Home.findByIdAndUpdate(
          req.params.id,
          {
            $push: {
              alerts: {
                message: `Niveau de batterie critique (${req.body.level}%)`,
                level: 'critical'
              }
            }
          }
        );
      }
    }



    res.json(updatedHome);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getBatteryLevel = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);
    res.json({
      batteryLevel: home.batteryLevel,
      lastUpdate: home.lastUpdate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controllers/home.js
const { emitNewAlert } = require('../services/socket');



exports.checkBatteryAndCreateAlert = async (homeId, batteryLevel) => {
  try {
    const home = await Home.findById(homeId);
    if (!home) return;

    // Vérifier si le niveau est critique et s'il n'y a pas déjà une alerte non lue
    if (batteryLevel < 20 && !home.alerts.some(a => a.level === 'critical' && !a.read)) {
      const alertMessage = `Niveau de batterie critique (${batteryLevel}%) pour ${home.name}`;


      
      
      const updatedHome = await Home.findByIdAndUpdate(homeId, {
        $push: {
          alerts: {
            message: alertMessage,
            level: 'critical'
          }
        }
      }, { new: true });
      
      // Récupérer la dernière alerte ajoutée
      const newAlert = updatedHome.alerts[updatedHome.alerts.length - 1];
      
      // Émettre l'alerte via WebSocket
      emitNewAlert(homeId, home.name, newAlert);
    }
  } catch (err) {
    console.error('Erreur lors de la création de l\'alerte:', err);
  }
};

exports.getActiveAlerts = async (req, res) => {
  try {
    const homesWithAlerts = await Home.find({
      'alerts.read': false
    }).select('name alerts');
    
    res.json(homesWithAlerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAlertAsRead = async (req, res) => {
  try {
    await Home.updateOne(
      { _id: req.params.homeId, 'alerts._id': req.params.alertId },
      { $set: { 'alerts.$.read': true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};