// ===== IMPORTS ===== //
// Models
const {
  ClientsMapper,
  ServicesMapper,
  UserMapper,
  InvoicesMapper,
  InvoiceServicesMapper,
} = require("../../models/index.mapper");

// Utils
const { months, userFullName } = require("../../utils/genericMethods");

// Controller's methods
const {
  formatingInvoiceServices,
  formatingInvoiceUserInformations,
  formatingInvoiceClientData,
  invoicePdfGenerator,
  sendInvoiceEmail,
  addInvoiceServicesToDatabase,
} = require("./invoiceControllersMethods");

// ===== CONTROLLERS ===== //
const invoiceControllers = {
  // ------------------------------------------------------------------------------------ //
  // Method to display the invoice page
  getInvoice: async (req, res) => {
    try {
      const userId = req.session.user.user_id;

      // Get clients data and formating it
      const clients = await ClientsMapper.getUserClients(userId);
      const clientsData = clients.map((client) => {
        const { client_name, client_id } = client;
        return { client_name, client_id };
      });

      // Get user data and formating it
      const user = await UserMapper.getUserById(userId);
      const { user_email, user_last_name, user_first_name, user_adress, user_city_name, user_zip_code } = user;
      const userData = { user_email, user_last_name, user_first_name, user_adress, user_city_name, user_zip_code };

      // Get services
      const services = await ServicesMapper.getUserServices(userId);

      // Get user's Invoices
      const invoiceYear = await InvoicesMapper.getYearsInvoiceUser(userId);

      res.render("invoice/invoiceMain", {
        showNavbar: true,
        clientsData,
        userData,
        services,
        months,
        invoiceYear,
      });
    } catch (error) {
      console.error("[ERROR getInvoice in invoiceControllers.js] :", error);
    }
  },

  // ------------------------------------------------------------------------------------ //
  // Method to send the invoice by email
  postSendInvoiceEmail: async (req, res) => {
    try {
      const { clientId, servicesData, invoiceMonth } = req.body;

      // Get client's informations + destructure them
      const client = await ClientsMapper.getClientById(clientId);
      const { client_email } = client;

      // Get user's informations + destructure them
      const userData = req.session.user;

      // Get services informations + formating them
      const servicesInformation = await formatingInvoiceServices(servicesData);

      //  User informations for the invoice
      const userInformations = formatingInvoiceUserInformations(userData);
      const userName = userFullName(userData);

      // Client informations for the invoice
      const clientInformations = formatingInvoiceClientData(client);

      // Date for the invoice
      const invoiceYear = new Date().getFullYear();
      const invoiceDate = `${invoiceMonth} ${invoiceYear}`;

      // Invoice Number
      const invoiceNumber = "5";

      // Invoice Title
      const invoiceTitle = `Facture n°${invoiceNumber} - ${invoiceDate}`;

      // Invoice total service price
      const totalPrice = servicesInformation.reduce((sum, service) => sum + Number(service.at(-1)), 0);

      // Dynamic invoice data
      const inputs = [
        {
          invoiceTitle: invoiceTitle,
          userInformations: userInformations,
          clientInformations: clientInformations,
          servicesInformation: servicesInformation,
          totalPrice: totalPrice.toString(),
          paymentData: `Crédit Agricole\nIBAN : FR76 0000 0000 0000 0000 0000 000\nBIC / SWIFT : AGRIFRPP361`,
        },
      ];

      // Invoice pdf generation
      const invoiceGenerated = await invoicePdfGenerator(inputs);

      const emailData = { userName, client_email, invoiceDate, invoiceTitle, invoiceGenerated };

      // Send the pdf invoice by email
      await sendInvoiceEmail(emailData);

      const invoiceData = {
        invoiceMonth: invoiceMonth,
        invoiceYear: invoiceYear,
        invoiceClientId: clientId,
        userId: userData.user_id,
      };

      // Add the invoice to the database
      const invoiceId = await InvoicesMapper.addInvoice(invoiceData);

      // Add the invoice's services to the database
      await addInvoiceServicesToDatabase(servicesData, invoiceId);

      // Send the response
      res.json({ reload: true, success: true });
    } catch (error) {
      console.error("[ERROR postSendInvoiceEmail in invoiceControllers.js] :", error);
      res.json({ reload: true });
    }
  },

  getUserInvoicesByYear: async (req, res) => {
    try {
      const year = req.params.year;
      const userId = req.session.user.user_id;
      const invoicesByYear = await InvoicesMapper.getUserInvoicesByYear(userId, year);

      const formatedInvoices = await Promise.all(
        invoicesByYear.map(async (invoice) => {
          const { invoice_id, invoice_client_id } = invoice;

          // 2. Récupérer le client associé
          const client = await ClientsMapper.getClientById(invoice_client_id);

          // 3. Récupérer les services liés à la facture
          const servicesData = await InvoiceServicesMapper.getInvoiceServices(invoice_id);

          // 4. Mapper les services pour récupérer leurs détails
          const services = await Promise.all(
            servicesData.map(async (service) => {
              const { service_id, service_quantity } = service;
              const serviceData = await ServicesMapper.getServiceById(service_id);

              if (!serviceData.length) return null; // Sécurité si le service n'existe pas

              const { service_name, service_price } = serviceData[0];
              const totalPrice = service_quantity * service_price;

              return {
                service_name,
                service_quantity,
                service_price,
                total_price: totalPrice,
              };
            })
          );

          return {
            ...invoice,
            client,
            services: services.filter(Boolean), // Supprimer les services nulls
          };
        })
      );

      res.json(formatedInvoices);
    } catch (error) {
      console.error("[ERROR getInvoicesUserByYear in invoiceControllers.js] :", error);
    }
  },
};

module.exports = invoiceControllers;
