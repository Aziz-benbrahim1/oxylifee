// middlewares/auth.js
module.exports = {
    isAuthenticated: (req, res, next) => {
        console.log("Middleware auth - session user:", req.session.user);
        if (req.session.user) {
            return next();
        }
        console.log("Non authentifié - redirection vers login");
        res.redirect('/login');
    }
};

    
    
    // Stocke les informations utilisateur dans res.locals pour les vues
    userLocals: (req, res, next) => {
        if (req.session && req.session.user) {
          res.locals.user = req.session.user;
        }
        next();
      }
    
    