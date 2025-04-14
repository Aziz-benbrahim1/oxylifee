// middlewares/auth.js
module.exports = {
    // Vérifie si l'utilisateur est authentifié
    isAuthenticated: (req, res, next) => {
      if (req.session && req.session.user) {
        return next();
      }
      res.redirect('/login');
    },
    
    // Stocke les informations utilisateur dans res.locals pour les vues
    userLocals: (req, res, next) => {
        if (req.session && req.session.user) {
          res.locals.user = req.session.user;
        }
        next();
      }
    };