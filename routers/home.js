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
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        // Récupérez les données depuis MongoDB
        const homes = await Home.find({}); // Ou toute autre requête nécessaire
        
        // Passez les données à la vue
        res.render('home', { 
            homes: homes,
            user: req.session.user // Si vous avez besoin des infos utilisateur
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});





module.exports = router;