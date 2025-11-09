const express = require('express');
const router = express.Router();

const getPhillyNextWeek = require('../controllers/controller');

router.get('/events/philly/next-week', getPhillyNextWeek);

module.exports = router;
