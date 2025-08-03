// Global variables
let currentOrder = {
    package: null,
    gameId: '',
    nickname: '',
    paymentMethod: '',
    paymentProof: null,
    senderName: '',
    paymentTime: '',
    status: 'pending',
    orderId: generateOrderId()
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    setupFileUpload();
    
    // Check for orderId in localStorage
    const savedOrderId = localStorage.getItem('currentOrderId');
    if (savedOrderId) {
        checkOrderStatus(savedOrderId);
    }
});

// Generate random order ID
function generateOrderId() {
    return 'FF' + Date.now().toString().slice(-8) + Math.floor(1000 + Math.random() * 9000);
}

// Setup file upload preview
function setupFileUpload() {
    document.getElementById('paymentProof').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('proofImage').src = event.target.result;
                document.getElementById('proofPreview').style.display = 'block';
                currentOrder.paymentProof = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Render diamond packages
async function renderProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '';
        
        products.forEach(pkg => {
            const packageCard = document.createElement('div');
            packageCard.className = 'package-card';
            packageCard.innerHTML = `
                <h3>${pkg.diamonds} Diamonds</h3>
                <div class="price">Rp ${pkg.price.toLocaleString()}</div>
                <button class="btn" onclick="selectPackage(${pkg.diamonds}, ${pkg.price}, '${pkg.id}')">Buy Now</button>
            `;
            productsGrid.appendChild(packageCard);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please try again later.');
    }
}

// Select a diamond package
function selectPackage(diamonds, price, packageId) {
    currentOrder.package = { diamonds, price, id: packageId };
    document.getElementById('selectedPackage').value = `${diamonds} Diamonds - Rp ${price}`;
    document.getElementById('selected-package-text').textContent = `${diamonds} Diamonds - Rp ${price.toLocaleString()}`;
    showPage('checkout');
}

// Show a specific page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
}

// Show payment options after form submission
function showPaymentOptions() {
    const gameId = document.getElementById('gameId').value;
    const nickname = document.getElementById('nickname').value;
    
    if (gameId && nickname) {
        currentOrder.gameId = gameId;
        currentOrder.nickname = nickname;
        showPage('payment');
    } else {
        alert('Please fill in your game ID and nickname');
    }
}

// Show DANA payment link
function showPaymentLink(method) {
    currentOrder.paymentMethod = method;
    
    if (method === 'dana') {
        document.getElementById('paymentLink').style.display = 'block';
        document.getElementById('qrisDisplay').style.display = 'none';
        
        const paymentLinkAnchor = document.getElementById('paymentLinkAnchor');
        paymentLinkAnchor.textContent = `Pay with DANA (Rp ${currentOrder.package.price.toLocaleString()})`;
        paymentLinkAnchor.href = `/api/payment/dana?amount=${currentOrder.package.price}&orderId=${currentOrder.orderId}`;
    }
}

// Show QRIS payment
async function showQRISPayment() {
    currentOrder.paymentMethod = 'QRIS';
    document.getElementById('paymentLink').style.display = 'none';
    
    try {
        const response = await fetch(`/api/payment/qris?amount=${currentOrder.package.price}&orderId=${currentOrder.orderId}`);
        const data = await response.json();
        
        const qrisDisplay = document.getElementById('qrisDisplay');
        qrisDisplay.style.display = 'block';
        
        document.getElementById('qrisImage').src = data.qrCodeUrl;
        document.getElementById('qrisAmount').textContent = `Rp ${currentOrder.package.price.toLocaleString()}`;
    } catch (error) {
        console.error('Error generating QRIS:', error);
        alert('Failed to generate QRIS code. Please try again.');
    }
}

// Show confirmation form
function showConfirmationForm() {
    showPage('confirmationForm');
}

// Confirm payment and send data
async function confirmPayment() {
    const senderName = document.getElementById('senderName').value;
    const paymentTime = document.getElementById('paymentTime').value;
    
    if (!currentOrder.paymentProof || !senderName || !paymentTime) {
        alert('Please complete all required fields');
        return;
    }
    
    currentOrder.senderName = senderName;
    currentOrder.paymentTime = paymentTime;
    
    // Show status page
    showPage('statusPage');
    
    try {
        // Save order to localStorage
        localStorage.setItem('currentOrderId', currentOrder.orderId);
        
        // Send confirmation to server
        const response = await fetch('/api/orders/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentOrder)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            updateStatusUI('success', 'Payment Verified', 'Your payment has been confirmed and diamonds will be processed shortly.');
            
            // Send notifications
            await sendNotifications(currentOrder);
            
            // Clear current order
            localStorage.removeItem('currentOrderId');
        } else {
            updateStatusUI('failed', 'Payment Verification Failed', result.message || 'Please contact customer support.');
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        updateStatusUI('failed', 'Error Occurred', 'Failed to confirm payment. Please try again or contact support.');
    }
}

// Update status UI
function updateStatusUI(status, title, message) {
    const icon = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const messageEl = document.getElementById('statusMessage');
    const button = document.getElementById('statusButton');
    
    icon.innerHTML = `<i class="fas fa-${status === 'success' ? 'check-circle' : 'times-circle'}"></i>`;
    icon.firstChild.className = `fas fa-${status === 'success' ? 'check-circle' : 'times-circle'} status-${status}`;
    titleEl.textContent = title;
    titleEl.className = `status-${status}`;
    messageEl.textContent = message;
    button.style.display = 'block';
    
    // Display order details
    displayOrderDetails();
}

// Display order details
function displayOrderDetails() {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${currentOrder.orderId}</p>
        <p><strong>Package:</strong> ${currentOrder.package.diamonds} Diamonds</p>
        <p><strong>Amount:</strong> Rp ${currentOrder.package.price.toLocaleString()}</p>
        <p><strong>Game ID:</strong> ${currentOrder.gameId}</p>
        <p><strong>Nickname:</strong> ${currentOrder.nickname}</p>
        <p><strong>Payment Method:</strong> ${currentOrder.paymentMethod}</p>
    `;
}

// Check order status
async function checkOrderStatus(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        const data = await response.json();
        
        if (data.status === 'completed') {
            currentOrder = data.order;
            showPage('statusPage');
            updateStatusUI('success', 'Payment Verified', 'Your payment has been confirmed and diamonds have been processed.');
            displayOrderDetails();
            localStorage.removeItem('currentOrderId');
        } else if (data.status === 'pending') {
            currentOrder = data.order;
            showPage('statusPage');
            updateStatusUI('pending', 'Payment Pending', 'Your payment is still being processed. Please wait...');
            displayOrderDetails();
            
            // Check again after 5 seconds
            setTimeout(() => checkOrderStatus(orderId), 5000);
        }
    } catch (error) {
        console.error('Error checking order status:', error);
    }
}

// Send notifications
async function sendNotifications(order) {
    try {
        // Send email notification
        await fetch('/api/notifications/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: 'mariatin738@gmail.com',
                subject: `New FF TopUp Order - ${order.orderId}`,
                message: `You have a new order:
Order ID: ${order.orderId}
Package: ${order.package.diamonds} Diamonds
Amount: Rp ${order.package.price.toLocaleString()}
Game ID: ${order.gameId}
Nickname: ${order.nickname}
Payment Method: ${order.paymentMethod}`
            })
        });
        
        // Send WhatsApp notification
        await fetch('/api/notifications/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: '6283843028605',
                message: `New FF TopUp Order:
ID: ${order.orderId}
Diamonds: ${order.package.diamonds}
Amount: Rp ${order.package.price.toLocaleString()}
Game ID: ${order.gameId}`
            })
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
          }
