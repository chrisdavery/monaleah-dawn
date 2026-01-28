class SympathyCard extends HTMLElement {
  constructor() {
    super();

    this.checkbox = this.querySelector('#noteTick');
    this.content = this.querySelector('.hand-note-content');
    this.textarea = this.querySelector('#handNote');
    
    if (this.checkbox && this.content && this.textarea) {
      this.checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
      
      // Add input event listener to remove required-custom class when user types
      this.textarea.addEventListener('input', this.handleTextareaInput.bind(this));
    }
    
    window.addEventListener('pplrAddToCartCompleted', this.handleAddToCart.bind(this));
  }

  handleCheckboxChange() {
    const isOpen = this.checkbox.checked;
    
    this.content.classList.toggle('is-open', isOpen);
    this.textarea.disabled = !isOpen;
    
    if (isOpen) {
      this.textarea.focus();
    } else {
      this.textarea.value = '';
      // Remove required-custom class when checkbox is unchecked
      this.removeRequiredClass();
    }
  }

  handleTextareaInput() {
    // Remove required-custom class when user starts typing
    this.removeRequiredClass();
  }
  
  removeRequiredClass() {
    // Remove from textarea itself
    if (this.textarea) {
      this.textarea.classList.remove('required-custom');
    }
    
    // If you have a wrapper/parent element with the class, remove it too
    const wrapper = this.textarea.closest('.hand-note-content, .form-field, .required-field');
    if (wrapper) {
      wrapper.classList.remove('required-custom');
    }
  }

  handleAddToCart(e) {
    if (!this.checkbox || !this.checkbox.checked) return;
    
    // Check if textarea is empty when checkbox is checked
    if (!this.textarea || this.textarea.value.trim() === '') {
      // Add required-custom class to show validation error
      this.showValidationError();
      return;
    }

    const variantId = Number(this.checkbox.value || this.dataset.variantId);
    const form = this.checkbox.form;
    const parentIdElement = form ? form.querySelector('[name="id"]') : null;
    const parentId = parentIdElement ? Number(parentIdElement.value) : null;
    const noteValue = this.textarea?.value || '';

    // Validate that we have a valid variant ID
    if (!variantId || isNaN(variantId)) {
      console.error('Invalid variant ID:', variantId);
      alert('Unable to add sympathy card. Please refresh the page and try again.');
      return;
    }
    
    // Find cart element like product-form does
    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    
    // Prepare item data like product-form
    const itemData = {
      id: variantId,
      quantity: form.quantity
    };
    
    // Add properties for both note and parentId
    itemData.properties = {};
    
    if (noteValue) {
      itemData.properties.Message = noteValue;
    }
    
    // Add parent_id as a line item property when available
    if (parentId) {
      itemData.properties._parent_id = parentId.toString();
    }

    // Try JSON API first (like product-form's multiple items approach)
    const body = {
      items: [itemData]
    };
    
    // Add sections if cart exists (like product-form does)
    if (cart && cart.getSectionsToRender) {
      body.sections = cart.getSectionsToRender().map((section) => section.id);
      body.sections_url = window.location.pathname;
    }

    // Use fetch with proper headers like product-form
    fetch(`${window.routes?.cart_add_url || '/cart/add'}.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(response => {
      this.processCartResponse(response, variantId, cart);
    })
    .catch(error => {
      console.error('Error adding sympathy card via JSON:', error);
      // Fallback to form submission (like product-form's original approach)
      this.fallbackFormSubmission(variantId, noteValue, parentId, cart);
    });
  }
  
  showValidationError() {
    // Add required-custom class to textarea
    if (this.textarea) {
      this.textarea.classList.add('required-custom');
      
      // Optionally add to wrapper/parent element as well
      const wrapper = this.textarea.closest('.hand-note-content, .form-field, .required-field');
      if (wrapper) {
        wrapper.classList.add('required-custom');
      }
      
      // Focus on the textarea
      this.textarea.focus();
    }
    
    // Show an alert message
    alert('Please add a message for your Premium Sympathy Card');
  }
  
  // Fallback to form submission method (similar to product-form's original)
  fallbackFormSubmission(variantId, noteValue, parentId, cart) {
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', 1);
    
    // Add properties as hidden fields
    if (noteValue) {
      formData.append('properties[Message]', noteValue);
    }
    
    // Add parent_id as a property in fallback as well
    if (parentId) {
      formData.append('properties[parent_id]', parentId.toString());
    }
    
    // Add sections if cart exists
    if (cart && cart.getSectionsToRender) {
      formData.append(
        'sections',
        cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append('sections_url', window.location.pathname);
      cart.setActiveElement(document.activeElement);
    }
    
    const config = {
      method: 'POST',
      headers: {
        'X-RequestedWith': 'XMLHttpRequest'
      },
      body: formData
    };
    
    fetch(`${window.routes?.cart_add_url || '/cart/add'}`, config)
      .then(response => response.json())
      .then(response => {
        this.processCartResponse(response, variantId, cart);
      })
      .catch(error => {
        console.error('Error in fallback form submission:', error);
        // Final fallback - simple redirect
        window.location.href = '/cart';
      });
  }
  
  // Process cart response (similar to product-form's handleCartResponse)
  processCartResponse(response, productVariantId, cart) {
    if (cart) {
        cart.classList.remove('is-empty');
    }
    // Check for errors
    if (response.status) {
      // Publish error event if available
      if (window.PUB_SUB_EVENTS && window.publish) {
        publish(PUB_SUB_EVENTS.cartError, {
          source: 'sympathy-card',
          productVariantId: productVariantId,
          errors: response.errors || response.description,
          message: response.message,
        });
      }
      
      // Show error message
      console.error('Failed to add sympathy card:', response.description);
      alert(response.description || 'Unable to add sympathy card. Please try again.');
      return;
    }
    
    // If no cart UI element, redirect to cart page
    if (!cart) {
      window.location.href = window.routes?.cart_url || '/cart';
      return;
    }
    
    // Publish cart update event if available
    if (window.PUB_SUB_EVENTS && window.publish && !this.error) {
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'sympathy-card',
        productVariantId: productVariantId,
        cartData: response,
      });
    }
    
    // Render cart contents if cart has renderContents method
    if (cart.renderContents) {
      cart.renderContents(response);
    } else {
      // Fallback redirect
      window.location.href = window.routes?.cart_url || '/cart';
    }
  }
}

if (!customElements.get('sympathy-card')) {
  customElements.define('sympathy-card', SympathyCard);
}