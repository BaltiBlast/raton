const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("./utils/middleware");

// CONTROLLERS
// -- auth
const authControllers = require("./controllers/auth/authControllers");
const { getSignin, postSignin, postSignup, getDisconnect } = authControllers;

// -- user
const userControllers = require("./controllers/user/profileControllers");
const { getProfile, postProfile } = userControllers;

// -- invoices
const invoiceControllers = require("./controllers/invoices/invoiceControllers");
const { getInvoice, postSendInvoiceEmail, getUserInvoicesByYear } = invoiceControllers;

// -- clients
const clientsController = require("./controllers/clients/clientsController");
const { getClients, getClientById, postClientAdd, postClientsDelete, postClientUpdate } = clientsController;

// -- general
const generalControllers = require("./controllers/general/generalControllers");
const { get404, getHome } = generalControllers;

// -- services
const servicesControllers = require("./controllers/services/servicesControllers");
const { getServices, postServicesAdd, postServiceDelete, postServicesUpdate } = servicesControllers;

// -- summary
const summaryControllers = require("./controllers/summary/summaryControllers");
const { getSummary } = summaryControllers;

// AUTH ROUTES
router.get("/signin", getSignin);
router.post("/signin", postSignin);
router.post("/signup", postSignup);
router.get("/signout", ensureAuthenticated, getDisconnect);

// PROFILE ROUTES
router.get("/profile", ensureAuthenticated, getProfile);
router.post("/profile-update", ensureAuthenticated, postProfile);

// INVOICES ROUTES
router.get("/invoice", ensureAuthenticated, getInvoice);
router.get("/invoices/:year", ensureAuthenticated, getUserInvoicesByYear);
router.post("/invoice-send-email", ensureAuthenticated, postSendInvoiceEmail);

// CONTACTS ROUTES
router.get("/clients", ensureAuthenticated, getClients);
router.get("/client/:id", ensureAuthenticated, getClientById);
router.post("/client-add", ensureAuthenticated, postClientAdd);
router.post("/client-update", ensureAuthenticated, postClientUpdate);
router.post("/client-delete", ensureAuthenticated, postClientsDelete);

// SERVICES ROUTES
router.get("/services", ensureAuthenticated, getServices);
router.post("/service-add", ensureAuthenticated, postServicesAdd);
router.post("/service-update", ensureAuthenticated, postServicesUpdate);
router.post("/service-delete", ensureAuthenticated, postServiceDelete);

// SUMMARY ROUTES
router.get("/summary", ensureAuthenticated, getSummary);

// GENERAL ROUTES
router.get("/", ensureAuthenticated, getHome);
router.use(get404);

module.exports = router;
