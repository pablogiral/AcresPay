const express = require('express');
const IndexController = require('../controllers/index').IndexController;

const setRoutes = (app) => {
    const router = express.Router();
    const indexController = new IndexController();

    router.get('/', indexController.home);
    router.get('/about', indexController.about);
    // Add more routes as needed

    app.use('/', router);
};

module.exports = setRoutes;