const invoiceFormInteraction = {
  selectClient: document.getElementById("selectClient"),
  selectMonth: document.getElementById("selectMonth"),
  invoiceForm: document.getElementById("invoiceForm"),
  modalInvoicePreview: document.getElementById("modalInvoicePreview"),
  invoicePreviewButton: document.getElementById("invoicePreviewButton"),
  invoicePreviewCloseButton: document.getElementById("invoicePreviewCloseButton"),
  sendInvoiceButton: document.getElementById("sendInvoiceButton"),
  sendEmailButton: document.getElementById("sendEmailButton"),
  clientDataSelected: null,
  servicesDataSelected: [],

  init: () => {
    isClientSelected();
    isMonthSelected();
    invoiceTabManagement();
    getInvoiceUserByYear();
    openInvoiceModalPreview();
    getClientDataById();
    getSelectedServices();
    closeInvoiceModalPreview();
    triggerSendInvoiceButton();
  },

  // ------------------------------------------------------------------------------------ //
  // Show invoice preview modal with data
  openInvoiceModalPreview: async () => {
    invoicePreviewButton.addEventListener("click", function () {
      genericMethods.openModal(modalInvoicePreview);
      setClientDataInvoicePreview();
      setServicesDataInvoicePreview();
    });
  },

  closeInvoiceModalPreview: () => {
    invoicePreviewCloseButton.addEventListener("click", function () {
      genericMethods.closeModal(modalInvoicePreview);
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Set client data in the invoice preview modal
  setClientDataInvoicePreview: () => {
    const { client_name, client_adress, client_zip_code, client_city_name, client_email } = clientDataSelected;
    const clientCity = `${client_city_name} - ${client_zip_code}`;
    const clientData = [client_name, client_adress, clientCity, client_email];

    const clientDataContainer = document.getElementById("modalClientData");
    clientDataContainer.innerHTML = "";

    for (const client of clientData) {
      const span = document.createElement("span");
      span.textContent = client;
      clientDataContainer.appendChild(span);
    }
  },

  // ------------------------------------------------------------------------------------ //
  // Set services data in the invoice preview modal
  setServicesDataInvoicePreview: () => {
    const servicesDataContainer = document.getElementById("modalServicesData");
    servicesDataContainer.innerHTML = "";

    let totalInvoicePrice = 0;

    for (const service of servicesDataSelected) {
      const tr = document.createElement("tr");

      // Service name
      const serviceName = document.createElement("td");
      serviceName.textContent = service.serviceName;

      // Service quantity
      const serviceQuantity = document.createElement("td");
      serviceQuantity.textContent = service.serviceQuantity;

      // Service price
      const servicePrice = document.createElement("td");
      servicePrice.textContent = service.servicePrice;

      // Service total price
      const serviceTotalPrice = document.createElement("td");
      const serviceTotalPriceValue = service.servicePrice * service.serviceQuantity;
      serviceTotalPrice.textContent = serviceTotalPriceValue;

      totalInvoicePrice += serviceTotalPriceValue;

      tr.append(serviceName, serviceQuantity, servicePrice, serviceTotalPrice);

      servicesDataContainer.appendChild(tr);
    }

    const totalRow = document.createElement("tr");

    const emptyCell = document.createElement("td");
    emptyCell.setAttribute("colspan", "3");

    const totalAmount = document.createElement("td");
    totalAmount.textContent = totalInvoicePrice;

    totalRow.append(emptyCell, totalAmount);

    servicesDataContainer.appendChild(totalRow);
  },

  // ------------------------------------------------------------------------------------ //
  // Get the client data by its ID
  getClientDataById: () => {
    selectClient.addEventListener("change", async (client) => {
      const clientId = client.target.value;

      if (clientId) {
        try {
          const response = await fetch(`/client/${clientId}`);
          const data = await response.json();
          clientDataSelected = data;
        } catch (error) {
          console.log("Error fetching client data:", error);
        }
      } else {
        clientDataSelected = null;
      }
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Get user history by year
  getInvoiceUserByYear: () => {
    const yearsDetails = document.querySelectorAll('details[name="invoiceYear"]');

    yearsDetails.forEach((details) => {
      details.addEventListener("toggle", async () => {
        if (!details.open) return;
        const year = details.getAttribute("data-invoice-year");
        const loadingSpinner = document.getElementById(`loadingSpinner${year}`);

        // Si déjà chargé, ne pas refaire la requête
        if (details.dataset.loaded) return;

        try {
          loadingSpinner.ariaBusy = true;
          const response = await fetch(`/invoices/${year}`);
          const invoices = await response.json();

          const monthsContainer = details.querySelector(".months-container");
          monthsContainer.innerHTML = ""; // Reset affichage

          // Organisation des factures par mois
          const months = groupInvoicesByMonth(invoices);

          // Création des mois
          Object.keys(months).forEach((month) => {
            const monthDetails = document.createElement("details");
            monthDetails.classList.add("month-details");
            monthDetails.setAttribute("data-month", month);
            monthDetails.innerHTML = `<summary>${month}</summary><div class="invoice-container"></div>`;

            monthsContainer.appendChild(monthDetails);

            // Gestion de l'ouverture du mois
            monthDetails.addEventListener("toggle", () => {
              if (!monthDetails.open) return;
              if (monthDetails.dataset.loaded) return;

              const invoiceContainer = monthDetails.querySelector(".invoice-container");
              const table = createInvoiceTable(months[month]);
              invoiceContainer.appendChild(table);
              monthDetails.dataset.loaded = true;
            });
          });

          details.dataset.loaded = true;
          loadingSpinner.ariaBusy = false;
        } catch (error) {
          console.error("Erreur de chargement :", error);
        }
      });
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Group invoices by month for display in history
  groupInvoicesByMonth: (invoices) => {
    return invoices.reduce((acc, invoice) => {
      if (!acc[invoice.invoice_month]) {
        acc[invoice.invoice_month] = [];
      }
      acc[invoice.invoice_month].push(invoice);
      return acc;
    }, {});
  },

  // ------------------------------------------------------------------------------------ //
  // Create invoice table for history
  createInvoiceTable: (invoices) => {
    const table = document.createElement("table");

    // Création de l'en-tête
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["Clients", "N° Facture", "Total (€)", "Actions"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Création du corps de la table
    const tbody = document.createElement("tbody");

    invoices.forEach((invoice) => {
      const { client, invoice_number } = invoice;
      const { client_name } = client;
      const totalPrice = invoice.services.reduce((sum, service) => sum + service.total_price, 0);

      const row = document.createElement("tr");

      const clientCell = document.createElement("td");
      clientCell.textContent = client_name;
      row.appendChild(clientCell);

      const invoiceCell = document.createElement("td");
      invoiceCell.textContent = invoice_number;
      row.appendChild(invoiceCell);

      const totalCell = document.createElement("td");
      totalCell.textContent = totalPrice.toFixed(2);
      row.appendChild(totalCell);

      const actionsCell = document.createElement("td");
      actionsCell.textContent = "👁️";
      row.appendChild(actionsCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  },

  // ------------------------------------------------------------------------------------ //
  // Disable button to generate invoice if form is not valid
  checkFormValidity: () => {
    const isClientSelected = selectClient.value !== "";
    const isMonthSelected = selectMonth.value !== "";
    invoicePreviewButton.disabled = !(isClientSelected && isMonthSelected);
  },

  // ------------------------------------------------------------------------------------ //
  // Check if input client is selected
  isClientSelected: () => {
    selectClient.addEventListener("change", checkFormValidity);
  },

  // ------------------------------------------------------------------------------------ //
  // Check if input month is selected
  isMonthSelected: () => {
    selectMonth.addEventListener("change", checkFormValidity);
  },

  // ------------------------------------------------------------------------------------ //
  // Get all services selected by the user
  getSelectedServices: () => {
    const serviceInputs = document.querySelectorAll("input[service-quantity]");

    serviceInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const serviceId = parseInt(input.getAttribute("service-id"));
        const serviceName = input.getAttribute("name");
        const servicePrice = parseInt(input.getAttribute("service-price"));
        const quantity = parseInt(input.value) || 0;

        const data = {
          serviceId: serviceId,
          serviceQuantity: quantity,
          serviceName: serviceName,
          servicePrice: servicePrice,
        };

        // Check if the service is already in the array
        const isExistingIndex = servicesDataSelected.findIndex((service) => service.serviceId === serviceId);

        // If the quantity is greater than 0, update the quantity or remove the service
        if (quantity > 0 && isExistingIndex !== -1) {
          servicesDataSelected[isExistingIndex].serviceQuantity = quantity;
        } else if (quantity === 0 && isExistingIndex !== -1) {
          servicesDataSelected.splice(isExistingIndex, 1);
        } else {
          servicesDataSelected.push(data);
        }
      });
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Send invoice by email
  triggerSendInvoiceButton: () => {
    sendInvoiceButton.addEventListener("click", sendEmail);
  },

  // ------------------------------------------------------------------------------------ //
  // Send invoice by email
  sendEmail: async (event) => {
    event.preventDefault();

    const button = event.target; // bouton cliqué
    button.setAttribute("aria-busy", "true");
    button.setAttribute("aria-label", "Ca mouline…");
    button.disabled = true; // en option, pour éviter les doubles clics

    const { client_id } = clientDataSelected;
    const date = selectMonth.value;

    const data = {
      clientId: client_id,
      invoiceMonth: date,
      servicesDataSelected,
    };

    fetch("/invoice-send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        if (data.pdf) {
          const byteArray = Object.values(data.pdf);
          const uint8Array = new Uint8Array(byteArray);
          const blob = new Blob([uint8Array], { type: "application/pdf" });

          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = `${data.invoiceTitle} - ${data.clientName}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          URL.revokeObjectURL(url);
        }

        if (data.reload) {
          location.reload();
        }
      })
      .finally(() => {
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-label");
        button.disabled = false; // réactiver le bouton
      });
  },

  // ------------------------------------------------------------------------------------ //
  // Tab management
  invoiceTabManagement() {
    document.querySelectorAll(".tab-button").forEach((tab) => {
      tab.addEventListener("click", switchTab.bind(this));
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Tab switch
  switchTab(event) {
    const selectedTab = event.currentTarget;
    deactivateTabs();
    activateTab(selectedTab);
  },

  // ------------------------------------------------------------------------------------ //
  // Tab deactivation
  deactivateTabs() {
    document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active-tab"));
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
  },

  // ------------------------------------------------------------------------------------ //
  // Tab activation
  activateTab(tab) {
    tab.classList.add("active-tab");
    document.getElementById(tab.dataset.tab).classList.add("active");
  },
};

const {
  openInvoiceModalPreview,
  checkFormValidity,
  isMonthSelected,
  isClientSelected,
  getClientDataById,
  switchTab,
  activateTab,
  deactivateTabs,
  invoiceTabManagement,
  getSelectedServices,
  getInvoiceUserByYear,
  groupInvoicesByMonth,
  createInvoiceTable,
  setServicesDataInvoicePreview,
  setClientDataInvoicePreview,
  closeInvoiceModalPreview,
  triggerSendInvoiceButton,
  sendEmail,
  sendInvoiceButton,
  servicesDataSelected,
  selectClient,
  selectMonth,
  invoiceForm,
  modalInvoicePreview,
  invoicePreviewButton,
  invoicePreviewCloseButton,
} = invoiceFormInteraction;

let { clientDataSelected } = invoiceFormInteraction;

document.addEventListener("DOMContentLoaded", invoiceFormInteraction.init());
