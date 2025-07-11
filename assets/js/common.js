const cache = {}

function toggleMenu() {
    const menu = document.querySelector('.menu-popup');
    if (menu) {
        menu.classList.toggle('active');
    }
}

async function loadTemplate(template) {
    fetchContent(template).then(content => document.getElementById('content').innerHTML = content);
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