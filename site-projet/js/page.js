/* Second Earth · site du projet · la page des catégories.
   Elle dessine le contenu (publié, ou brouillon quand l'admin a la main) à partir de blocs,
   et, en mode édition, rend chaque texte éditable sur place et chaque média déposable. */
(function () {
  'use strict';
  var D = window.Depot, C = window.Commun, el = C.el, bouton = C.bouton;
  var racine, contenu;

  var TYPES = {
    ouverture: 'Ouverture plein écran', texte: 'Texte', media: 'Image ou vidéo en bandeau',
    carrousel: 'Carrousel', chiffres: 'Chiffres', citation: 'Citation', liens: 'Liens'
  };
  function neuf(type) {
    var id = D.uid('b'), m = function (a) { return { src: '', genre: 'image', attendu: a, poster: '', cadre: '50% 50%' }; };
    if (type === 'ouverture') return { id: id, type: type, sur: '', titre: 'Titre', chapo: '', media: m('ici : une image large, 21:9'), statut: '' };
    if (type === 'texte') return { id: id, type: type, sur: '', titre: 'Titre', corps: 'Texte.', statut: '', source: '' };
    if (type === 'media') return { id: id, type: type, media: m('ici : une image large, 21:9'), legende: '' };
    if (type === 'carrousel') return { id: id, type: type, titre: '', format: '21:9', statut: '', source: '', items: [tuileNeuve('21:9')] };
    if (type === 'chiffres') return { id: id, type: type, source: '', items: [{ id: D.uid('c'), v: '0', u: '', t: 'Ce que dit ce chiffre' }] };
    if (type === 'citation') return { id: id, type: type, texte: 'Citation.', source: '' };
    return { id: id, type: 'liens', items: [{ id: D.uid('l'), nom: 'Lien', href: '', texte: '' }] };
  }
  function tuileNeuve(fmt) { return { id: D.uid('tu'), sur: '', titre: 'Titre', texte: '', media: { src: '', genre: 'image', attendu: 'ici : une image, ' + fmt, poster: '', cadre: '50% 50%' } }; }

  function garder() { try { D.contenu.garder(contenu); } catch (e) { C.avis(e.message); } }
  function redessiner(garderDefilement) { var y = window.scrollY; dessiner(); if (garderDefilement !== false) window.scrollTo(0, y); }

  /* ── un texte : éditable sur place en mode édition (texte brut, les retours à la ligne sont gardés) ── */
  function texte(sel, objet, cle, vide) {
    var n = el(sel, { texte: objet[cle] || '' });
    if (C.enEdition()) {
      n.setAttribute('contenteditable', 'plaintext-only'); n.setAttribute('spellcheck', 'true'); n.classList.add('pj-editable');
      if (vide) n.setAttribute('data-vide', vide);
      n.addEventListener('input', function () { objet[cle] = n.innerText.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, ''); garder(); });
      n.addEventListener('paste', function (e) { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
    } else if (!objet[cle]) return null;
    return n;
  }

  /* ── un média : image, vidéo, ou l'emplacement qui dit ce qui doit venir ── */
  function adresseStream(src) {
    var m = src.match(/^https:\/\/([\w.-]*cloudflarestream\.com|iframe\.videodelivery\.net)\/([0-9a-f]{20,})/i);
    return m ? 'https://' + m[1] + '/' + m[2] + '/iframe?muted=true&loop=true&autoplay=true&controls=false&preload=metadata' : null;
  }
  function media(m, format, fond) {
    var boite = el('div.pj-media', { 'data-format': format });
    function remplir() {
      boite.textContent = '';
      if (!m.src) {
        boite.classList.add('vide');
        boite.appendChild(el('div.pj-attendu', {}, el('span.pj-format', {}, format), el('p', {}, m.attendu || 'ici : une image'),
          el('span.ke-machine', {}, m.genre === 'video' ? 'vidéo ou image · ' + format : 'image · ' + format)));
      } else {
        boite.classList.remove('vide');
        var flux = m.genre === 'video' ? adresseStream(m.src) : null;
        if (flux) boite.appendChild(el('iframe', { src: flux, loading: 'lazy', allow: 'autoplay; fullscreen', title: m.attendu || 'vidéo', tabindex: '-1' }));
        else if (m.genre === 'video') {
          var v = el('video', { muted: true, loop: true, playsinline: true, preload: 'metadata' });
          v.muted = true; v.style.objectPosition = m.cadre || '50% 50%';
          if (m.poster) D.medias.adresse(m.poster).then(function (u) { if (u) v.poster = u; });
          D.medias.adresse(m.src).then(function (u) { if (u) v.src = u; });
          boite.appendChild(v); regarder(v);
        } else {
          var i = el('img', { alt: m.attendu || '', loading: 'lazy', decoding: 'async' });
          i.style.objectPosition = m.cadre || '50% 50%';
          D.medias.adresse(m.src).then(function (u) { if (u) i.src = u; else { m.src = ''; remplir(); } });
          boite.appendChild(i);
        }
      }
      if (C.enEdition()) outilsMedia();
    }
    function recevoir(f) {
      if (!f) return;
      boite.setAttribute('aria-busy', 'true');
      D.preparerFichier(f).then(function (r) {
        m.src = r.src; m.genre = r.genre; m.poids = r.poids; m.nom = r.nom; garder(); remplir();
        C.avis(r.genre === 'video' ? 'Vidéo gardée dans ce navigateur. Elle ne part pas dans git : à mettre sur Cloudflare, puis coller son adresse.' : 'Image gardée dans le brouillon (WebP, ' + Math.round(r.poids / 1024) + ' Ko).');
      }, function (e) { C.avis(e.message); }).then(function () { boite.removeAttribute('aria-busy'); });
    }
    function outilsMedia() {
      var choix = el('input', { type: 'file', accept: 'image/*,video/*', hidden: true, onchange: function () { recevoir(choix.files[0]); } });
      var o = el('div.pj-outils-media', {},
        bouton(m.src ? 'Remplacer' : 'Choisir un fichier', function () { choix.click(); }),
        bouton('Adresse', function () { reglerAdresse(); }),
        m.src && !adresseStream(m.src) ? bouton('Cadrer', function (e) { cadrer(e.currentTarget); }) : null,
        m.src ? bouton('Vider', function () { m.src = ''; garder(); remplir(); }) : null, choix);
      boite.appendChild(o);
      if (!m.src) { var a = texte('p.pj-attendu-edit', m, 'attendu', 'ce qui doit venir ici'); if (a) boite.querySelector('.pj-attendu p').replaceWith(a); }
    }
    function reglerAdresse() {
      var u = C.champ('Adresse de la vidéo ou de l\'image', { value: /^local:/.test(m.src) ? '' : m.src, placeholder: 'https://…', type: 'url' }, 'Une vidéo MP4 sur Cloudflare R2, un lien Cloudflare Stream, ou une image déjà en ligne.');
      var po = C.champ('Image d\'attente de la vidéo (facultatif)', { value: /^local:/.test(m.poster || '') ? '' : (m.poster || ''), placeholder: 'https://…', type: 'url' });
      var p = C.panneau('Adresse du média', el('form.pj-form', {
        onsubmit: function (e) {
          e.preventDefault(); var v = u.entree.value.trim();
          if (v && !/^https:\/\//.test(v) && !/^(\.\.\/|content\/)/.test(v)) { C.avis('Une adresse commence par https://'); return; }
          m.src = v; m.poster = po.entree.value.trim();
          m.genre = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(v) || adresseStream(v) ? 'video' : (v ? 'image' : m.genre);
          garder(); remplir(); p.fermer();
        }
      }, u, po, el('div.pj-actions', {}, el('button.ke-btn.plein', { type: 'submit' }, 'Garder'))));
      u.entree.focus();
    }
    function cadrer(b) {
      var actif = boite.classList.toggle('cadrage'); b.setAttribute('aria-pressed', actif ? 'true' : 'false');
      if (actif) C.avis('Cliquer dans l\'image le point qui doit rester visible. Recliquer « Cadrer » pour finir.');
    }
    boite.addEventListener('click', function (e) {
      if (!boite.classList.contains('cadrage') || e.target.closest('.pj-outils-media')) return;
      var r = boite.getBoundingClientRect();
      m.cadre = Math.round((e.clientX - r.left) / r.width * 100) + '% ' + Math.round((e.clientY - r.top) / r.height * 100) + '%';
      var v = boite.querySelector('img,video'); if (v) v.style.objectPosition = m.cadre; garder();
    });
    boite.addEventListener('dragover', function (e) { if (C.enEdition()) { e.preventDefault(); boite.classList.add('depot'); } });
    boite.addEventListener('dragleave', function () { boite.classList.remove('depot'); });
    boite.addEventListener('drop', function (e) { if (!C.enEdition()) return; e.preventDefault(); boite.classList.remove('depot'); recevoir(e.dataTransfer.files[0]); });
    remplir();
    if (fond) boite.classList.add('fond');
    return boite;
  }

  /* les vidéos ne jouent que lorsqu'on les voit, et jamais si la personne a demandé moins de mouvement */
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var guet = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { var v = e.target; if (e.isIntersecting && !calme) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
  }, { threshold: 0.35 }) : null;
  function regarder(v) { if (calme) v.controls = true; if (guet) guet.observe(v); }

  function statut(b) {
    var s = b.statut || '';
    if (C.enEdition()) return el('button.pj-statut' + (s ? '.' + (s === 'validé' ? 'valide' : s === 'manque' ? 'manque' : 'propose') : ''), {
      type: 'button', title: 'Changer le statut : proposé, validé, manque, aucun',
      onclick: function () { var o = ['', 'proposé', 'validé', 'manque']; b.statut = o[(o.indexOf(s) + 1) % o.length]; garder(); redessiner(); }
    }, s || 'sans statut');
    if (!s) return null;
    return el('span.pj-statut.' + (s === 'validé' ? 'valide' : s === 'manque' ? 'manque' : 'propose'), {}, s === 'manque' ? 'à écrire' : s);
  }
  function source(b) { return texte('p.pj-source', b, 'source', 'source de ce bloc'); }

  /* ── les blocs ── */
  var DESSINS = {
    ouverture: function (b) {
      return el('div.pj-ouverture', {}, media(b.media, '21:9', true),
        el('div.pj-ouv-texte', {}, texte('p.ke-sur', b, 'sur', 'surtitre'), texte('h2.pj-immense', b, 'titre', 'titre'), texte('p.ke-chapo', b, 'chapo', 'chapô'), statut(b)));
    },
    texte: function (b) {
      return el('div.pj-texte', {}, texte('p.ke-sur', b, 'sur', 'surtitre'), texte('h2', b, 'titre', 'titre'), statut(b),
        texte('div.pj-corps' + (b.sur === 'Logline' ? '.grand' : ''), b, 'corps', b.statut === 'manque' ? 'à écrire' : 'texte'), source(b));
    },
    media: function (b) { return el('figure.pj-bande', {}, media(b.media, '21:9'), texte('figcaption.ke-petit', b, 'legende', 'légende')); },
    citation: function (b) { return el('figure.pj-citation', {}, texte('blockquote', b, 'texte', 'citation'), texte('figcaption.ke-petit', b, 'source', 'source')); },
    chiffres: function (b) {
      var g = el('div.pj-chiffres');
      b.items.forEach(function (c, i) {
        g.appendChild(el('div.pj-chiffre', {}, el('p.pj-valeur', {}, texte('b', c, 'v', '0'), texte('span', c, 'u', 'unité')), texte('p.ke-petit', c, 't', 'ce que dit ce chiffre'),
          C.enEdition() ? el('div.pj-outils-tuile', {}, bouton('Retirer', function () { b.items.splice(i, 1); garder(); redessiner(); }, 'discret')) : null));
      });
      if (C.enEdition()) g.appendChild(el('button.pj-ajout', { type: 'button', onclick: function () { b.items.push({ id: D.uid('c'), v: '0', u: '', t: '' }); garder(); redessiner(); } }, 'Ajouter un chiffre'));
      return el('div.pj-bloc-chiffres', {}, g, source(b));
    },
    liens: function (b) {
      var l = el('div.pj-liens');
      b.items.forEach(function (it, i) {
        var a = el(C.enEdition() ? 'div.pj-lien' : 'a.pj-lien', C.enEdition() ? {} : { href: it.href || '#' }, texte('b', it, 'nom', 'nom du lien'), texte('span', it, 'texte', 'ce qu\'on y trouve'));
        if (C.enEdition()) { a.appendChild(texte('code.pj-href', it, 'href', 'adresse')); a.appendChild(bouton('Retirer', function () { b.items.splice(i, 1); garder(); redessiner(); }, 'discret')); }
        l.appendChild(a);
      });
      if (C.enEdition()) l.appendChild(el('button.pj-ajout', { type: 'button', onclick: function () { b.items.push({ id: D.uid('l'), nom: 'Lien', href: '', texte: '' }); garder(); redessiner(); } }, 'Ajouter un lien'));
      return l;
    },
    carrousel: function (b) {
      var fmt = b.format || '21:9', piste = el('div.pj-piste', { tabindex: '0', role: 'group', 'aria-label': b.titre || 'Carrousel' });
      b.items.forEach(function (it, i) {
        var t = el('article.pj-tuile', {}, media(it.media, fmt), el('div.pj-tuile-texte', {}, texte('p.ke-sur', it, 'sur', 'surtitre'), texte('h3', it, 'titre', 'titre'), texte('p.pj-tuile-corps', it, 'texte', 'texte')));
        if (C.enEdition()) t.appendChild(el('div.pj-outils-tuile', {},
          bouton('←', function () { if (i > 0) { b.items.splice(i - 1, 0, b.items.splice(i, 1)[0]); garder(); redessiner(); } }),
          bouton('→', function () { if (i < b.items.length - 1) { b.items.splice(i + 1, 0, b.items.splice(i, 1)[0]); garder(); redessiner(); } }),
          el('button.pj-croix', { type: 'button', title: 'Retirer cette tuile', 'aria-label': 'Retirer cette tuile', onclick: function () { b.items.splice(i, 1); garder(); redessiner(); } }, '×')));
        piste.appendChild(t);
      });
      if (C.enEdition()) piste.appendChild(el('button.pj-tuile.pj-ajout', { type: 'button', onclick: function () { b.items.push(tuileNeuve(fmt)); garder(); redessiner(); } }, 'Ajouter une tuile'));
      var pas = function (sens) { var t = piste.querySelector('.pj-tuile'); piste.scrollBy({ left: sens * (t ? t.getBoundingClientRect().width + 24 : 600), behavior: calme ? 'auto' : 'smooth' }); };
      piste.addEventListener('keydown', function (e) { if (e.target !== piste) return; if (e.key === 'ArrowRight') { pas(1); e.preventDefault(); } if (e.key === 'ArrowLeft') { pas(-1); e.preventDefault(); } });
      var compte = el('span.ke-machine');
      var dire = function () { var t = piste.querySelector('.pj-tuile'); if (!t) return; var n = Math.round(piste.scrollLeft / (t.getBoundingClientRect().width + 24)) + 1; compte.textContent = Math.min(n, b.items.length) + ' / ' + b.items.length; };
      piste.addEventListener('scroll', dire, { passive: true }); setTimeout(dire, 0);
      var formats = C.enEdition() ? el('span.pj-formats', {}, ['21:9', '16:9', '4:5'].map(function (f) { return el('button.ke-btn.petit', { type: 'button', 'aria-pressed': f === fmt ? 'true' : 'false', onclick: function () { b.format = f; garder(); redessiner(); } }, f); })) : null;
      return el('div.pj-carrousel', { 'data-format': fmt },
        el('div.pj-car-tete', {}, texte('h3.pj-car-titre', b, 'titre', 'titre du carrousel'), statut(b), formats,
          el('span.pj-car-nav', {}, compte, bouton('Précédent', function () { pas(-1); }), bouton('Suivant', function () { pas(1); }))),
        piste, source(b));
    }
  };

  /* ── les outils d'un bloc, en mode édition : monter, descendre, dupliquer, retirer, insérer ── */
  function outilsBloc(sec, i) {
    var b = sec.blocs[i];
    var ajouter = el('span.pj-plus', {}, el('button.ke-btn.petit', {
      type: 'button', 'aria-haspopup': 'true', onclick: function (e) { e.currentTarget.parentNode.classList.toggle('ouvert'); }
    }, '+ Insérer dessous'),
      el('span.pj-plus-liste', {}, Object.keys(TYPES).map(function (t) { return bouton(TYPES[t], function () { sec.blocs.splice(i + 1, 0, neuf(t)); garder(); redessiner(); }); })));
    return el('div.pj-outils-bloc', {}, el('span.ke-machine', {}, TYPES[b.type] || b.type),
      bouton('Monter', function () { if (i > 0) { sec.blocs.splice(i - 1, 0, sec.blocs.splice(i, 1)[0]); garder(); redessiner(); } }),
      bouton('Descendre', function () { if (i < sec.blocs.length - 1) { sec.blocs.splice(i + 1, 0, sec.blocs.splice(i, 1)[0]); garder(); redessiner(); } }),
      bouton('Dupliquer', function () { var c = D.clone(b); c.id = D.uid('b'); (c.items || []).forEach(function (x) { x.id = D.uid('i'); }); sec.blocs.splice(i + 1, 0, c); garder(); redessiner(); }),
      bouton('Retirer', function () { if (confirm('Retirer ce bloc du brouillon ? La version publiée reste intacte tant que vous ne publiez pas.')) { sec.blocs.splice(i, 1); garder(); redessiner(); } }),
      ajouter);
  }

  function dessiner() {
    contenu = D.contenu.courant();
    racine.textContent = '';
    var nav = document.getElementById('chapitres'); nav.textContent = '';
    contenu.sections.forEach(function (sec, n) {
      var s = el('section.pj-section', { id: sec.id, 'data-nom': sec.nom });
      if (n > 0) nav.appendChild(el('a', { href: '#' + sec.id }, el('b', {}, ('0' + n).slice(-2)), el('span', {}, sec.nom)));
      if (C.enEdition()) s.appendChild(el('div.pj-tete-section', {}, el('span.ke-machine', {}, 'catégorie ' + ('0' + n).slice(-2)), texte('span.pj-nom-section', sec, 'nom', 'nom de la catégorie')));
      sec.blocs.forEach(function (b, i) {
        var d = (DESSINS[b.type] || function () { return el('p.ke-petit', {}, 'Bloc inconnu : ' + b.type); })(b);
        var enveloppe = el('div.pj-bloc', { 'data-type': b.type, id: b.id }, C.enEdition() ? outilsBloc(sec, i) : null, d);
        s.appendChild(enveloppe);
      });
      if (C.enEdition() && !sec.blocs.length) s.appendChild(el('button.pj-ajout', { type: 'button', onclick: function () { sec.blocs.push(neuf('texte')); garder(); redessiner(); } }, 'Ajouter un premier bloc à « ' + sec.nom + ' »'));
      racine.appendChild(s);
    });
    suivre();
  }

  /* le chapitre où l'on est, dans la barre ; le fil d'avancée, en haut */
  var guetNav;
  function suivre() {
    if (guetNav) guetNav.disconnect();
    if (!('IntersectionObserver' in window)) return;
    guetNav = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; document.querySelectorAll('#chapitres a').forEach(function (a) { a.classList.toggle('ici', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.pj-section').forEach(function (s) { guetNav.observe(s); });
  }
  window.addEventListener('scroll', function () {
    var a = document.getElementById('avance'), h = document.documentElement.scrollHeight - window.innerHeight;
    if (a) a.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function () {
    racine = document.getElementById('contenu');
    dessiner();
    C.quandEdition(function () { redessiner(); });
    if (location.hash) { var c = document.getElementById(location.hash.slice(1)); if (c) c.scrollIntoView(); }
  });
})();
