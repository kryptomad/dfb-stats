function toggleMenu() {
    const menu = document.querySelector('.menu-popup');
    if (menu) {
        menu.classList.toggle('active');
    }
}

async function loadTemplate(template) {
    console.log("loading " + template);
    try {
        const response = await fetch(`templates/${template}`);
        console.log(response);

        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }

        document.getElementById('content').innerHTML = await response.text();
    } catch (error) {
        console.error('Fehler beim Laden des Templates:', error);
    }
}