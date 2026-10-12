// ===== Хранилище корзины =====
function getCart() {
  const raw = localStorage.getItem('cart');
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ===== Подсчёт количества товаров в счётчике (шапка) =====
function updateBasketCount() {
  const cart = getCart();
  // Считаем количество штук (для счётчика в шапке)
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  const el = document.getElementById('cartCount');
  if (!el) return;

  el.textContent = count;
  if (count === 0) {
    el.classList.add('hidden');
  } else {
    el.classList.remove('hidden');
  }
}

// ===== НОВАЯ ФУНКЦИЯ: подсчёт общего веса =====
function updateTotalWeight() {
  const cart = getCart();
  const totalEl = document.querySelector('.cart-weight-total');

  if (!totalEl) return; // Если блока нет на странице — выходим

  let totalWeight = 0;

  cart.forEach(item => {
    // item.qty — это у тебя сейчас количество штук.
    // ВАЖНО: если ты хочешь, чтобы тут считался именно ВЕС, 
    // то в addToCart нужно передавать вес, а не штуки.
    // Пока считаем, что qty = вес в кг (как мы договаривались).
    const weight = parseFloat(item.qty) || 0;
    totalWeight += weight;
  });

  // Округляем до 1 знака
  const formattedWeight = totalWeight.toFixed(1);
  
  totalEl.textContent = `Итого: ${formattedWeight} кг`;

  // Бонус: меняем цвет и добавляем класс, если набрали 8+ кг
  const container = totalEl.closest('.order') || document.body;

  if (totalWeight >= 8) {
    totalEl.style.color = '#430606'; 
    container.classList.add('heavy-cart');
    // Тут можно добавить текст про бесплатную доставку, если нужно
     totalEl.textContent += ' — доставка бесплатная! 🎉';
  } else {
    totalEl.style.color = ''; // Сброс цвета
    container.classList.remove('heavy-cart');
  }
}

// ===== Отрисовка корзины (список товаров) =====
function renderCart() {
  updateBasketCount();
  updateTotalWeight(); // <--- ГЛАВНОЕ ИЗМЕНЕНИЕ: вызываем подсчёт веса здесь

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
      <p>${item.price} ₽ × ${item.qty} = ${(item.price * item.qty).toFixed(0)} ₽</p>
      <button data-action="plus">+</button>
      <button data-action="minus">−</button>
      <button data-action="remove">Удалить</button>
    `;
    list.appendChild(el);
  });

  const totalEl = document.querySelector('.cart-total');
  if (totalEl) totalEl.textContent = `Итого: ${total.toFixed(0)} ₽`;

  renderOrder();
}

// ===== Блок оформления заказа (дублирование состава для формы) =====
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

  if (totalEl) totalEl.textContent = `Итого: ${total.toFixed(0)} ₽`;

  const details = cart
    .map(item => `${item.name} — ${item.qty} шт. × ${item.price} ₽`)
    .join('; ');
    
  const detailsInput = document.getElementById('order-details');
  const sumInput = document.getElementById('order-sum');
  
  if (detailsInput) detailsInput.value = details;
  if (sumInput) sumInput.value = total.toFixed(0) + ' ₽';
}

// ===== Добавление товара в корзину =====
function addToCart(card, qty = 1) {
  const cart = getCart();
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  // ВАЖНО: здесь мы кладём в qty именно то, что ты передаёшь.
  // Если ты хочешь хранить вес, то при клике на "В корзину" 
  // нужно брать data-weight и умножать на количество штук.
  
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: id,
      name: name,
      price: price,
      qty: qty // <-- сюда попадает либо "штуки", либо "кг"
    });
  }

  saveCart(cart);
  renderCart();
}

// ===== Каталог: обработка кликов (количество и кнопка) =====
const catalog = document.querySelector('.catalog');
if (catalog) {
  catalog.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;

    const card = btn.closest('.card');
    if (!card) return;

    // Кнопки + и - в карточке (меняют только счётчик, не добавляют в корзину)
    if (btn.dataset.action === 'minus' || btn.dataset.action === 'plus') {
      const qtyEl = card.querySelector('.qty-value');
      if (!qtyEl) return;
      
      let qty = Number(qtyEl.textContent);
      if (btn.dataset.action === 'plus') {
        qty += 1;
      } else if (qty > 1) {
        qty -= 1;
      }
      qtyEl.textContent = qty;
      return;
    }

    // Кнопка "В корзину"
    if (btn.classList.contains('btn-add-to-cart')) {
      const qtyEl = card.querySelector('.qty-value');
      // Если есть счётчик — берём его, иначе 1 штука
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

// ===== Корзина: обработка кнопок +, -, Удалить =====
const cartList = document.querySelector('.cart-list');
if (cartList) {
  cartList.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;

    const itemEl = btn.closest('.cart-item');
    const id = itemEl.dataset.id;
    const cart = getCart();
    const item = cart.find(i => i.id === id);

    if (!item) return;

    if (btn.dataset.action === 'plus') item.qty += 1;
    
    if (btn.dataset.action === 'minus') {
      item.qty -= 1;
      if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
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
      alert('Заказ оформлен! Спасибо, что обратились к нам! Мы внимательно изучили ваше сообщение и уже передали его администратору. В ближайшее время он свяжется с вами, чтобы обсудить детали и помочь с решением вопроса.');
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
  if (event.persisted) renderCart();
});

// --------------------- Выпадающее меню (Dropdown) ---------------------
const dropdown = document.querySelector('.dropdown');
if (dropdown) {
  const toggle = dropdown.querySelector('.dropdown__toggle');
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
  }

  dropdown.querySelectorAll('.dropdown__menu a').forEach(link => {
    link.addEventListener('click', () => dropdown.classList.remove('open'));
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
  });
}
