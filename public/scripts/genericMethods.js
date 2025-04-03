const genericMethods = {
  initGenericMethods: () => {},

  openModal: (modal) => {
    modal.showModal();
  },

  closeModal: (modal) => {
    modal.close();
  },
};

const { initGenericMethods, closeModal, openModal } = genericMethods;

document.addEventListener("DOMContentLoaded", initGenericMethods());
