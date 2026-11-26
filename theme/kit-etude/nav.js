/* KIT ÉTUDE · la barre commune des pages du kit. À charger AVANT kit-etude.js (qui branche le sélecteur de thème).
   Dans la page : <header class="ke-barre" data-page="musique"></header>. Une page de plus : une ligne dans PAGES. */
(function () {
  'use strict';
  var PAGES = [['index', 'index.html', 'Les bases'], ['musique', 'musique.html', 'Musique'], ['hud', 'hud.html', 'HUD'], ['carto', 'carto.html', 'Cartes'],
    ['dataviz', 'dataviz.html', 'Dataviz'], ['viz3d', 'viz3d.html', 'Trois dimensions'], ['canevas', 'canevas.html', 'Canevas'], ['zoom', 'zoom.html', 'Zoom']];
  var h = document.querySelector('header.ke-barre[data-page]'); if (!h) return;
  var ici = h.getAttribute('data-page'), q = location.search || '';
  function el(n, a, t) { var e = document.createElement(n), k; for (k in a) e.setAttribute(k, a[k]); if (t) e.textContent = t; return e; }
  var marque = el('a', { class: 'ke-marque', href: 'index.html' + q }); var carre = el('span', { class: 'carre' }); carre.appendChild(el('i', {})); marque.appendChild(carre); marque.appendChild(el('b', {}, 'Kit étude'));
  var nav = el('nav', { class: 'ke-chapitres ke-pages', 'aria-label': 'Les pages du kit' });
  PAGES.forEach(function (p) { var a = el('a', { href: p[1] + q }, p[2]); if (p[0] === ici) { a.className = 'ici'; a.setAttribute('aria-current', 'page'); } nav.appendChild(a); });
  var b = el('div', { class: 'ke-bascule', role: 'group', 'aria-label': 'Thème' }); b.appendChild(el('button', { type: 'button', 'data-t': 'sombre' }, 'Sombre')); b.appendChild(el('button', { type: 'button', 'data-t': 'clair' }, 'Clair'));
  h.appendChild(marque); h.appendChild(nav); h.appendChild(b);
})();
