/*
    script.js - pentru /alexazxy/book-finder-app
    - Preia textul introdus de utilizator (titlu, autor sau cuvânt-cheie)
    - Trimite cereri HTTP către Open Library API
    - Primește și procesează datele sub formă JSON
    - Afișează dinamic rezultate (carte, autor, imagine copertă)
    - Gestionează cazurile fără rezultate sau erori de rețea
*/

/* Elemente așteptate în HTML (dacă nu există, se creează unul minim):
     - <form id="search-form"><input id="search-input"> <button>Search</button></form>
     - <div id="message"></div>
     - <div id="results"></div>
*/

const form = document.getElementById('search-form') || createFallbackUI();
const input = document.getElementById('search-input');
const resultsContainer = document.getElementById('results') || document.createElement('div');
const messageEl = document.getElementById('message') || document.createElement('div');

// if fallback created these were appended inside createFallbackUI; ensure references
if (!document.getElementById('results')) {
    resultsContainer.id = 'results';
    document.body.appendChild(resultsContainer);
}
if (!document.getElementById('message')) {
    messageEl.id = 'message';
    document.body.insertBefore(messageEl, resultsContainer);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) {
        showMessage('Introduceți titlu, autor sau cuvânt-cheie pentru căutare.');
        return;
    }
    clearMessage();
    clearResults();
    showMessage('Se caută...', { transient: true });

    try {
        const data = await fetchOpenLibrary(query);
        renderResults(data);
    } catch (err) {
        showMessage('Eroare de rețea sau server: ' + (err.message || err));
    }
});

async function fetchOpenLibrary(query) {
    // folosim API-ul de search; limităm rezultatele pentru performanță
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
}

function renderResults(data) {
    clearResults();
    if (!data || !Array.isArray(data.docs) || data.docs.length === 0) {
        showMessage('Nu s-au găsit rezultate pentru căutarea dvs.');
        return;
    }

    const fragment = document.createDocumentFragment();

    data.docs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.style.border = '1px solid #ddd';
        card.style.padding = '8px';
        card.style.margin = '8px';
        card.style.display = 'flex';
        card.style.gap = '12px';
        card.style.alignItems = 'flex-start';

        // imagine copertă
        const img = document.createElement('img');
        img.alt = doc.title || 'Copertă';
        img.style.width = '84px';
        img.style.height = '120px';
        img.style.objectFit = 'cover';
        img.style.background = '#f4f4f4';

        const coverUrl = getCoverUrl(doc);
        if (coverUrl) {
            img.src = coverUrl;
            // fallback la o imagine neutră dacă nu se încarcă
            img.onerror = () => {
                img.src = '';
                img.style.background = '#eee';
            };
        } else {
            img.src = '';
            img.style.background = '#eee';
        }

        // detalii text
        const info = document.createElement('div');
        info.style.flex = '1';

        const titleEl = document.createElement('h3');
        titleEl.textContent = doc.title || 'Titlu necunoscut';
        titleEl.style.margin = '0 0 6px 0';
        titleEl.style.fontSize = '1.05em';

        const authorEl = document.createElement('p');
        authorEl.style.margin = '0 0 6px 0';
        authorEl.style.color = '#333';
        authorEl.textContent = doc.author_name ? `Autor: ${doc.author_name.join(', ')}` : 'Autor: necunoscut';

        const yearEl = document.createElement('p');
        yearEl.style.margin = '0 0 6px 0';
        yearEl.style.color = '#666';
        if (doc.first_publish_year) {
            yearEl.textContent = `An publicare: ${doc.first_publish_year}`;
        } else if (doc.publish_year && doc.publish_year.length) {
            yearEl.textContent = `An publicare: ${doc.publish_year[0]}`;
        } else {
            yearEl.textContent = 'An publicare: necunoscut';
        }

        // link către pagina Open Library a cărții (work key)
        const linkEl = document.createElement('a');
        linkEl.style.display = 'inline-block';
        linkEl.style.marginTop = '6px';
        linkEl.textContent = 'Vezi pe Open Library';
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';
        linkEl.href = doc.key ? `https://openlibrary.org${doc.key}` : '#';

        info.appendChild(titleEl);
        info.appendChild(authorEl);
        info.appendChild(yearEl);
        info.appendChild(linkEl);

        card.appendChild(img);
        card.appendChild(info);
        fragment.appendChild(card);
    });

    resultsContainer.appendChild(fragment);
    clearMessage();
}

function getCoverUrl(doc) {
    // Prioritize cover_i, apoi ISBN (dacă există)
    if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    }
    if (Array.isArray(doc.isbn) && doc.isbn.length > 0) {
        // folosește prima ISBN pentru copertă
        return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
    }
    return null;
}

function showMessage(text, options = {}) {
    messageEl.textContent = text;
    messageEl.style.padding = '8px';
    messageEl.style.margin = '8px 0';
    messageEl.style.background = options.transient ? '#fffbe6' : '#fff3f3';
    messageEl.style.border = '1px solid #e5e5e5';
}

function clearMessage() {
    messageEl.textContent = '';
    messageEl.style.padding = '';
    messageEl.style.margin = '';
    messageEl.style.background = '';
    messageEl.style.border = '';
}

function clearResults() {
    resultsContainer.innerHTML = '';
}

/* Creează UI minim dacă lipsește din proiect (utile pentru testare rapidă) */
function createFallbackUI() {
    const f = document.createElement('form');
    f.id = 'search-form';
    f.style.margin = '12px';

    const inputEl = document.createElement('input');
    inputEl.id = 'search-input';
    inputEl.type = 'search';
    inputEl.placeholder = 'Caută titlu, autor sau cuvânt-cheie...';
    inputEl.style.padding = '8px';
    inputEl.style.width = '300px';
    inputEl.required = true;

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.textContent = 'Caută';
    btn.style.marginLeft = '8px';
    btn.style.padding = '8px 12px';

    f.appendChild(inputEl);
    f.appendChild(btn);
    document.body.insertBefore(f, document.body.firstChild);

    // create message + results containers
    const msg = document.createElement('div');
    msg.id = 'message';
    msg.style.margin = '8px 12px';
    document.body.insertBefore(msg, f.nextSibling);

    const res = document.createElement('div');
    res.id = 'results';
    res.style.margin = '8px 12px';
    document.body.insertBefore(res, msg.nextSibling);

    return f;
}