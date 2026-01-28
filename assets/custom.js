var main = {
    preventDefaultForHashLinks: function() {
        // Get all anchor elements
        var anchorElements = document.querySelectorAll('a[href^="#"]');
    
        // Loop through the anchor elements
        anchorElements.forEach(function(anchor) {
            // Check if the href attribute contains #
            anchor.addEventListener('click', function(event) {
                event.preventDefault();

                // Get the target ID from the href
                var targetId = anchor.getAttribute('href').substring(1); // Remove the #

                // Check if an element with the target ID exists in the DOM
                var targetElement = document.getElementById(targetId);

                if (targetElement) {
                    // Define an offset (adjust this value as needed)
                    var offsetTop = 50; // Change this to your desired offset

                    console.log(offset(targetElement).top)
                    // Scroll to the target element with the specified offset
                    window.scrollTo({
                        top: offset(targetElement).top,
                        behavior: 'smooth' // You can change this to 'auto' for an instant scroll
                    });
                }


                function offset(el) {
                    var rect = el.getBoundingClientRect(),
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
                }
            });
        });
    },
    firstSecHeight: function() {
        if ( document.querySelector('body.template-index main > .shopify-section:first-of-type')) {
            document.documentElement.style.setProperty('--first-sec-height', `${document.querySelector('body.template-index main > .shopify-section:first-of-type').offsetHeight}px`);
        }
    },
    slideAdapt: function() {
        // const activeSlide = document.querySelectorAll('.product__media-item')[0]
        // if (activeSlide) {
        //     slideAdapt(activeSlide)
        // }

        document.querySelectorAll('.slide-adaptable').forEach(e=> {

            e.addEventListener('slideChanged', function(evt) {
                slideAdapt(evt.detail)
            })

            contentHeight = e.querySelector('.slider__slide > *').offsetHeight 
            slideList = e.querySelector('.slider')
            
            if (contentHeight && slideList) {
                slideList.style.height = contentHeight + 'px';
            }
        })
        
        function slideAdapt(e) {

            var contentHeight = 0
            var slideList = 0

            if (typeof(e.currentElement) != "undefined") {

                contentHeight = e.currentElement?.querySelector('.slider__slide > *').offsetHeight 
                slideList = e.currentElement.closest('.slider') 
            } else {
                contentHeight = e.querySelector('.slider__slide > *').offsetHeight 
                slideList = e.closest('.slider')
            }

            slideList.style.height = contentHeight + 'px';
        }
    }
}

main.preventDefaultForHashLinks()
main.slideAdapt()


document.getElementById('noteTick')?.addEventListener('change', function(e) {

    const textArea = document.querySelector('.pplr-personalized-gift-note textarea');

    if (textArea == null) return;
    
    const staticTextArea = document.getElementById('handNote')
    if (this.checked) {
        textArea.dispatchEvent(new Event('change'));
        textArea.value = staticTextArea.value;
        staticTextArea.removeAttribute('disabled')
    } else {
        textArea.value = ''
        staticTextArea.setAttribute('disabled','')
    }
})

const checkInterval = setInterval(() => {
  const previewBtn = document.querySelector('.pplr-preview-btn');
  const mainBtn = document.querySelector('.preview-button');

  if (previewBtn) {
    // Element found — stop checking
    clearInterval(checkInterval);
  } else if (mainBtn) {
    // Hide if not found
    mainBtn.hidden = true;
  }
}, 500);

const checkGiftNote = setInterval(() => {
  const giftNote = document.querySelector('.pplr-personalized-gift-note textarea')
  const sympathyCard = document.querySelector('.pplr-premium-sympathy-card textarea')
  const staticTextArea = document.querySelector('.hand-note')

  if ((giftNote || sympathyCard) && staticTextArea) {
    staticTextArea.removeAttribute('hidden')
    clearInterval(checkGiftNote)
  }
}, 500)


// Listen for the pplrAddToCartCompleted custom event
window.addEventListener('pplrAddToCartCompleted' , function(e) {
    // check if the add to cart event has fired
    console.log(e)
})

subscribe('variant-change', (eventData) => {
    // Log the event data
    const variant = eventData.data.variant
    activeGallery(variant)

    if (document.querySelector('sympathy-card')) {
        document.querySelector('sympathy-card').dataset.for = variant.title
    }
})

if (document.querySelector('.selected-variant-obj') != null) {
    const variant = JSON.parse(document.querySelector('.selected-variant-obj').textContent)

    activeGallery(variant)
}

function handleize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function handleize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function activeGallery(variant) {
  if (!variant || !variant.option1) return

  const variantHandle = handleize(variant.option1)

  document.querySelectorAll('[data-alt]').forEach((el) => {
    const alt = el.dataset.alt
    if (!alt) return

    const parts = alt.split('_')
    const lastPart = parts[parts.length - 1]

    if (lastPart === variantHandle) {
      // match → ensure class is removed
      el.classList.remove('thumbnail-list_item--variant')
    } else {
      // no match → add class
      el.classList.add('thumbnail-list_item--variant')
    }
  })
}

class StickyProductCTA extends HTMLElement {
    constructor() {
        super();
        if (!Shopify.designMode) {
            this.initObserver();
        }
    }

    initObserver() {
        const productButtons = document.querySelector('.product-form__buttons');

        if (!productButtons) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.classList.remove('active');
                } else {
                    this.classList.add('active');
                }
            });
        });

        observer.observe(productButtons);
    }
}

customElements.define('sticky-product-cta', StickyProductCTA);


subscribe('cart-update', (eventData) => {
    if (eventData.source == 'cart-items') {
        eventSympathyCardCleanup(eventData);
    }
});

function eventSympathyCardCleanup(eventData) {
    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

    if (!eventData.cartData || !cart) return;
    
    // Get cart data from the sections response (same as eventFormAdd)
    if (!eventData.cartData.sections || !eventData.cartData.sections['cart-drawer']) return;

    const cartDrawerHTML = eventData.cartData.sections['cart-drawer'];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cartDrawerHTML;
    
    // Find the cart-data noscript element
    const cartDataElement = tempDiv.querySelector('.cart-data');
    if (!cartDataElement) return;

    try {
        const fullCartData = JSON.parse(cartDataElement.textContent);
        const cartItems = fullCartData.items || [];
        
        // Check if cart is empty
        if (cartItems.length === 0) {
            const cartDrawer = document.querySelector('cart-drawer');
            if (cartDrawer) {
                cartDrawer.classList.add('is-empty');
            }
            return; // No need to check for orphaned cards if cart is empty
        }
        
        // Find all parent variant IDs currently in the cart
        const parentVariantIdsInCart = new Set();
        cartItems.forEach(item => {
            parentVariantIdsInCart.add(String(item.variant_id));
        });
        
        // Find sympathy cards that have orphaned parent products
        const updatesToMake = [];

        cartItems.forEach(item => {
            const properties = item.properties || {};
            const parentId = properties._parent_id;

            // Check if this is a sympathy card with a parent_id property
            if (parentId && parentId !== '') {
                // If parent product is not in cart, mark this card for removal (set quantity to 0)
                if (!parentVariantIdsInCart.has(String(parentId))) {
                    updatesToMake.push({ [item.variant_id]: 0 });
                }
            }
        });
        
        // If no orphaned cards, return
        if (updatesToMake.length === 0) return;
        
        // Remove orphaned sympathy cards
        const formData = new FormData();
        
        updatesToMake.forEach(update => {
            Object.entries(update).forEach(([id, quantity]) => {
                formData.append(`updates[${id}]`, quantity);
            });
        });

        if (cart) {
            formData.append(
                'sections',
                cart.getSectionsToRender().map((section) => section.id)
            );
            formData.append('sections_url', window.location.pathname);
        }

        fetch(window.Shopify.routes.root + 'cart/update.js', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then((response) => {
            cart.renderContents(response);
            
            // Check if cart is now empty after removing sympathy cards
            if (response.item_count === 0) {
                if (cart) {
                    cart.classList.add('is-empty');
                }
            }
            
            // Optional: Show notification
            if (updatesToMake.length > 0) {
                console.log(`Removed ${updatesToMake.length} sympathy card${updatesToMake.length > 1 ? 's' : ''} because related product${updatesToMake.length > 1 ? 's were' : ' was'} removed`);
            }
        }).catch(console.error);
    } catch (e) {
        console.error('Error in sympathy card cleanup:', e);
    }
}