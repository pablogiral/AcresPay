const express = require('express');
const { setRoutes } = require('./routes');
const { Logger } = require('./lib/logger');

const app = express();
const logger = new Logger();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setRoutes(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});