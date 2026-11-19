/* Second Earth · site du projet · la page du script.
   Le récit de référence (docs/film/01-recit-docx.md) est découpé à la construction en paragraphes,
   chacun avec une identité stable. Ici : on le lit ; un invité ou l'admin commente dans la marge ;
   l'admin, en mode édition, corrige chaque paragraphe sur place. Rien ne s'efface : le texte d'origine
   et chaque version publiée restent consultables. */
(function () {
  'use strict';
  var D = window.Depot, C = window.Commun, el = C.el, bouton = C.bouton;
  var SCRIPT = [], racine, filtre = 'ouverts';

  function peutCommenter() { return D.role() === 'admin' || D.role() === 'invite'; }

  function demanderNom(apres) {
    if (D.nom()) return apres();
    var c = C.champ('Votre nom, pour signer vos commentaires', { maxlength: '60' }, 'Saisi une fois, gardé dans ce navigateur.');
    var p = C.panneau('Signer', el('form.pj-form', { onsubmit: function (e) { e.preventDefault(); if (!c.entree.value.trim()) return; D.nom(c.entree.value); p.fermer(); apres(); } },
      c, el('div.pj-actions', {}, el('button.ke-btn.plein', { type: 'submit' }, 'Garder'))));
    c.entree.focus();
  }

  /* ── écrire un commentaire, ou une réponse ── */
  function saisie(etiquette, envoyer, annuler) {
    var t = el('textarea', { rows: '3', placeholder: etiquette, 'aria-label': etiquette });
    var f = el('form.pj-saisie', {
      onsubmit: function (e) { e.preventDefault(); var v = t.value.trim(); if (!v) return; demanderNom(function () { envoyer(v); }); }
    }, t, el('div.pj-actions', {}, el('button.ke-btn.petit', { type: 'submit' }, 'Envoyer'), bouton('Annuler', annuler, 'discret')));
    t.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.requestSubmit(); if (e.key === 'Escape') annuler(); });
    setTimeout(function () { t.focus(); }, 0);
    return f;
  }

  function fil(f) {
    var n = el('div.pj-fil' + (f.regle ? '.regle' : ''), { id: f.id });
    function message(m, premier) {
      return el('div.pj-message', {}, el('p.pj-qui', {}, el('b', {}, m.auteur || 'anonyme'), ' ', D.dateFr(m.date), m.local ? el('i', {}, ' · brouillon') : null),
        premier && f.extrait ? el('p.pj-extrait', {}, '« ' + f.extrait + ' »') : null, el('p.pj-dit-com', {}, m.texte));
    }
    n.appendChild(message(f, true));
    (f.reponses || []).forEach(function (r) { n.appendChild(el('div.pj-reponse', {}, message(r))); });
    var actions = el('div.pj-actions');
    if (f.regle) actions.appendChild(el('span.ke-machine', {}, 'réglé' + (f.localRegle ? ' · brouillon' : '')));
    if (peutCommenter()) actions.appendChild(bouton('Répondre', function () {
      actions.hidden = true;
      n.appendChild(saisie('Répondre', function (v) { D.commentaires.repondre(f.id, v); dessiner(); }, function () { dessiner(); }));
    }));
    if (D.role() === 'admin') actions.appendChild(bouton(f.regle ? 'Rouvrir' : 'Marquer réglé', function () { D.commentaires.regler(f.id, !f.regle); dessiner(); }));
    if (f.local && (D.role() === 'admin' || f.auteur === D.nom())) actions.appendChild(bouton('Retirer', function () { D.commentaires.retirer(f.id); dessiner(); }, 'discret'));
    n.appendChild(actions);
    return n;
  }

  /* ── l'histoire d'un paragraphe ── */
  function voirHistoire(p) {
    var h = D.modifs.histoire(p.id, p.texte), liste = el('div.pj-histoire');
    h.forEach(function (v, i) {
      liste.appendChild(el('div.pj-version', {}, el('p.ke-machine', {}, (i === h.length - 1 ? 'texte actuel · ' : '') + (v.qui || '') + (v.date ? ' · ' + D.dateFr(v.date) : '')), el('p', {}, v.texte)));
    });
    var pan = C.panneau('Paragraphe ' + p.n + ' : les versions', el('div', {}, liste,
      D.role() === 'admin' && h.length > 1 ? el('div.pj-actions', {}, bouton('Reprendre le texte d\'origine', function () { D.modifs.garder(p.id, p.texte, p.texte); pan.fermer(); dessiner(); })) : null));
  }

  function classe(p) { return 'pj-p.' + p.genre; }

  function paragraphe(p, fils) {
    var etat = D.modifs.de(p.id, p.texte);
    var corps = el(p.genre === 'partie' ? 'h2.' + classe(p) : 'p.' + classe(p), { texte: etat.texte });
    if (C.enEdition()) {
      corps.setAttribute('contenteditable', 'plaintext-only'); corps.setAttribute('spellcheck', 'true'); corps.classList.add('pj-editable');
      corps.addEventListener('input', function () { D.modifs.garder(p.id, corps.innerText.replace(/ /g, ' ').replace(/\s*\n\s*/g, ' ').trim(), p.texte); marque(); });
      corps.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
      corps.addEventListener('paste', function (e) { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g, ' ')); });
    }
    var gauche = el('div.pj-num', {}, el('span.ke-machine', {}, p.n));
    var etatN = el('button.pj-etat', { type: 'button', hidden: true, title: 'Voir le texte d\'origine et les versions', onclick: function () { voirHistoire(p); } });
    function marque() { var e = D.modifs.de(p.id, p.texte); etatN.hidden = e.etat === 'origine'; etatN.textContent = e.etat === 'brouillon' ? 'corrigé · brouillon' : 'corrigé'; etatN.className = 'pj-etat ' + e.etat; }
    marque(); gauche.appendChild(etatN);

    var marge = el('div.pj-marge');
    var visibles = fils.filter(function (f) { return filtre === 'tous' || !f.regle; });
    visibles.forEach(function (f) { marge.appendChild(fil(f)); });
    var caches = fils.length - visibles.length;
    if (caches) marge.appendChild(el('p.ke-machine', {}, caches + ' réglé' + (caches > 1 ? 's' : '')));
    if (peutCommenter()) marge.appendChild(el('button.pj-commenter', { type: 'button', 'aria-label': 'Commenter le paragraphe ' + p.n, onclick: function () { ouvrirSaisie(p, marge, ''); } }, 'Commenter'));
    return el('div.pj-rang' + (fils.length ? '.annote' : ''), { id: p.id, 'data-genre': p.genre }, gauche, corps, marge);
  }

  function ouvrirSaisie(p, marge, extrait) {
    if (marge.querySelector('.pj-saisie')) return;
    var b = marge.querySelector('.pj-commenter'); if (b) b.hidden = true;
    if (extrait) marge.appendChild(el('p.pj-extrait', {}, '« ' + extrait + ' »'));
    marge.appendChild(saisie('Votre commentaire', function (v) { D.commentaires.ajouter(p.id, extrait, v); dessiner(); }, function () { dessiner(); }));
  }

  /* ── sélectionner un passage : un bouton « Commenter ce passage » vient près de la sélection ── */
  var flottant;
  document.addEventListener('selectionchange', function () {
    if (!flottant) return;
    var s = window.getSelection(), t = s && !s.isCollapsed ? s.toString().trim() : '';
    var rang = t && s.anchorNode ? (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode).closest('.pj-rang') : null;
    var dans = rang && s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode).closest('.pj-p');
    if (!peutCommenter() || !dans || t.length < 3) { flottant.hidden = true; return; }
    var r = s.getRangeAt(0).getBoundingClientRect();
    flottant.hidden = false; flottant.style.top = (window.scrollY + r.bottom + 8) + 'px'; flottant.style.left = Math.max(12, window.scrollX + r.left) + 'px';
    flottant._rang = rang; flottant._texte = t.replace(/\s+/g, ' ').slice(0, 240);
  });

  function dessiner() {
    var y = window.scrollY;
    var tous = D.commentaires.tous(), parPara = {};
    tous.forEach(function (f) { (parPara[f.para] = parPara[f.para] || []).push(f); });
    racine.textContent = '';
    var connus = {}, sommaire = document.getElementById('chapitres'); sommaire.textContent = '';
    SCRIPT.forEach(function (p) {
      connus[p.id] = 1;
      if (p.genre === 'partie') sommaire.appendChild(el('a', { href: '#' + p.id }, el('b', {}, D.modifs.de(p.id, p.texte).texte.split(':')[0].trim())));
      racine.appendChild(paragraphe(p, parPara[p.id] || []));
    });
    /* les commentaires dont le paragraphe n'existe plus dans le texte source */
    var orphelins = tous.filter(function (f) { return !connus[f.para]; });
    if (orphelins.length) racine.appendChild(el('div.pj-rang.annote', {}, el('div.pj-num'), el('p.pj-p.note', {}, 'Commentaires sur des paragraphes qui ne sont plus dans le texte source.'), el('div.pj-marge', {}, orphelins.map(fil))));
    var ouverts = tous.filter(function (f) { return !f.regle; }).length, nm = Object.keys(D.modifs.publiees()).length + Object.keys(D.modifs.locales()).length;
    var etat = document.getElementById('etat-script'); etat.textContent = '';
    etat.appendChild(el('span', {}, SCRIPT.length + ' paragraphes · ' + ouverts + ' commentaire' + (ouverts > 1 ? 's' : '') + ' ouvert' + (ouverts > 1 ? 's' : '') + ' · ' + (tous.length - ouverts) + ' réglé' + (tous.length - ouverts > 1 ? 's' : '') + ' · ' + nm + ' paragraphe' + (nm > 1 ? 's' : '') + ' corrigé' + (nm > 1 ? 's' : '')));
    etat.appendChild(el('button.ke-btn.petit', { type: 'button', 'aria-pressed': filtre === 'tous' ? 'true' : 'false', onclick: function () { filtre = filtre === 'tous' ? 'ouverts' : 'tous'; dessiner(); } }, 'Montrer les réglés'));
    if (!peutCommenter()) etat.appendChild(bouton('Se connecter pour commenter', function () { C.connexion(); }));
    else if (D.role() === 'invite' && D.commentaires.compte()) etat.appendChild(bouton('Copier mes commentaires pour Cal', function () {
      navigator.clipboard.writeText(D.commentaires.exporter()).then(function () { C.avis('Copié. À coller dans un message à Cal, qui les importera dans son tableau de bord.'); }, function () { C.avis('La copie a échoué : le navigateur refuse le presse-papiers.'); });
    }));
    document.body.classList.toggle('peut-commenter', peutCommenter());
    window.scrollTo(0, y);
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { SCRIPT = JSON.parse(document.getElementById('script-source').textContent); } catch (e) { SCRIPT = []; }
    racine = document.getElementById('script');
    flottant = el('button.ke-btn.plein.pj-flottant', { type: 'button', hidden: true, onmousedown: function (e) { e.preventDefault(); },
      onclick: function () { var r = flottant._rang, p = SCRIPT.filter(function (x) { return x.id === r.id; })[0]; flottant.hidden = true; if (p) ouvrirSaisie(p, r.querySelector('.pj-marge'), flottant._texte); window.getSelection().removeAllRanges(); } }, 'Commenter ce passage');
    document.body.appendChild(flottant);
    dessiner();
    C.quandEdition(dessiner);
    if (location.hash) { var c = document.getElementById(location.hash.slice(1)); if (c) c.scrollIntoView(); }
  });
})();
