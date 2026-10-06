function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateBasketCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const el = document.getElementById('cartCount');
  if (!el) return; // на странице корзины этого элемента может не быть — выходим

  el.textContent = count;

  if (count === 0) {
    el.classList.add('hidden');
  } else {
    el.classList.remove('hidden');
  }
}

// Рисуем корзину
function renderCart() {
  updateBasketCount();
  const list = document.querySelector('.cart-list');
  if (!list) return;

  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = '<p>Корзина пуста</p>';
    const totalEl = document.querySelector('.cart-total');
    if (totalEl) totalEl.textContent = '';
    renderOrder(); // важно: обновить и блок заказа тоже
    return;
  }

  list.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    const el = document.createElement('article');
    el.className = 'cart-item';
    el.dataset.id = item.id;
    el.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.price} ₽ × ${item.qty} = ${item.price * item.qty} ₽</p>
      <button data-action="plus">+</button>
      <button data-action="minus">−</button>
      <button data-action="remove">Удалить</button>
    `;
    list.appendChild(el);
  });

  const totalEl = document.querySelector('.cart-total');
  if (totalEl) totalEl.textContent = `Итого: ${total} ₽`;

  renderOrder();
}

// Рисуем блок оформления заказа и заполняем скрытые поля
function renderOrder() {
  const cart = getCart();
  const itemsEl = document.querySelector('.order-items');
  const totalEl = document.querySelector('.order-total');
  if (!itemsEl) return;

  const form = document.getElementById('order-form');

  if (cart.length === 0) {
    itemsEl.textContent = 'Корзина пуста — нечего оформлять.';
    if (totalEl) totalEl.textContent = '';
    if (form) form.style.display = 'none';
    return;
  }

  if (form) form.style.display = '';

  let total = 0;
  itemsEl.innerHTML = cart
    .map(item => {
      total += item.price * item.qty;
      return `<p>${item.name} — ${item.qty} шт. × ${item.price} ₽</p>`;
    })
    .join('');

  if (totalEl) totalEl.textContent = `Итого: ${total} ₽`;

  const details = cart
    .map(item => `${item.name} — ${item.qty} шт. × ${item.price} ₽`)
    .join('; ');
  const detailsInput = document.getElementById('order-details');
  const sumInput = document.getElementById('order-sum');
  if (detailsInput) detailsInput.value = details;
  if (sumInput) sumInput.value = total + ' ₽';
}

// Добавление товара
function addToCart(card) {
  const cart = getCart();
  const id = card.dataset.id;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: id,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      qty: 1
    });
  }

  saveCart(cart);
  renderCart();
}

// Кнопки «В корзину»
const buttons = document.querySelectorAll('.button');
if (buttons.length > 0) {
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.card');
      addToCart(card);
    });
  });
}

// Кнопки +, −, Удалить в корзине
const cartList = document.querySelector('.cart-list');
if (cartList) {
  cartList.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;

    const itemEl = btn.closest('.cart-item');
    const id = itemEl.dataset.id;
    const cart = getCart();
    const item = cart.find(i => i.id === id);

    if (btn.dataset.action === 'plus') item.qty += 1;
    if (btn.dataset.action === 'minus') {
      item.qty -= 1;
      if (item.qty === 0) cart.splice(cart.indexOf(item), 1);
    }
    if (btn.dataset.action === 'remove') cart.splice(cart.indexOf(item), 1);

    saveCart(cart);
    renderCart();
  });
}

// Отправка формы
const form = document.getElementById('order-form');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = document.getElementById('order-status');
    const btn = form.querySelector('button');
    btn.disabled = true;
    status.textContent = 'Отправляем заказ...';

    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json  ' }
    });

    if (response.ok) {
      localStorage.removeItem('cart');
      alert('Заказ оформлен! «Спасибо, что обратились к нам! Мы внимательно изучили ваше сообщение и уже передали его администратору. В ближайшее время он свяжется с вами, чтобы обсудить детали и помочь с решением вопроса.»');
      status.textContent = 'Заказ отправлен!';
      form.reset();
      renderCart();
    } else {
      status.textContent = 'Не удалось отправить заказ, попробуйте ещё раз.';
      btn.disabled = false;
    }
  });
}

renderCart();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    renderCart();
  }
});

document.addEventListener('DOMContentLoaded', updateBasketCount);


//button
const addButtons = document.querySelectorAll('.btn-add-to-cart');

addButtons.forEach(btn => {
  const originalText = btn.getAttribute('data-added') || 'В корзину';

  btn.addEventListener('click', () => {
    btn.classList.add('added');
    btn.textContent = 'Добавлено ✅';

    setTimeout(() => {
      btn.classList.remove('added');
      btn.textContent = originalText;
    }, 3500);
  });
});


