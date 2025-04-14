const authModel = require('../models/auth.model');

exports.getSignupPage = (req, res) => {
    res.render('signup');
};

exports.postSignupData = (req, res) => {
    authModel.signupFunctionModel(
        req.body.name,
        req.body.email,
        req.body.password,
        req.body.numerodetelephone,
        req.body.specialite
    )
    .then(() => res.redirect('/login'))
    .catch(err => {
        console.error(err);
        res.redirect('/signup');
    });
};

exports.getLoginPage = (req, res) => {
    res.render('login');
};

exports.postLoginData = (req, res) => {
    authModel.loginFunctionModel(req.body.email, req.body.password)
        .then(user => {
            req.session.user = {
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            };
            
            req.session.save(err => {
                if (err) {
                    console.error('Erreur sauvegarde session:', err);
                    return res.status(500).send('Erreur serveur');
                }
                res.redirect('/');
            });
        })
        .catch(err => {
            res.render('login', { errorMessage: err.message });
        });
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