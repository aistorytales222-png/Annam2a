// ============================================================
// CART + CHECKOUT (sends the order by WhatsApp or email)
// ============================================================
(function () {
  "use strict";

  // ====== CHANGE THESE ======
  const WHATSAPP_NUMBER = "81XXXXXXXXXX";   // country code + number, digits only
  const ORDER_EMAIL = "info@example.com";
  // ==========================

  const KEY = "annamCart";
  const isJP = () => document.documentElement.lang === "ja";
  const yen = (n) => "\u00A5" + n.toLocaleString("en-US");
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (id) => document.getElementById(id);

  // price lookup from menu-data.js
  const price = {};
  MENU_CATEGORIES.forEach((c) => c.items.forEach((it) => (price[it[0]] = it[1])));

  // cart = { "Butter Chicken": 2, ... }
  let cart = {};
  try {
    cart = JSON.parse(localStorage.getItem(KEY)) || {};
    Object.keys(cart).forEach((k) => { if (!(k in price) || cart[k] < 1) delete cart[k]; });
  } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };

  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(cart).reduce((s, [n, q]) => s + price[n] * q, 0);

  // ---------- Drawer ----------
  const panel = $("cartPanel"), overlay = $("cartOverlay");
  const openCart = () => { panel.classList.add("open"); overlay.classList.add("open"); };
  const closeCart = () => { panel.classList.remove("open"); overlay.classList.remove("open"); };

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 1400);
  }

  function render() {
    const list = $("cartItems");
    const entries = Object.entries(cart);
    list.innerHTML = entries.length
      ? entries.map(([name, q]) => `
        <li>
          <div class="ci-info"><strong>${esc(name)}</strong><small>${yen(price[name])}</small></div>
          <div class="ci-qty">
            <button type="button" data-act="minus" data-name="${esc(name)}" aria-label="Less">&minus;</button>
            <span>${q}</span>
            <button type="button" data-act="plus" data-name="${esc(name)}" aria-label="More">+</button>
          </div>
          <b class="ci-sum">${yen(price[name] * q)}</b>
        </li>`).join("")
      : `<li class="ci-empty">${isJP() ? "カートは空です。" : "Your order is empty."}</li>`;
    $("cartTotal").textContent = yen(total());
    $("cartCount").textContent = count();
    $("checkoutBtn").disabled = !entries.length;
    $("cartClear").style.visibility = entries.length ? "visible" : "hidden";
    save();
  }

  function change(name, delta) {
    if (!(name in price)) return;
    cart[name] = (cart[name] || 0) + delta;
    if (cart[name] < 1) delete cart[name];
    render();
  }

  // Add buttons in the menu (event delegation, survives re-renders)
  $("menuList").addEventListener("click", (e) => {
    const b = e.target.closest(".btn-add");
    if (!b) return;
    change(b.dataset.add, 1);
    toast((isJP() ? "追加しました: " : "Added: ") + b.dataset.add);
  });

  $("cartItems").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (b) change(b.dataset.name, b.dataset.act === "plus" ? 1 : -1);
  });

  $("cartBtn").addEventListener("click", openCart);
  $("cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  $("cartClear").addEventListener("click", () => { cart = {}; render(); });

  // ---------- Checkout ----------
  const dlg = $("checkoutDialog");
  const typeEl = $("coType"), addrWrap = $("coAddrWrap"), addrEl = $("coAddr");

  function syncType() {
    const delivery = typeEl.value === "Delivery";
    addrWrap.hidden = !delivery;
    addrEl.required = delivery;
  }
  typeEl.addEventListener("change", syncType);

  $("checkoutBtn").addEventListener("click", () => {
    if (!count()) return;
    $("coSum").innerHTML =
      Object.entries(cart).map(([n, q]) => `<div><span>${q} &times; ${esc(n)}</span><span>${yen(price[n] * q)}</span></div>`).join("") +
      `<div class="co-total"><span>${isJP() ? "合計" : "Total"}</span><span>${yen(total())}</span></div>`;
    syncType();
    closeCart();
    dlg.showModal();
  });
  $("coClose").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  function buildMessage() {
    const lines = [
      "NEW ORDER - Annam",
      "Type: " + typeEl.value,
      "Name: " + $("coName").value.trim(),
      "Phone: " + $("coPhone").value.trim(),
    ];
    if (typeEl.value === "Delivery") lines.push("Address: " + addrEl.value.trim());
    if ($("coTime").value) lines.push("Time: " + $("coTime").value);
    lines.push("", "Items:");
    Object.entries(cart).forEach(([n, q]) => lines.push(`- ${q} x ${n} (${yen(price[n] * q)})`));
    lines.push("", "Total: " + yen(total()));
    if ($("coNotes").value.trim()) lines.push("Notes: " + $("coNotes").value.trim());
    return lines.join("\n");
  }

  function finish() {
    cart = {};
    render();
    $("checkoutForm").reset();
    dlg.close();
    toast(isJP() ? "ご注文ありがとうございます！" : "Thank you for your order!");
  }

  function send(kind) {
    const f = $("checkoutForm");
    if (!f.reportValidity() || !count()) return;
    const msg = buildMessage();
    if (kind === "wa") {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    } else {
      window.location.href =
        `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent("Order - " + $("coName").value.trim())}&body=${encodeURIComponent(msg)}`;
    }
    finish();
  }
  $("sendWA").addEventListener("click", () => send("wa"));
  $("sendMail").addEventListener("click", () => send("mail"));

  // Redraw labels when language changes
  const langBtn = $("langBtn");
  if (langBtn) langBtn.addEventListener("click", () => setTimeout(render, 0));

  render();
})();