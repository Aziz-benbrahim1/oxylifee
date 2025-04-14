const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schemaAuth = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    specialite: String,
    numerodetelephone: String
    
});

const User = mongoose.model('user', schemaAuth);




exports.signupFunctionModel = async (name, email, password, specialite, numerodetelephone) => {
    try {
        // Validation de l'email
        if (!email || !email.includes('@')) {
            throw new Error('Veuillez fournir une adresse email valide');
        }

        // Vérification de l'existence de l'utilisateur
        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new Error('Cet email est déjà utilisé');
        }

        // Validation du mot de passe
        if (!password || password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        const hPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hPassword,
            specialite,
            numerodetelephone
        });

        await user.save();
        return user; // Retourne l'utilisateur créé plutôt qu'un message
    } catch (err) {
        throw err;
    }
};



exports.loginFunctionModel = async (email, password) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("Nous n'avons pas cet utilisateur dans notre base de données");
        }

        const verif = await bcrypt.compare(password, user.password);
        if (!verif) {
            throw new Error("Mot de passe invalide");
        }

        return user._id;
    } catch (err) {
        throw err;
    }
};
