/* Second Earth · site du projet · ce que toutes les pages partagent :
   de quoi fabriquer des éléments, la pastille du brouillon, la connexion par code, le bouton d'édition. */
(function () {
  'use strict';
  var D = window.Depot;

  /* el('p.classe', {attr}, enfants…) : jamais d'innerHTML avec du texte saisi */
  function el(sel, attrs) {
    var m = sel.split('.'), n = document.createElement(m[0] || 'div');
    if (m.length > 1) n.className = m.slice(1).join(' ');
    var i = 1;
    if (attrs && typeof attrs === 'object' && !(attrs instanceof Node) && !Array.isArray(attrs)) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k]; if (v == null || v === false) return;
        if (k === 'texte') n.textContent = v; else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
      });
      i = 2;
    }
    for (; i < arguments.length; i++) ajouter(n, arguments[i]);
    return n;
  }
  function ajouter(n, e) { if (e == null || e === false) return; if (Array.isArray(e)) e.forEach(function (x) { ajouter(n, x); }); else n.appendChild(e instanceof Node ? e : document.createTextNode(String(e))); }
  function bouton(texte, action, classe) { return el('button.ke-btn.petit' + (classe ? '.' + classe : ''), { type: 'button', onclick: action }, texte); }

  /* un avis qui passe, en bas à gauche */
  var zoneAvis;
  function avis(texte, dure) {
    if (!zoneAvis) { zoneAvis = el('div.pj-avis', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(zoneAvis); }
    var a = el('p', {}, texte); zoneAvis.appendChild(a);
    setTimeout(function () { a.remove(); }, dure || 5200);
  }

  /* un panneau qui s'ouvre au-dessus de la page ; Échap ou un clic dehors le ferme */
  function panneau(titre, corps) {
    var d = el('dialog.pj-panneau'), ferme = function () { d.close(); d.remove(); };
    d.appendChild(el('div.pj-panneau-tete', {}, el('h3', {}, titre), bouton('Fermer', ferme, 'discret')));
    d.appendChild(corps);
    d.addEventListener('click', function (e) { if (e.target === d) ferme(); });
    d.addEventListener('close', function () { d.remove(); });
    document.body.appendChild(d); d.showModal();
    return { fermer: ferme, noeud: d };
  }

  function champ(etiquette, attrs, aide) {
    var i = el(attrs && attrs.long ? 'textarea' : 'input', Object.assign({ type: 'text', autocomplete: 'off' }, attrs || {}));
    i.removeAttribute('long');
    var c = el('label.ke-champ', {}, el('span.ke-petit', {}, etiquette), i, aide ? el('em', {}, aide) : null);
    c.entree = i; return c;
  }

  /* ── la connexion par code ── */
  function connexion(apres) {
    var c = champ('Code d\'accès', { type: 'password', autocomplete: 'current-password' }), dit = el('p.pj-dit');
    var f = el('form.pj-form', {
      onsubmit: function (e) {
        e.preventDefault(); dit.textContent = 'Vérification…';
        D.acces.entrer(c.entree.value).then(function (r) {
          if (!r) { dit.textContent = 'Ce code n\'ouvre rien.'; return; }
          p.fermer(); avis(r === 'admin' ? 'Connecté en admin : le bouton « Éditer la page » est en bas à droite.' : 'Connecté en invité : vous pouvez commenter le script.');
          auChangement.forEach(function (f) { f(); }); peindreBarre();
          if (apres) apres(r);
        });
      }
    }, c,
      el('p.ke-petit', {}, D.acces.adminDefini() ? 'Invité : commenter le script. Admin : éditer, régler, publier.' : 'Aucun code n\'existe encore. Le code admin se choisit dans le tableau de bord.'),
      el('div.pj-actions', {}, el('button.ke-btn.plein', { type: 'submit' }, 'Entrer'), el('a.ke-btn.petit', { href: 'admin.html' }, 'Tableau de bord')), dit);
    var p = panneau('Connexion', f); c.entree.focus();
  }

  /* ── la barre du bas : rôle, brouillon, édition ── */
  var edition = false, auChangement = [];
  function enEdition() { return edition && D.role() === 'admin'; }
  function basculerEdition(v) {
    edition = v == null ? !edition : v;
    document.documentElement.classList.toggle('pj-edition', enEdition());
    try { sessionStorage.setItem('se-projet.edition', enEdition() ? '1' : ''); } catch (e) { /* rien */ }
    auChangement.forEach(function (f) { f(); }); peindreBarre();
  }
  var barre;
  function peindreBarre() {
    if (!barre) { barre = el('div.pj-bas'); document.body.appendChild(barre); }
    barre.textContent = '';
    var r = D.role(), b = D.bilan(), att = D.enAttenteDeDeploiement();
    if (b.total) barre.appendChild(el('a.pj-pastille', { href: 'admin.html', title: 'Voir le brouillon dans le tableau de bord' }, el('i'), b.total === 1 ? 'Un brouillon attend' : 'Brouillon : ' + b.total + ' éléments en attente'));
    else if (att) barre.appendChild(el('span.pj-pastille.calme', {}, el('i'), 'Publié, déploiement en cours'));
    if (r === 'visiteur') barre.appendChild(bouton('Connexion', function () { connexion(); }, 'discret'));
    else {
      barre.appendChild(el('span.ke-machine', {}, r === 'admin' ? 'admin' : 'invité'));
      if (r === 'admin') {
        barre.appendChild(el('a.ke-btn.petit', { href: 'admin.html' }, 'Tableau de bord'));
        if (enEdition() && window.Editeur) barre.appendChild(window.Editeur.boutonAjouter());
        if (document.body.hasAttribute('data-editable')) barre.appendChild(el('button.ke-btn.plein.pj-editer', { type: 'button', 'aria-pressed': enEdition() ? 'true' : 'false', onclick: function () { basculerEdition(); } }, enEdition() ? 'Finir l\'édition' : 'Éditer la page'));
      }
      barre.appendChild(bouton('Sortir', function () { D.acces.sortir(); basculerEdition(false); }, 'discret'));
    }
  }
  D.quand(peindreBarre);
  document.addEventListener('DOMContentLoaded', function () {
    try { if (sessionStorage.getItem('se-projet.edition') && D.role() === 'admin' && document.body.hasAttribute('data-editable')) edition = true; } catch (e) { /* rien */ }
    document.documentElement.classList.toggle('pj-edition', enEdition());
    peindreBarre();
  });

  window.Commun = { el: el, bouton: bouton, avis: avis, panneau: panneau, champ: champ, connexion: connexion,
    enEdition: enEdition, basculerEdition: basculerEdition, quandEdition: function (f) { auChangement.push(f); } };
})();
