const cache = {}

function toggleMenu() {
    const menu = document.querySelector('.menu-popup');
    if (menu) {
        menu.classList.toggle('active');
    }
}

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
        .forEach( oldScriptEl => {
            const newScriptEl = document.createElement('script');

            Array.from(oldScriptEl.attributes).forEach( attr => {
                newScriptEl.setAttribute(attr.name, attr.value)
            });

            const scriptText = document.createTextNode(oldScriptEl.innerHTML);
            newScriptEl.appendChild(scriptText);

            oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
        });
}