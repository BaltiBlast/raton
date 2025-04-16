const clientFront = {
  init: () => {
    getClientEditButtons();
    formSubmitDeleteClient();
    closeModalClient();
  },

  getClientEditButtons: () => {
    const spanEditButtons = document.querySelectorAll("span[edit-client-id]");
    spanEditButtons.forEach((span) => {
      span.addEventListener("click", () => {
        const clientId = span.getAttribute("edit-client-id");
        const modal = document.getElementById(clientId);
        openModal(modal);
      });
    });
  },

  formSubmitDeleteClient: () => {
    const spanDeleteButtons = document.querySelectorAll("span[delete-client-id]");

    spanDeleteButtons.forEach((span) => {
      span.addEventListener("click", () => {
        const form = span.closest("form");
        form.submit();
      });
    });
  },

  closeModalClient: () => {
    const cancelButtons = document.querySelectorAll("dialog button[type='button']");
    cancelButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        closeModal(dialog);
      });
    });
  },
};

const { getClientEditButtons, formSubmitDeleteClient, closeModalClient } = clientFront;

document.addEventListener("DOMContentLoaded", clientFront.init());
