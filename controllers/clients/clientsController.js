// ===== IMPORTS ===== //
const { ClientsMapper } = require("../../models/index.mapper");
const { formatAdress, userFullName } = require("../../utils/genericMethods");

// ===== CONTROLLERS ===== //
const clientsController = {
  // ------------------------------------------------------------------------------------ //
  // Method to display the clients page
  getClients: async (req, res) => {
    try {
      const { user_first_name, user_last_name, user_id } = req.session.user;
      const userId = user_id;

      const userData = { user_first_name, user_last_name };
      const userName = userFullName(userData);

      const clients = await ClientsMapper.getUserClients(userId);

      // Format the adress of each client
      const formattedClients = clients.map((client) => {
        const { client_adress, client_city_name, client_zip_code } = client;
        const formattedAdress = formatAdress(client_adress, client_city_name, client_zip_code);
        return { ...client, formattedAdress };
      });

      res.render("clients", { showNavbar: true, clients: formattedClients, userId, userName });
    } catch (error) {
      console.error("[ERROR getClients in clientsController.js] :", error);
    }
  },

  // ------------------------------------------------------------------------------------ //
  // Method to get client's data by his id
  getClientById: async (req, res) => {
    try {
      const clientId = req.params.id;
      const dataClient = await ClientsMapper.getClientById(clientId);
      return res.json(dataClient);
    } catch (error) {
      console.error("[ERROR getClientById in clientsController.js] :", error);
    }
  },

  // ------------------------------------------------------------------------------------ //
  // Method to create a new client
  postClientAdd: async (req, res) => {
    try {
      const clientData = req.body;

      // Create the client in the database
      await ClientsMapper.createClient(clientData);
      res.redirect("/clients");
    } catch (error) {
      console.error("[ERROR postClientAdd in clientsController.js] :", error);
    }
  },

  // ------------------------------------------------------------------------------------ //
  // Method to update a client
  postClientUpdate: async (req, res) => {
    try {
      const clientData = req.body;

      // Update the client in the database
      await ClientsMapper.updateClient(clientData);
      res.redirect("/clients");
    } catch (error) {
      console.error("[ERROR postClientUpdate in clientsController.js] :", error);
    }
  },

  // ------------------------------------------------------------------------------------ //
  // Method to delete a client
  postClientsDelete: async (req, res) => {
    try {
      const { recordId } = req.body;
      await ClientsMapper.deleteClient(recordId);
      res.redirect("/clients");
    } catch (error) {
      console.error("[ERROR postClientsDelete in clientsController.js] :", error);
    }
  },
};

module.exports = clientsController;
