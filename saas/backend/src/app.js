const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const webhookRouter = require('./routes/webhook');
const authRouter = require('./routes/auth');
const appointmentsRouter = require('./routes/appointments');
const clientsRouter = require('./routes/clients');
const servicesRouter = require('./routes/services');
const productsRouter = require('./routes/products');
const availabilityRouter = require('./routes/availability');
const waitlistRouter = require('./routes/waitlist');
const dashboardRouter = require('./routes/dashboard');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));

// Twilio webhook needs raw body for signature validation
app.use('/webhook', express.urlencoded({ extended: false }));

app.use(express.json());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

app.use('/api', apiLimiter);
app.use('/webhook', webhookLimiter);

app.use('/webhook', webhookRouter);
app.use('/api/auth', authRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/products', productsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
