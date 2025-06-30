// ===== IMPORTS ===== //
// Models
const { ClientsMapper, ServicesMapper, UserMapper, InvoicesMapper } = require("../../models/index.mapper");

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
  invoiceHistoryFormater,
  formatingUserBankDetails,
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
      const {
        user_email,
        user_last_name,
        user_first_name,
        user_adress,
        user_city_name,
        user_zip_code,
        user_bank_name,
        user_iban,
        user_bic_swift,
      } = user;

      const userData = {
        user_email,
        user_last_name,
        user_first_name,
        user_adress,
        user_city_name,
        user_zip_code,
        user_bank_name,
        user_iban,
        user_bic_swift,
      };

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
      const { clientId, servicesDataSelected, invoiceMonth } = req.body;

      // Get client's informations
      const client = await ClientsMapper.getClientById(clientId);
      const { client_email, invoice_number, client_name } = client;

      // Get user's informations
      const userData = req.session.user;

      // Get services informations + formating them
      const servicesInformation = await formatingInvoiceServices(servicesDataSelected);

      //  User informations for the invoice
      const userInformations = formatingInvoiceUserInformations(userData);
      const userName = userFullName(userData);

      // Client informations for the invoice
      const clientInformations = formatingInvoiceClientData(client);

      // Date for the invoice
      const invoiceYear = new Date().getFullYear();
      const invoiceDate = `${invoiceMonth} ${invoiceYear}`;

      // Invoice Number
      const newInvoiceNumber = invoice_number + 1;

      // Invoice Title
      const invoiceTitle = `Facture n°${newInvoiceNumber} - ${invoiceDate}`;

      // Invoice total service price
      const totalPrice = servicesInformation.reduce((sum, service) => sum + Number(service.at(-1)), 0);

      // Payment details
      const paymentDetails = formatingUserBankDetails(userData);

      // Dynamic PDF invoice data
      const inputs = [
        {
          invoiceTitle: invoiceTitle,
          userInformations: userInformations,
          clientInformations: clientInformations,
          servicesInformation: servicesInformation,
          totalPrice: totalPrice.toString(),
          paymentDetails: paymentDetails,
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
        invoiceNumber: newInvoiceNumber,
      };

      // Add the invoice to the database
      const invoiceId = await InvoicesMapper.addInvoice(invoiceData);

      // Add the invoice's services to the database
      await addInvoiceServicesToDatabase(servicesDataSelected, invoiceId);

      // Update the client's last invoice number
      const clientData = {
        recordId: client.recordId,
        newInvoiceNumber: newInvoiceNumber,
      };
      await ClientsMapper.updateClient(clientData);

      // Send the response
      res.json({
        reload: true,
        success: true,
        pdf: invoiceGenerated,
        invoiceTitle: invoiceTitle,
        clientName: client_name,
      });
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
      const formatedInvoices = await invoiceHistoryFormater(invoicesByYear);

      res.json(formatedInvoices);
    } catch (error) {
      console.error("[ERROR getInvoicesUserByYear in invoiceControllers.js] :", error);
    }
  },
};

module.exports = invoiceControllers;
