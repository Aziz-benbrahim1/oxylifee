const route = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const body = require('express').urlencoded({ extended: true });

route.get('/signup', AuthController.getSignupPage);
route.post('/signup', body, AuthController.postSignupData);

route.get('/login', AuthController.getLoginPage);
route.post('/login', body, AuthController.postLoginData); // Ajoutez 'body' comme middleware

route.get('/logout', AuthController.logoutFunctionController);
route.post('/logout', AuthController.logoutFunctionController);

module.exports = route;