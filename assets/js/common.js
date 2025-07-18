const cache = {}

// ==========================
// 1. Menü-Logik (☰ Button)
// ==========================
function toggleMenu() {
  const menu = document.getElementById('sidebar-menu');
  const btn = document.getElementById('menu-toggle');

  if (!menu || !btn) return;

  menu.classList.toggle('visible');
  btn.classList.toggle('active');
}

// Menü schließt sich beim Klick auf Menüpunkt (sofort)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('#sidebar-menu a').forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.getElementById('sidebar-menu');
      const btn = document.getElementById('menu-toggle');
      if (menu && btn) {
        menu.classList.remove('visible');
        btn.classList.remove('active');
      }
    });
  });
});

// =====================================
// 2. Header-Scroll Effekt (graue Linie)
// =====================================
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header-bar');
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 0);
  }
});

// ===========================================
// 3. Menü + Color Picker schließen bei Klick außerhalb
// ===========================================
document.addEventListener('click', function (event) {
  const sidebar = document.getElementById('sidebar-menu');
  const menuToggleBtn = document.getElementById('menu-toggle');

  const clickedInsideMenu = sidebar?.contains(event.target);
  const clickedMenuToggle = menuToggleBtn?.contains(event.target);

  if (!clickedInsideMenu && !clickedMenuToggle && sidebar?.classList.contains('visible')) {
    sidebar.classList.remove('visible');
    menuToggleBtn.classList.remove('active');
  }

  const colorMenu = document.querySelector('.color-picker-menu');
  const colorToggleBtn = document.getElementById('color-picker-toggle');

  const clickedInsideColor = colorMenu?.contains(event.target);
  const clickedColorToggle = colorToggleBtn?.contains(event.target);

  if (!clickedInsideColor && !clickedColorToggle && !colorMenu.classList.contains('hidden')) {
    colorMenu.classList.add('hidden');
  }
});

// ================================
// 4. 🎨 Color Picker Initialisierung
// ================================
function setupColorPicker() {
  const toggleBtn = document.getElementById('color-picker-toggle');
  const menu = document.querySelector('.color-picker-menu');
  const options = document.querySelectorAll('.color-option');

  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const newColor = opt.dataset.color;
      document.documentElement.style.setProperty('--accent-color', newColor);

      const logo = document.querySelector('#logo-container svg');
      if (logo) {
        logo.classList.remove('logo-spin');
        setTimeout(() => {
          logo.classList.add('logo-spin');
        }, 10);
      }

      menu.classList.add('hidden');
    });
  });
}

document.addEventListener("DOMContentLoaded", setupColorPicker);

// =======================
// 5. SVG-Logo inline laden
// =======================
fetch('assets/logo.inline.svg')
  .then(res => res.text())
  .then(svg => {
    const container = document.getElementById('logo-container');
    if (container) {
      container.innerHTML = svg;
    }
  });


async function loadTemplate(template) {
    fetchContent(template).then(content => setInnerHTML(document.getElementById('content'), content));
}

async function fetchContent(template) {
    if (cache[template]) {
        return Promise.resolve(cache[template]);
    }

    return fetch(`templates/${template}`)
        .then(res => res.text())
        .then(value => cache[template] = value)
        .finally(() => console.log('Template loaded'));
}

function setInnerHTML(elm, html) {
    elm.innerHTML = html;

    Array.from(elm.querySelectorAll('script'))
        .forEach(oldScriptEl => {
            const newScriptEl = document.createElement('script');

            Array.from(oldScriptEl.attributes).forEach(attr => {
                newScriptEl.setAttribute(attr.name, attr.value)
            });

            const scriptText = document.createTextNode(oldScriptEl.innerHTML);
            newScriptEl.appendChild(scriptText);

            oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
        });
}

async function loadDump(dump) {
    return fetch(`dumps/${dump}`)
        .then(res => res.json());
}