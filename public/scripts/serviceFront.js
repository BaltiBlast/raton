const serviceFront = {
  init: () => {
    getServiceEditButtons();
    formSubmitDeleteService();
    closeModalServices();
  },

  getServiceEditButtons: () => {
    const spanEditButtons = document.querySelectorAll("span[edit-service-id]");
    spanEditButtons.forEach((span) => {
      span.addEventListener("click", () => {
        const serviceId = span.getAttribute("edit-service-id");
        const modal = document.getElementById(serviceId);
        openModal(modal);
      });
    });
  },

  formSubmitDeleteService: () => {
    const spanDeleteButtons = document.querySelectorAll("[delete-service-id]");

    spanDeleteButtons.forEach((span) => {
      span.addEventListener("click", () => {
        const form = span.closest("form");
        form.submit();
      });
    });
  },

  closeModalServices: () => {
    const cancelButtons = document.querySelectorAll("dialog button[type='button']");
    cancelButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        closeModal(dialog);
      });
    });
  },
};

const { getServiceEditButtons, formSubmitDeleteService, closeModalServices } = serviceFront;

document.addEventListener("DOMContentLoaded", serviceFront.init());
