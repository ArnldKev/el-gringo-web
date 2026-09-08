// Estado de la carta y el carrito.
let activeCategory = 'Todos';
let cart = {};
let menuQuantities = {};

const DELIVERY_TAPER_PRICE = 1;
const FULL_CHICKEN_NAME = 'Pollo Entero a la Brasa';

const money = (amount) => `S/ ${amount.toFixed(2)}`;

function refreshIcons() {
  lucide.createIcons();
}

// Carta
function setCategory(category) {
  activeCategory = category;
  renderFilters();
  renderProducts();
}

function renderFilters() {
  const filters = categories.map((category) => {
    const isActive = category === activeCategory ? 'active' : '';

    return `
      <button class="filter ${isActive}" onclick="setCategory('${category}')">
        ${category}
      </button>
    `;
  });

  document.getElementById('filters').innerHTML = filters.join('');
}

function renderProducts() {
  const visibleProducts = products.filter((product) => {
    return activeCategory === 'Todos' || product.category === activeCategory;
  });
  const productGrid = document.getElementById('productGrid');

  if (!visibleProducts.length) {
    productGrid.innerHTML = '<p class="no-results">No hay platos en esta categoria por ahora.</p>';
    return;
  }

  productGrid.innerHTML = visibleProducts.map(renderProductCard).join('');
  refreshIcons();
}

function renderProductCard(product) {
  const selectedQuantity = menuQuantities[product.id] || 1;

  return `
    <article class="dish">
      <div class="dish-img" style="background-image:url('${imgs[product.category]}')"></div>
      <div class="dish-cat">${product.category}</div>
      <div class="dish-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="dish-footer">
          <span class="price">${money(product.price)}</span>
          <div class="menu-quantity">
            <button onclick="changeMenuQty(${product.id}, -1)" aria-label="Restar una unidad de ${product.name}">
              <i data-lucide="minus" size="14"></i>
            </button>
            <span>${selectedQuantity}</span>
            <button onclick="changeMenuQty(${product.id}, 1)" aria-label="Sumar una unidad de ${product.name}">
              <i data-lucide="plus" size="14"></i>
            </button>
          </div>
          <button class="add" onclick="addToCart(${product.id})" aria-label="Agregar ${product.name}">
            <i data-lucide="shopping-bag" size="15"></i>Agregar
          </button>
        </div>
      </div>
    </article>
  `;
}

function changeMenuQty(productId, change) {
  const currentQuantity = menuQuantities[productId] || 1;
  menuQuantities[productId] = Math.max(1, currentQuantity + change);
  renderProducts();
}

// Carrito
function addToCart(productId) {
  const selectedQuantity = menuQuantities[productId] || 1;
  cart[productId] = (cart[productId] || 0) + selectedQuantity;
  menuQuantities[productId] = 1;

  renderProducts();
  renderCart();
}

function changeQty(productId, change) {
  const newQuantity = (cart[productId] || 0) + change;

  if (newQuantity <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = newQuantity;
  }

  renderCart();
}

function toggleCart(isOpen) {
  document.getElementById('drawer').classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function renderCart() {
  const entries = Object.entries(cart);
  const productQuantity = entries.reduce((total, [, quantity]) => total + quantity, 0);
  const cartTotal = entries.reduce((total, [productId, quantity]) => {
    return total + products[productId].price * quantity;
  }, 0);

  document.getElementById('cartCount').textContent = productQuantity;
  document.getElementById('cartTotal').textContent = money(cartTotal);
  document.getElementById('checkoutButton').disabled = !productQuantity;
  document.getElementById('cartItems').innerHTML = entries.length
    ? entries.map(renderCartLine).join('')
    : `
      <div class="empty">
        <i data-lucide="shopping-bag" size="34"></i>
        <p>Tu pedido esta esperando sus favoritos.</p>
      </div>
    `;

  refreshIcons();
}

function renderCartLine([productId, quantity]) {
  const product = products[productId];
  const lineTotal = product.price * quantity;

  return `
    <div class="cart-line">
      <div>
        <h4>${product.name}</h4>
        <small>${money(product.price)} c/u</small>
        <div class="quantity">
          <button onclick="changeQty(${productId}, -1)" aria-label="Restar">
            <i data-lucide="minus" size="14"></i>
          </button>
          <span>${quantity}</span>
          <button onclick="changeQty(${productId}, 1)" aria-label="Sumar">
            <i data-lucide="plus" size="14"></i>
          </button>
        </div>
      </div>
      <div class="line-total">
        ${money(lineTotal)}
        <br>
        <button class="icon-only" onclick="changeQty(${productId}, -${quantity})" aria-label="Eliminar ${product.name}">
          <i data-lucide="trash-2" size="16"></i>
        </button>
      </div>
    </div>
  `;
}

// Checkout y delivery
function getOrderCosts() {
  const entries = Object.entries(cart);
  const subtotal = entries.reduce((total, [productId, quantity]) => {
    return total + products[productId].price * quantity;
  }, 0);
  const isDelivery = document.getElementById('deliveryType').value === 'delivery';
  const taperCount = isDelivery ? getTaperCount(entries) : 0;
  const taperFee = taperCount * DELIVERY_TAPER_PRICE;

  return {
    subtotal,
    taperCount,
    taperFee,
    total: subtotal + taperFee,
    isDelivery,
  };
}

function getTaperCount(entries) {
  return entries.reduce((total, [productId, quantity]) => {
    const product = products[productId];
    const needsTaper = product.category !== 'Bebidas' && product.name !== FULL_CHICKEN_NAME;

    return needsTaper ? total + quantity : total;
  }, 0);
}

function updateCheckout() {
  const { subtotal, taperCount, taperFee, total, isDelivery } = getOrderCosts();
  const deliveryFields = document.querySelectorAll('.delivery-field');

  deliveryFields.forEach((field) => {
    field.hidden = !isDelivery;
  });
  document.getElementById('deliveryNote').hidden = !isDelivery;
  document.getElementById('address').required = isDelivery;

  const itemLines = Object.entries(cart).map(([productId, quantity]) => {
    const product = products[productId];
    return `${quantity}x ${product.name} (${money(product.price * quantity)})`;
  });
  const taperLine = isDelivery
    ? `<br>Tapers (${taperCount} x S/ 1.00): ${money(taperFee)}`
    : '';

  document.getElementById('orderSummary').innerHTML = `
    <strong>Resumen del pedido</strong><br>
    ${itemLines.join('<br>')}<br><br>
    Subtotal: ${money(subtotal)}${taperLine}<br>
    <strong>Total: ${money(total)}</strong>
  `;

  refreshIcons();
}

function openCheckout() {
  if (!Object.keys(cart).length) {
    return;
  }

  toggleCart(false);
  updateCheckout();
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

function submitOrder(event) {
  event.preventDefault();

  const name = document.getElementById('customerName').value.trim() || 'No indicado';
  const address = document.getElementById('address').value.trim() || 'No indicada';
  const reference = document.getElementById('reference').value.trim() || 'No indicada';
  const payment = document.getElementById('payment').value;
  const { subtotal, taperCount, taperFee, total, isDelivery } = getOrderCosts();

  const orderLines = Object.entries(cart).map(([productId, quantity]) => {
    const product = products[productId];
    return `- ${quantity}x ${product.name} (${money(product.price * quantity)})`;
  });
  const deliveryLines = isDelivery
    ? [
        'Tipo de entrega: Delivery',
        `Tapers (${taperCount} x S/ 1.00): ${money(taperFee)}`,
        `Direccion: ${address}`,
        `Referencia: ${reference}`,
      ]
    : ['Tipo de entrega: Recojo en local'];

  const message = [
    'Hola, quisiera realizar el siguiente pedido:',
    '',
    ...orderLines,
    '',
    `Subtotal: ${money(subtotal)}`,
    ...deliveryLines,
    `Total: ${money(total)}`,
    `Nombre: ${name}`,
    `Pago: ${payment}`,
  ].join('\n');

  window.open(`https://wa.me/51914499760?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

// Eventos de cierre y carga inicial.
document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
document.getElementById('drawer').addEventListener('click', (event) => {
  if (event.target.id === 'drawer') {
    toggleCart(false);
  }
});
document.getElementById('checkoutModal').addEventListener('click', (event) => {
  if (event.target.id === 'checkoutModal') {
    closeCheckout();
  }
});

renderFilters();
renderProducts();
renderCart();
refreshIcons();
