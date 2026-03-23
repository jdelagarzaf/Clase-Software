const express = require('express');
const countryController = require('../controllers/countryController');
const router = express.Router();

// Rutas para los países
router.get('/', countryController.getAllCountries);
router.get('/:id', countryController.getCountryById);
router.post('/', countryController.createCountry);
router.put('/:id', countryController.updateCountry);
router.delete('/:id', countryController.deleteCountry);

module.exports = router;