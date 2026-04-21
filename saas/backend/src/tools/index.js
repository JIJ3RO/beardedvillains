const listServices = require('./listServices');
const listProducts = require('./listProducts');
const getProduct = require('./getProduct');
const checkAvailability = require('./checkAvailability');
const createAppointment = require('./createAppointment');
const getMyAppointments = require('./getMyAppointments');
const cancelAppointment = require('./cancelAppointment');
const rescheduleAppointment = require('./rescheduleAppointment');
const joinWaitlist = require('./joinWaitlist');

const toolModules = [
  listServices,
  listProducts,
  getProduct,
  checkAvailability,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  joinWaitlist,
];

const toolDefinitions = toolModules.map((m) => m.definition);

const toolMap = Object.fromEntries(toolModules.map((m) => [m.definition.name, m.execute]));

module.exports = { toolDefinitions, toolMap };
