const selectClient = document.getElementById("selectClient");
const selectMonth = document.getElementById("selectMonth");
const invoiceForm = document.getElementById("invoiceForm");
const submitButton = document.getElementById("submitButton");
const prestationPrice = document.getElementById("prestation-price");
const totalPrice = document.getElementById("totalPrice");
const sendButton = document.getElementById("send-button");
const invoiceMonth = document.getElementById("facture-month");
const yearElement = document.getElementById("facture-year");
const invoiceToSend = document.getElementById("invoiceToSend");
const invoiceNumber = document.getElementById("invoice-number");
const inputInvoiceNumber = document.getElementById("inputInvoiceNumber");

let selectedClient = null;

const invoiceFormInteraction = {
  init: () => {
    setPrice();
    setClientData();
    setInvoiceDate();
    setInvoiceNumber();
    isClientSelected();
    isMonthSelected();
    isInvoiceNumberEmpty();
    invoiceTabManagement();
    showInvoicePreview();
    closeInvoicePreview();
    getInvoiceUserByYear();
  },

  // ------------------------------------------------------------------------------------ //
  // Get the client data by its ID
  getClientDataById: async (clientId) => {
    const response = await fetch(`/client/${clientId}`);
    const data = await response.json();
    selectedClient = data;
  },

  // ------------------------------------------------------------------------------------ //
  // Get user history by year
  getInvoiceUserByYear: () => {
    const yearsDetails = document.querySelectorAll('details[name="invoiceYear"]');

    yearsDetails.forEach((details) => {
      details.addEventListener("toggle", async () => {
        if (!details.open) return;
        const year = details.getAttribute("data-invoice-year");

        // Si déjà chargé, ne pas refaire la requête
        if (details.dataset.loaded) return;

        try {
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
        } catch (error) {
          console.error("Erreur de chargement :", error);
        }
      });
    });
  },

  groupInvoicesByMonth: (invoices) => {
    return invoices.reduce((acc, invoice) => {
      if (!acc[invoice.invoice_month]) {
        acc[invoice.invoice_month] = [];
      }
      acc[invoice.invoice_month].push(invoice);
      return acc;
    }, {});
  },

  createInvoiceTable: (invoices) => {
    const table = document.createElement("table");
    table.classList.add("invoice-table");

    table.innerHTML = `
      <thead>
        <tr>
          <th>N° Facture</th>
          <th>Client</th>
          <th>Service</th>
          <th>Quantité</th>
          <th>Prix Unitaire (€)</th>
          <th>Total (€)</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    invoices.forEach((invoice) => {
      invoice.services.forEach((service, index) => {
        const row = document.createElement("tr");

        if (index === 0) {
          row.innerHTML += `
            <td rowspan="${invoice.services.length}">${invoice.invoice_id}</td>
            <td rowspan="${invoice.services.length}">${invoice.client.client_name}</td>
          `;
        }

        row.innerHTML += `
          <td>${service.service_name}</td>
          <td>${service.service_quantity}</td>
          <td>${service.service_price}</td>
          <td>${service.total_price}</td>
        `;

        tbody.appendChild(row);
      });
    });

    return table;
  },

  // ------------------------------------------------------------------------------------ //
  // Set the client data in the invoice preview
  setClientData: () => {
    selectClient.addEventListener("change", async (element) => {
      const clientId = element.target.value;
      await getClientDataById(clientId);

      if (selectedClient) {
        document.getElementById("client-name").textContent = selectedClient.client_name;
        document.getElementById("client-adress").textContent = selectedClient.client_adress;
        document.getElementById("client-email").textContent = selectedClient.client_email;

        const formatedAdress = `${selectedClient.client_city_name} - ${selectedClient.client_zip_code}`;
        document.getElementById("client-city").textContent = formatedAdress;
      } else {
        document.getElementById("client-name").textContent = "";
        document.getElementById("client-adress").textContent = "";
        document.getElementById("client-city").textContent = "";
        document.getElementById("client-email").textContent = "";
      }
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Set the invoice date in the invoice preview
  setInvoiceDate: () => {
    selectMonth.addEventListener("change", function (element) {
      const selectedMonth = element.target.value;
      if (selectedMonth) {
        yearElement.textContent = new Date().getFullYear();
        invoiceMonth.textContent = selectedMonth;
      } else {
        document.getElementById("facture-month").textContent = "Mois";
        document.getElementById("facture-year").textContent = "Année";
      }
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Set the invoice number in the invoice preview
  setInvoiceNumber: () => {
    inputInvoiceNumber.addEventListener("change", function (element) {
      const invoiceNumberValue = element.target.value;
      if (invoiceNumberValue) {
        invoiceNumber.textContent = invoiceNumberValue;
      } else {
        invoiceNumber.textContent = "Numéro de facture";
      }
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Set the invoice number in the invoice preview
  setPrice: () => {
    submitButton.addEventListener("click", function () {
      prestationPrice.innerHTML = "";
      const servicesData = [];

      const rows = document.querySelectorAll("table tbody tr");

      rows.forEach((row) => {
        const serviceId = row.getAttribute("data-service-id");

        if (serviceId) {
          const quantityInput = row.querySelector('input[name="services[' + serviceId + '][quantity]"]');
          const nameInput = row.querySelector('input[name="services[' + serviceId + '][name]"]');
          const priceInput = row.querySelector('input[name="services[' + serviceId + '][price]"]');

          if (quantityInput.value > 0) {
            const serviceData = {
              serviceId: serviceId,
              name: nameInput ? nameInput.value : "",
              price: priceInput ? priceInput.value : "",
              quantity: quantityInput ? quantityInput.value : 0,
            };
            servicesData.push(serviceData);
          }
        }
      });

      servicesData.forEach((element) => {
        const tr = document.createElement("tr");

        const serviceName = document.createElement("td");
        serviceName.textContent = element.name;
        tr.appendChild(serviceName);

        const servicePrice = document.createElement("td");
        servicePrice.textContent = element.price;
        tr.appendChild(servicePrice);

        const serviceQuantity = document.createElement("td");
        serviceQuantity.textContent = element.quantity;
        tr.appendChild(serviceQuantity);

        const serviceTotal = document.createElement("td");
        serviceTotal.textContent = element.price * element.quantity;
        tr.appendChild(serviceTotal);

        prestationPrice.appendChild(tr);
      });

      const totalPriceServices = servicesData.reduce((sum, element) => {
        return sum + parseFloat(element.price) * parseInt(element.quantity);
      }, 0);

      totalPrice.textContent = totalPriceServices;
    });
  },

  // ------------------------------------------------------------------------------------ //
  // Show invoice preview
  showInvoicePreview: () => {
    document.getElementById("invoiceModal").showModal();
  },

  // ------------------------------------------------------------------------------------ //
  // Disable button to generate invoice if form is not valid
  closeInvoicePreview: () => {
    document.getElementById("invoiceModal").close();
  },

  // ------------------------------------------------------------------------------------ //
  // Disable button to generate invoice if form is not valid
  checkFormValidity: () => {
    const isClientSelected = selectClient.value !== "";
    const isMonthSelected = selectMonth.value !== "";
    const isInvoiceNumberEmpty = inputInvoiceNumber.value !== "";
    submitButton.disabled = !(isClientSelected && isMonthSelected && isInvoiceNumberEmpty);
  },

  // ------------------------------------------------------------------------------------ //
  // Check if input invoice number is empty
  isInvoiceNumberEmpty: () => {
    inputInvoiceNumber.addEventListener("input", checkFormValidity);
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
  // Get all services
  getSelectedServices: () => {
    const selectedServices = [];

    document.querySelectorAll("tr[data-service-id]").forEach((row) => {
      const quantityInput = row.querySelector("[data-service-quantity]");
      const quantity = parseInt(quantityInput.value, 10);
      const serviceId = parseInt(row.dataset.serviceId);

      if (quantity > 0) {
        selectedServices.push({
          serviceId: serviceId,
          serviceQuantity: quantity,
        });
      }
    });

    return selectedServices;
  },

  // ------------------------------------------------------------------------------------ //
  // Send invoice by email
  sendEmail: () => {
    invoiceForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const { client_id } = selectedClient;
      // const formatedDate = `${invoiceMonth.textContent} ${yearElement.textContent}`;
      const date = invoiceMonth.textContent;
      // const invoiceDbData = {
      //   invoiceMonth: invoiceMonth.textContent,
      //   invoiceYear: yearElement.textContent,
      //   invoiceIncome: totalPrice.textContent,
      //   invoiceClient: client_email,
      //   invoiceClientId: client_id,
      // };

      const servicesData = getSelectedServices();

      const data = {
        clientId: client_id,
        invoiceMonth: date,
        servicesData,
      };

      sendButton.classList.add("is-loading");

      fetch("/invoice-send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const base64Data = pdfInvoice.split(",")[1];
            const binaryData = atob(base64Data);
            const arrayBuffer = new Uint8Array(binaryData.length);

            for (let i = 0; i < binaryData.length; i++) {
              arrayBuffer[i] = binaryData.charCodeAt(i);
            }

            const blob = new Blob([arrayBuffer], { type: "application/pdf" });

            const clientName = document.getElementById("client-name").textContent;

            // Créer un lien de téléchargement
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `facture_${clientName}_${formatedDate}_n°${invoiceNumber.textContent}.pdf`;

            // Simuler un clic pour télécharger
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }

          if (data.reload) {
            sendButton.classList.remove("is-loading");
            location.reload();
          }
        });
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
  setPrice,
  setClientData,
  setInvoiceDate,
  setInvoiceNumber,
  checkFormValidity,
  isMonthSelected,
  isClientSelected,
  isInvoiceNumberEmpty,
  getClientDataById,
  switchTab,
  activateTab,
  deactivateTabs,
  invoiceTabManagement,
  showInvoicePreview,
  closeInvoicePreview,
  getSelectedServices,
  getInvoiceUserByYear,
  groupInvoicesByMonth,
  createInvoiceTable,
} = invoiceFormInteraction;

document.addEventListener("DOMContentLoaded", invoiceFormInteraction.init());
