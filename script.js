// ===== Sticky nav shadow on scroll =====
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
});

// ===== Mobile menu =====
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  navLinks.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    burger.classList.remove("open");
    navLinks.classList.remove("open");
  })
);

// ===== Scroll reveal animation =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== Menu tabs, search, reviews are in menu.js; cart is in order.js =====

// ===== English / Japanese toggle =====
const langBtn = document.getElementById("langBtn");
let currentLang = "en";

function setLanguage(lang) {
  document.documentElement.lang = lang === "jp" ? "ja" : "en";
  document.querySelectorAll("[data-en]").forEach((el) => {
    const text = el.dataset[lang];
    if (text) el.innerHTML = text;
  });
  langBtn.textContent = lang === "jp" ? "EN" : "JP";
  if (window.renderMenu) window.renderMenu(); // re-draw the menu in the chosen language
  try { localStorage.setItem("lang", lang); } catch (e) {}
}

langBtn.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "jp" : "en";
  setLanguage(currentLang);
});

// Remember the visitor's choice
try {
  const saved = localStorage.getItem("lang");
  if (saved === "jp") {
    currentLang = "jp";
    setLanguage("jp");
  }
} catch (e) {}

// ===== Reservation form =====
// Opens the visitor's email app with the details filled in.
// Replace the email below with the restaurant's real address.
const RESTAURANT_EMAIL = "info@example.com";
const form = document.getElementById("reserveForm");
const statusEl = document.getElementById("formStatus");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form).entries());
  const subject = encodeURIComponent(`Reservation request - ${d.name}`);
  const body = encodeURIComponent(
    `Name: ${d.name}\nPhone: ${d.phone}\nDate: ${d.date}\nTime: ${d.time}\nGuests: ${d.guests}\nMessage: ${d.message || "-"}`
  );
  window.location.href = `mailto:${RESTAURANT_EMAIL}?subject=${subject}&body=${body}`;
  statusEl.textContent = "Thank you! Your email app will open to send the request.";
  form.reset();
});

// Prevent booking dates in the past
const dateInput = form.querySelector('input[type="date"]');
dateInput.min = new Date().toISOString().split("T")[0];