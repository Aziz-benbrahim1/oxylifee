const authModel = require('../models/auth.model');
const User = require('../models/user');

exports.getSignupPage = (req, res) => {
    res.render('signup');
};

exports.postSignupData = async (req, res) => {
    try {
        await authModel.signupFunctionModel(
            req.body.name,
            req.body.email,
            req.body.password,
            req.body.numerodetelephone,
            req.body.specialite
        );
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        // Renvoyer vers la page d'inscription avec le message d'erreur
        res.render('signup', { 
            errorMessage: err.message,
            formData: req.body // Pour pré-remplir les champs
        });
    }
};

exports.getLoginPage = (req, res) => {
    res.render('login');
};

exports.postLoginData = async (req, res) => {
    try {
        const userId = await authModel.loginFunctionModel(req.body.email, req.body.password);
        const user = await User.findById(userId); // Maintenant User est défini

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Créez la session utilisateur
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage || 'default.jpg'
        };

        console.log("Session avant sauvegarde:", req.session.user);

        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) return reject(err);
                resolve();
            });
        });
        return res.redirect('/');

    } catch (err) {
        console.error("Erreur connexion:", err);
        return res.render('login', {
            errorMessage: err.message,
            email: req.body.email
        });
    }
};

exports.logoutFunctionController = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erreur destruction session:', err);
            return res.status(500).send('Erreur serveur');
        }
        res.redirect('/login');
    });
};