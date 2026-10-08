// ===== Хранилище корзины =====
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
  if (!el) return;

  el.textContent = count;
  if (count === 0) {
    el.classList.add('hidden');
  } else {
    el.classList.remove('hidden');
  }
}

// ===== Отрисовка корзины =====
function renderCart() {
  updateBasketCount();
  const list = document.querySelector('.cart-list');
  if (!list) return;

  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = '<p>Корзина пуста</p>';
    const totalEl = document.querySelector('.cart-total');
    if (totalEl) totalEl.textContent = '';
    renderOrder();
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

// ===== Блок оформления заказа =====
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

// ===== Добавление товара (с количеством) =====
function addToCart(card, qty = 1) {
  const cart = getCart();
  const id = card.dataset.id;
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: id,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      qty: qty
    });
  }

  saveCart(cart);
  renderCart();
}

// ===== Каталог: счётчик +, − и кнопка «В корзину» (делегирование) =====
const catalog = document.querySelector('.catalog');

if (catalog) {
  catalog.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;

    const card = btn.closest('.card');
    if (!card) return;

    if (btn.dataset.action === 'minus' || btn.dataset.action === 'plus') {
      const qtyEl = card.querySelector('.qty-value');
      let qty = Number(qtyEl.textContent);

      if (btn.dataset.action === 'plus') {
        qty += 1;
      } else if (qty > 1) {
        qty -= 1;
      }

      qtyEl.textContent = qty;
      return;
    }

    if (btn.classList.contains('btn-add-to-cart')) {
      const qtyEl = card.querySelector('.qty-value');
      const qty = qtyEl ? Number(qtyEl.textContent) : 1;

      addToCart(card, qty);

      const originalText = btn.getAttribute('data-added') || 'В корзину';
      btn.classList.add('added');
      btn.textContent = 'Добавлено ✅';

      setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = originalText;
      }, 3500);
    }
  });
}

// ===== Кнопки +, −, Удалить в корзине =====
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

// ===== Отправка формы =====
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
      headers: { Accept: 'application/json' }
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

// ===== Инициализация =====
renderCart();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    renderCart();
  }
});

document.addEventListener('DOMContentLoaded', updateBasketCount);


//------------------КНОПКА ПРОДУКЦИЯ С ВЫПОДАЮЩИМ СПИСКОМ___-------
const dropdown = document.querySelector('.dropdown');
const toggle = dropdown.querySelector('.dropdown__toggle');

// Клик по кнопке — открыть/закрыть меню
toggle.addEventListener('click', (e) => {
  e.stopPropagation(); // чтобы клик не «улетел» в document
  dropdown.classList.toggle('open');
});

// Клик по пункту меню — закрыть меню
dropdown.querySelectorAll('.dropdown__menu a').forEach(link => {
  link.addEventListener('click', () => dropdown.classList.remove('open'));
});

// Клик мимо меню — закрыть
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
});
