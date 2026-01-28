if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
          evt.preventDefault();
          if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

          this.handleErrorMessage();
          
          const noteTickCheckbox = this.form.elements.note_tick;
          const noteTickText = document.getElementById('handNote');
          
          // Check if we should add sympathy card
          const shouldAddSympathyCard = noteTickCheckbox && noteTickCheckbox.checked;
          
          if (shouldAddSympathyCard) {
              // Check if note text is blank
              if (!noteTickText || noteTickText.value.trim() === '') {
                  // Optional: Focus on the text field
                  if (noteTickText) {
                      noteTickText.classList.add('required-custom')
                      noteTickText.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                          inline: 'nearest'
                      });
                      noteTickText.focus();
                  }
                  return; // Don't proceed
              }
              
              // Use JSON API for multiple items
              this.handleMultipleItems(noteTickCheckbox, noteTickText);
          } else {
              // Use original form submission
              this.handleSingleItem();
          }
      }

      handleMultipleItems(noteTickCheckbox, noteTickText) {
        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const mainProductVariantId = Number(this.form.elements.id.value);
        const sympathyCardVariantId = Number(noteTickCheckbox.value);
        const noteValue = noteTickText.value.trim();
        const quantity = this.form.elements.quantity ? Number(this.form.elements.quantity.value) : 1;

        const items = [
          {
            id: mainProductVariantId,
            quantity: quantity
          },
          {
            id: sympathyCardVariantId,
            quantity: this.form.quantity ? Number(this.form.quantity.value) : 1,
            properties: {
              Message: noteValue,
              _parent_id: mainProductVariantId
            }
          }
        ];

        // Prepare the request like the original form submission
        const body = {
          items: items,
          sections: this.cart ? this.cart.getSectionsToRender().map((section) => section.id) : [],
          sections_url: window.location.pathname
        };

        fetch(`${routes.cart_add_url}.js`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(response => {
          this.processCartResponse(response, mainProductVariantId);
        })
        .catch((error) => {
          console.error('Error:', error);
          // Fallback to original form submission
          this.handleSingleItem();
        })
        .finally(() => {
          this.cleanupSubmitButton();
        });
      }

      handleSingleItem() {
        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        const productVariantId = formData.get('id');
        
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            this.processCartResponse(response, productVariantId);
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.cleanupSubmitButton();
          });
      }

      processCartResponse(response, productVariantId) {
        if (response.status) {
          publish(PUB_SUB_EVENTS.cartError, {
            source: 'product-form',
            productVariantId: productVariantId,
            errors: response.errors || response.description,
            message: response.message,
          });
          this.handleErrorMessage(response.description);

          const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
          if (!soldOutMessage) return;
          this.submitButton.setAttribute('aria-disabled', true);
          this.submitButtonText.classList.add('hidden');
          soldOutMessage.classList.remove('hidden');
          this.error = true;
          return;
        } else if (!this.cart) {
          window.location = window.routes.cart_url;
          return;
        }

        if (!this.error)
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'product-form',
            productVariantId: productVariantId,
            cartData: response,
          });
        this.error = false;
        const quickAddModal = this.closest('quick-add-modal');
        if (quickAddModal) {
          document.body.addEventListener(
            'modalClosed',
            () => {
              setTimeout(() => {
                this.cart.renderContents(response);
              });
            },
            { once: true }
          );
          quickAddModal.hide(true);
        } else {
          this.cart.renderContents(response);
        }
      }

      cleanupSubmitButton() {
        this.submitButton.classList.remove('loading');
        if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
        if (!this.error) this.submitButton.removeAttribute('aria-disabled');
        this.querySelector('.loading__spinner').classList.add('hidden');
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}