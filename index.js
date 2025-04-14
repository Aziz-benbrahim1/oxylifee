const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const http = require('http');

const fs = require('fs');

const User = require('./models/user'); // Plus bas


// 1. Initialiser Express en premier
const app = express();

// 2. Configurer fileUpload APRÈS avoir créé l'application
app.use(fileUpload());



// 3. Autres middlewares
app.use(express.static(path.join(__dirname, 'assets')));
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.urlencoded({ extended: true }));

// 4. Connexion MongoDB (options dépréciées supprimées)
mongoose.connect('mongodb://localhost:27017/respirateur')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// 5. Configuration session
require('dotenv').config();
const Store = new MongoDbStore({
  uri: 'mongodb://localhost:27017/respirateur', // Utilisez directement l'URL
  collection: 'sessions'
});
app.use(session({
    secret: process.env.SESSION_SECRET || 'votre_secret_par_defaut',
    store: Store,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 // 1 jour
    }
  }));
  
  // 6. WebSocket
  const setupWebSocket = require('./services/socket');
  const server = http.createServer(app);
  setupWebSocket(server);
  
  // 7. Import des routeurs
  const homeRouter = require('./routers/home.js');
  const routerAuth = require('./routers/auth.route');
  
  // 8. Import du modèle Home
  const Home = require('./models/home');


   // 9. Routes
app.use('/', homeRouter);
app.use('/', routerAuth);

// Route pour ajouter une carte
app.post('/add-card', async (req, res) => {
  try {
    let imageName = 'default.jpg';
    if (req.files?.image) {
      const image = req.files.image;
      imageName = Date.now() + '_' + image.name;
      await image.mv(path.join(__dirname, 'uploads', imageName));
    }


    const newHome = new Home({
        name: req.body.name,
        images: imageName,
        chargelevel: '100%',
        batteryLevel: 100
      });
  
      await newHome.save();
      res.redirect('/parametres&profil');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de l\'ajout de la carte');
    }
  });



   // Route pour supprimer une carte
app.post('/delete-card/:id', async (req, res) => {
    try {
      await Home.findByIdAndDelete(req.params.id);
      res.redirect('/parametres&profil');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de la suppression de la carte');
    }
  });
  
  // Autres routes
  app.get('/details', (req, res) => res.render('details'));
  app.get('/statistiques&historiques', (req, res) => res.render('statistiques&historiques'));
  app.get('/about', (req, res) => res.render('about'));
  



  const { isAuthenticated } = require('./middlewares/auth');




  app.get('/parametres&profil', isAuthenticated, async (req, res) => {
    try {

        // Vérifiez que l'utilisateur est bien connecté
    if (!req.session.user || !req.session.user._id) {
        return res.redirect('/login');
      }

       


      const homes = await Home.find({});
      const user = await User.findById(req.session.user._id); // Récupérez les données utilisateur

      if (!user) {
        return res.redirect('/login');
      }
      
      res.render('parametres&profil', { 
        homes,
        user: user || req.session.user // Utilisez les données fraîches ou celles de la session
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur serveur');
    }
  });
  
  app.get('/login', (req, res) => res.render('login'));
  app.get('/signup', (req, res) => res.render('signup'));





  
// ...

// Route pour mettre à jour le profil
app.post('/update-profile', isAuthenticated, async (req, res) => {
    try {
        // 1. Vérification de la session
        if (!req.session.user?._id) {
            console.log('Aucun user dans la session');
            return res.redirect('/login');
        }

        const userId = req.session.user._id;
        console.log('Mise à jour du user ID:', userId);

        // 2. Préparation des données
        const updateData = {
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            phone: req.body.phone,
            specialite: req.body.specialite,
            country: req.body.country
        };

        // 3. Gestion de l'image
        if (req.files?.profileImage) {
            const profileImage = req.files.profileImage;
            const imageName = Date.now() + '_' + profileImage.name;
            const uploadPath = path.join(__dirname, 'uploads', imageName);
            
            if (req.session.user.profileImage && req.session.user.profileImage !== 'default-profile.jpg') {
                const oldImagePath = path.join(__dirname, 'uploads', req.session.user.profileImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            await profileImage.mv(uploadPath);
            updateData.profileImage = imageName;
        }

        // 4. Mise à jour dans la base
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true }
        );

        if (!updatedUser) {
            throw new Error('User non trouvé');
        }

        // 5. Mise à jour de la session
        req.session.user = updatedUser;
        req.session.save(err => {
            if (err) {
                console.error('Erreur session:', err);
                return res.status(500).send('Erreur session');
            }
            res.redirect('/parametres&profil');
        });

    } catch (err) {
        console.error('Erreur complète:', err);
        res.status(500).send('Erreur lors de la mise à jour du profil');
    }
});







// Routes pour les alertes
app.get('/alerts', async (req, res) => {
    try {
      const homesWithAlerts = await Home.aggregate([
        { $unwind: '$alerts' },
        { $match: { 'alerts.read': false } },
        { $project: {
          deviceName: '$name',
          homeId: '$_id',
          alert: '$alerts',
          _id: 0
        }}
      ]);
      
      res.render('alertes&notifications', { 
        alerts: homesWithAlerts.map(item => ({
          ...item.alert,
          homeId: item.homeId.toString(),
          deviceName: item.deviceName
        }))
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur serveur');
    }
  });
  
  app.post('/alerts/:homeId/:alertId/read', async (req, res) => {
    try {
      await Home.updateOne(
        { _id: req.params.homeId, 'alerts._id': req.params.alertId },
        { $set: { 'alerts.$.read': true } }
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });




  app.get('/alertes&notifications', isAuthenticated, async (req, res) => {
    try {
        // Récupérer toutes les cartes avec batterie < 20%
    const criticalDevices = await Home.find({
        batteryLevel: { $lt: 20 }
      });
  
      // Récupérer les alertes non lues
      const homesWithAlerts = await Home.aggregate([
        { $unwind: '$alerts' },
        { $match: { 'alerts.read': false } },
        { $project: {
          deviceName: '$name',
          homeId: '$_id',
          alert: '$alerts',
          _id: 0
        }}
      ]);

       // Combiner les alertes et les appareils critiques
    const allAlerts = [
        ...homesWithAlerts.map(item => ({
          ...item.alert,
          homeId: item.homeId.toString(),
          deviceName: item.deviceName,
          type: 'alert'
        })),
        ...criticalDevices.map(device => ({
          message: `Niveau de batterie critique (${device.batteryLevel}%)`,
          level: 'critical',
          homeId: device._id.toString(),
          deviceName: device.name,
          type: 'battery',
          timestamp: new Date()
        }))
      ];
      
      res.render('alertes&notifications', { 
        alerts: allAlerts,
        user: req.session.user
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur serveur');
    }
  });


  // Dans une route temporaire pour tester
app.get('/test-alert', async (req, res) => {
    try {
      const home = await Home.findOne({});
      if (home) {
        await Home.updateOne(
          { _id: home._id },
          { $push: { 
            alerts: {
              message: "Test alerte batterie faible (15%)",
              level: "critical"
            }
          }}
        );
        res.send("Alerte de test créée");
      } else {
        res.send("Aucun appareil trouvé pour créer une alerte de test");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur serveur');
    }
  });












   // Démarrer le serveur
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))



  