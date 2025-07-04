// common.js

// Lade das Menü (HTML-Snippet)
async function loadMenu() {
  try {
    const res = await fetch('menu.html');
    const html = await res.text();
    document.getElementById('menu-placeholder').innerHTML = html;
  } catch (err) {
    console.error('Fehler beim Laden des Menüs:', err);
  }
}
loadMenu();

// Menü-Toggle
function toggleMenu() {
  const menu = document.querySelector('.menu-popup');
  if (menu) {
    menu.classList.toggle('active');
  }
}
