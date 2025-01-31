//src/app.js
const express = require("express");
const app = express();
const ExpressError = require("./utils/expressError")
const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
const industriesRoutes = require('./routes/industries');

app.use(express.json());

app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/industries', industriesRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Biztime!');
});

/** 404 handler */
app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */
app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;
