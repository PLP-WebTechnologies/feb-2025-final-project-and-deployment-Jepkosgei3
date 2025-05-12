// Cart functionality and checkout system
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart from localStorage or empty array
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // DOM Elements
    const cartCountElements = document.querySelectorAll('.cart-count');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const paymentProcessingModal = document.getElementById('payment-processing');
    const paymentSuccessModal = document.getElementById('payment-success');
    const checkoutForm = document.getElementById('checkout-form');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    const continueShoppingBtn = document.getElementById('continue-shopping');
    const closeModalButtons = document.querySelectorAll('.close-modal');

    // Initialize the page
    updateCartCount();
    if (cartItemsContainer) renderCartItems();
    setupEventListeners();

    // Core Functions
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElements.forEach(el => el.textContent = count);
    }

    function renderCartItems() {
        let totalAmount = 0;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            totalAmountElement.textContent = '0.00';
            return;
        }
        
        cartItemsContainer.innerHTML = '';
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <img src="https://via.placeholder.com/100x100?text=${encodeURIComponent(item.name)}" alt="${item.name}">
                    <div>
                        <h3>${item.name}</h3>
                        <p class="price">$${item.price.toFixed(2)}</p>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        totalAmountElement.textContent = totalAmount.toFixed(2);
        setupCartItemButtons();
    }

    function setupCartItemButtons() {
        // Quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const item = cart.find(item => item.id === productId);
                
                if (this.classList.contains('plus')) {
                    item.quantity += 1;
                } else if (this.classList.contains('minus') && item.quantity > 1) {
                    item.quantity -= 1;
                }
                
                saveCart();
                renderCartItems();
                updateCartCount();
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                cart = cart.filter(item => item.id !== productId);
                saveCart();
                renderCartItems();
                updateCartCount();
            });
        });
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function processCheckout(formData) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                const paymentMethod = formData.get('payment');
                let message = '';
                
                if (paymentMethod === 'mpesa') {
                    const mpesaNumber = formData.get('mpesa-phone');
                    message = `Ksh ${totalAmountElement.textContent} has been deducted from MPesa number ${mpesaNumber}.`;
                } else {
                    message = `Please complete your bank transfer and upload the receipt.`;
                }
                
                resolve({
                    success: true,
                    message: `Thank you for your purchase, ${formData.get('name')}!<br>
                              ${message}<br>
                              A confirmation has been sent to ${formData.get('email')}.`
                });
            }, 3000);
        });
    }

    function resetCheckoutForm() {
        if (checkoutForm) checkoutForm.reset();
    }

    function clearCart() {
        cart = [];
        saveCart();
        updateCartCount();
        if (cartItemsContainer) renderCartItems();
    }

    function setupEventListeners() {
        // Add to cart buttons
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productId = productCard.getAttribute('data-id');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
                
                const existingItem = cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        quantity: 1
                    });
                }
                
                saveCart();
                updateCartCount();
                
                // Visual feedback
                this.textContent = 'Added!';
                this.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    this.textContent = 'Add to Cart';
                    this.style.backgroundColor = '';
                }, 1000);
            });
        });
        
        // Checkout button
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (cart.length === 0) {
                    alert('Your cart is empty');
                    return;
                }
                checkoutModal.style.display = 'block';
            });
        }
        
        // Payment method toggle
        paymentMethods.forEach(radio => {
            radio.addEventListener('change', function() {
                document.getElementById('processing-text').textContent = 
                    `Processing ${this.value.toUpperCase()} payment...`;
            });
        });
        
        // Form submission
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const paymentMethod = formData.get('payment');
                
                // Validate MPesa number if selected
                if (paymentMethod === 'mpesa') {
                    const mpesaNumber = formData.get('mpesa-phone');
                    if (!mpesaNumber || mpesaNumber.length < 10) {
                        alert('Please enter a valid MPesa number');
                        return;
                    }
                }
                
                // Show processing modal
                checkoutModal.style.display = 'none';
                paymentProcessingModal.style.display = 'block';
                
                try {
                    const result = await processCheckout(formData);
                    
                    if (result.success) {
                        paymentProcessingModal.style.display = 'none';
                        document.getElementById('success-message').innerHTML = result.message;
                        paymentSuccessModal.style.display = 'block';
                        clearCart();
                        resetCheckoutForm();
                    }
                } catch (error) {
                    console.error('Payment processing error:', error);
                    paymentProcessingModal.style.display = 'none';
                    alert('Payment failed. Please try again.');
                }
            });
        }
        
        // Modal close buttons
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        // Continue shopping button
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', function() {
                paymentSuccessModal.style.display = 'none';
                window.location.href = 'products.html';
            });
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
});