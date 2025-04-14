const express = require('express');
const router = express.Router();
const Home = require('../models/home'); // Assurez-vous d'avoir ce modèle



// Route pour afficher les détails d'un appareil spécifique
router.get('/homes/:id', async (req, res) => {
    try {
        const home = await Home.findById(req.params.id);
        if (!home) {
            return res.status(404).send('Appareil non trouvé');
        }
        res.render('details', { home });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

router.get('/', async (req, res) => {
    console.log("Session dans /:", req.session.user); // Debug
    
    if (!req.session.user) {
        console.log("Non connecté, redirection vers login");
        return res.redirect('/login');
    }

    try {
        const homes = await Home.find({});
        console.log("Nombre de cartes trouvées:", homes.length); // Debug
        
        res.render('home', {
            homes: homes,
            user: req.session.user
        });
    } catch (err) {
        console.error("Erreur chargement home:", err);
        res.status(500).send('Erreur serveur');
    }
});





module.exports = router;