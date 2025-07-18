const cache = {};

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

// ================================
// 2. Initialisierung nach DOM-Load
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById('sidebar-menu');
  const menuToggleBtn = document.getElementById('menu-toggle');
  const header = document.querySelector('.header-bar');
  const colorMenu = document.querySelector('.color-picker-menu');
  const colorToggleBtn = document.getElementById('color-picker-toggle');
  const headerOffset = 75;

  // 2.1 Menüpunkt schließt Menü
  document.querySelectorAll('#sidebar-menu a').forEach(link => {
    link.addEventListener('click', () => {
      menu?.classList.remove('visible');
      menuToggleBtn?.classList.remove('active');
    });
  });

  // 2.2 Scroll-Effekt Header (graue Linie)
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 0);
  });

  // 2.3 Klick außerhalb von Menü & Color Picker schließt beide
  document.addEventListener('click', function (event) {
    const clickedInsideMenu = menu?.contains(event.target);
    const clickedMenuToggle = menuToggleBtn?.contains(event.target);

    if (!clickedInsideMenu && !clickedMenuToggle && menu?.classList.contains('visible')) {
      menu.classList.remove('visible');
      menuToggleBtn.classList.remove('active');
    }

    const clickedInsideColor = colorMenu?.contains(event.target);
    const clickedColorToggle = colorToggleBtn?.contains(event.target);

    if (!clickedInsideColor && !clickedColorToggle && !colorMenu?.classList.contains('hidden')) {
      colorMenu.classList.add('hidden');
    }
  });

  // 2.4 🎨 Color Picker Setup
  renderColorOptions();
  colorToggleBtn?.addEventListener('click', () => {
    colorMenu?.classList.toggle('hidden');
  });

  document.querySelectorAll('.color-option').forEach(opt => {
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

      colorMenu?.classList.add('hidden');
    });
  });

// 2.5 Dynamische Farboptionen einfügen
function renderColorOptions() {
  const colorMenu = document.querySelector('.color-picker-menu');
  if (!colorMenu) return;

  const colorOptions = [
    { color: '#BC0000', label: 'Rot' },
    { color: '#e07731', label: 'Orange' },
    { color: '#1a3f1e', label: 'Gelb (neu)' },
    { color: '#328546', label: 'Grün' },
    { color: '#3c8d7d', label: 'Türkis' },
    { color: '#383abb', label: 'Blau' },
    { color: '#6c33d4', label: 'Lila' },
    { color: '#f25ca2', label: 'Pink' },
    { color: '#686868', label: 'Grau' }
  ];

  colorOptions.forEach(({ color }) => {
    const div = document.createElement('div');
    div.className = 'color-option';
    div.dataset.color = color;
    div.style.background = color;
    colorMenu.appendChild(div);
  });
}

  // 2.6 Anker-Sprung mit Offset (inkl. Direktaufruf per #)
  function scrollToHashWithOffset() {
    const hash = window.location.hash;
    if (hash) {
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  }

  scrollToHashWithOffset();

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
});

// =======================
// 3. SVG-Logo inline laden
// =======================
fetch('assets/logo.inline.svg')
  .then(res => res.text())
  .then(svg => {
    const container = document.getElementById('logo-container');
    if (container) {
      container.innerHTML = svg;
    }
  });

// =======================
// 4. Template Handling
// =======================
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

  Array.from(elm.querySelectorAll('script')).forEach(oldScriptEl => {
    const newScriptEl = document.createElement('script');

    Array.from(oldScriptEl.attributes).forEach(attr => {
      newScriptEl.setAttribute(attr.name, attr.value);
    });

    const scriptText = document.createTextNode(oldScriptEl.innerHTML);
    newScriptEl.appendChild(scriptText);

    oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
  });
}

async function loadDump(dump) {
  return fetch(`dumps/${dump}`).then(res => res.json());
}


function loadAndScroll(template, hash) {
  loadTemplate(template).then(() => {
    const targetId = hash.replace('#', '');

    // Warte kurz, bis DOM aufgebaut ist
    const maxAttempts = 10;
    let attempts = 0;

    const tryScroll = () => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const headerOffset = 75;
        const offsetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });

        // optional: URL-Hash aktualisieren
        window.history.pushState(null, null, hash);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScroll, 30); // versuche es nochmal in 30 ms
      }
    };

    tryScroll();
  });
}
