/* Second Earth · site du projet · le tableau de bord.
   Les accès (le code admin se choisit ici, à la première ouverture), le brouillon, la publication,
   Cloudflare (ce qu'il faudra fournir), et ce que protègent vraiment les codes. */
(function () {
  'use strict';
  var D = window.Depot, C = window.Commun, el = C.el, bouton = C.bouton;
  var racine, journal = [];

  function titre(n, t, sous) { return el('header.pj-ad-tete', {}, el('p.ke-sur', {}, el('b', {}, n), t), sous ? el('p.ke-chapo', {}, sous) : null); }
  function ligne(nom, valeur) { return el('p.pj-ligne', {}, el('span', {}, nom), el('b', {}, valeur)); }

  /* ── 01 · les accès ── */
  function acces() {
    var s = el('section.pj-ad', { id: 'acces' }, titre('01', 'Les accès'));
    if (!D.acces.adminDefini()) {
      var a = C.champ('Choisir le code admin', { type: 'password', autocomplete: 'new-password' }, 'Elle n\'est écrite nulle part en clair ; seule son empreinte est gardée.');
      var b = C.champ('Le redonner', { type: 'password', autocomplete: 'new-password' }), dit = el('p.pj-dit');
      s.appendChild(el('form.pj-form', {
        onsubmit: function (e) {
          e.preventDefault();
          if (a.entree.value !== b.entree.value) { dit.textContent = 'Les deux saisies diffèrent.'; return; }
          var code = a.entree.value; dit.textContent = 'Calcul de l\'empreinte…';
          D.acces.definir('admin', code).then(function () { return D.acces.entrer(code); }).then(function () { C.avis('Code admin choisi. Il sera publié (son empreinte seulement) avec le reste.'); dessiner(); }, function (err) { dit.textContent = err.message; });
        }
      }, el('p.ke-texte', {}, 'Aucun code admin n\'existe encore. Celui que vous choisissez ici vaut d\'abord pour ce navigateur ; il vaudra partout après la première publication.'), a, b,
        el('div.pj-actions', {}, el('button.ke-btn.plein', { type: 'submit' }, 'Choisir ce code')), dit));
      return s;
    }
    if (D.role() !== 'admin') {
      s.appendChild(el('p.ke-texte', {}, 'Un code admin existe. Entrez-le pour ouvrir le tableau de bord.'));
      s.appendChild(el('div.pj-actions', {}, el('button.ke-btn.plein', { type: 'button', onclick: function () { C.connexion(dessiner); } }, 'Entrer le code')));
      return s;
    }
    var n = C.champ('Votre nom, pour signer commentaires et publications', { value: D.nom(), maxlength: '60' });
    n.entree.addEventListener('change', function () { D.nom(n.entree.value); });
    var g = C.champ(D.acces.inviteDefini() ? 'Changer le code invité' : 'Choisir le code invité', { type: 'text' }, 'Pour ceux qui commentent le script : ' + D.LONG_INVITE + ' caractères au moins. À leur transmettre vous-même.');
    var dit2 = el('p.pj-dit');
    s.appendChild(el('div.pj-ad-deux', {},
      el('div', {}, ligne('Rôle', 'admin'), ligne('Code admin', 'défini'), ligne('Code invité', D.acces.inviteDefini() ? 'défini' : 'pas encore'), n),
      el('form.pj-form', { onsubmit: function (e) { e.preventDefault(); D.acces.definir('invite', g.entree.value).then(function () { C.avis('Code invité gardé. Il vaudra pour tous après publication.'); dessiner(); }, function (err) { dit2.textContent = err.message; }); } },
        g, el('div.pj-actions', {}, el('button.ke-btn.petit', { type: 'submit' }, 'Garder le code invité')), dit2)));
    return s;
  }

  /* ── 02 · le brouillon ── */
  function brouillon() {
    var b = D.bilan(), s = el('section.pj-ad', { id: 'brouillon' }, titre('02', 'Le brouillon', 'Tout ce que vous changez reste dans ce navigateur jusqu\'à « Publier ». Personne d\'autre ne le voit.'));
    s.appendChild(el('div.pj-ad-deux', {},
      el('div', {},
        ligne('Pages des catégories', b.contenu ? 'modifiées' : 'comme publiées'),
        ligne('Images déposées, à envoyer', String(b.images)),
        ligne('Vidéos déposées en local', b.videosLocales ? b.videosLocales + ' (à héberger sur Cloudflare)' : '0'),
        ligne('Paragraphes du script corrigés', String(b.modifs)),
        ligne('Commentaires, réponses, réglés', String(b.commentaires)),
        ligne('Codes d\'accès à publier', b.acces ? 'oui' : 'non')),
      el('div.pj-colonne', {},
        bouton('Télécharger le brouillon (JSON)', function () {
          var d = { quoi: 'brouillon Second Earth', le: new Date().toISOString(), contenu: D.contenu.brouillon(), modifs: D.modifs.locales(), commentaires: D.commentaires.locaux() };
          var a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' })), download: 'second-earth-brouillon.json' }); a.click();
        }),
        bouton('Importer des commentaires reçus', function () {
          var t = C.champ('Coller ici le texte envoyé par un invité', { long: true, rows: '6' }), dit = el('p.pj-dit');
          var p = C.panneau('Importer des commentaires', el('form.pj-form', { onsubmit: function (e) { e.preventDefault(); try { var n = D.commentaires.importer(t.entree.value); p.fermer(); C.avis(n + ' élément(s) ajouté(s) à votre brouillon.'); dessiner(); } catch (err) { dit.textContent = err.message; } } },
            t, el('div.pj-actions', {}, el('button.ke-btn.petit', { type: 'submit' }, 'Importer')), dit));
        }),
        bouton('Abandonner le brouillon', function () {
          if (!confirm('Abandonner tout le brouillon de ce navigateur (pages, corrections du script, commentaires non publiés) ? Ce qui est publié ne change pas.')) return;
          D.contenu.abandonner(); D.modifs.abandonner(); D.commentaires.abandonner(); dessiner();
        }, 'discret'))));
    return s;
  }

  /* ── 03 · publier ── */
  function publier() {
    var r = D.reglages.lire(), s = el('section.pj-ad', { id: 'publier' }, titre('03', 'Publier', 'Un seul commit dans le dépôt GitHub ; GitHub Pages reconstruit alors le site en une à deux minutes.'));
    var depot = C.champ('Dépôt', { value: r.depot }), branche = C.champ('Branche', { value: r.branche, placeholder: 'la branche par défaut du dépôt' }, 'Vide : la branche par défaut, celle que GitHub Pages publie.');
    var ranger = el('input', { type: 'checkbox' }); ranger.checked = !!r.rangerCle;
    function garderReglages() { D.reglages.garder({ depot: depot.entree.value.trim(), branche: branche.entree.value.trim(), rangerCle: ranger.checked }); }
    [depot.entree, branche.entree, ranger].forEach(function (i) { i.addEventListener('change', function () { garderReglages(); dessiner(); }); });

    var jet = el('div.pj-colonne');
    if (D.jeton.present()) {
      jet.appendChild(ligne('Jeton GitHub', 'déverrouillé pour cette session'));
      jet.appendChild(bouton('Oublier le jeton dans ce navigateur', function () { D.jeton.oublier(); dessiner(); }, 'discret'));
    } else {
      var j = C.champ('Jeton GitHub', { type: 'password', autocomplete: 'off', placeholder: 'github_pat_…' }), code = C.champ('Code admin, qui sert de clé', { type: 'password', autocomplete: 'current-password' }), dit = el('p.pj-dit');
      jet.appendChild(el('form.pj-form', { onsubmit: function (e) { e.preventDefault(); dit.textContent = 'Chiffrement…'; D.jeton.poser(j.entree.value, code.entree.value).then(function () { C.avis('Jeton gardé, chiffré.'); dessiner(); }, function (err) { dit.textContent = err.message; }); } },
        el('p.ke-petit', {}, D.jeton.range() ? 'Un jeton chiffré est rangé, mais verrouillé : reconnectez-vous en admin, ou collez-en un nouveau.' : 'À coller une seule fois. Il est chiffré (AES-GCM) par une clé tirée de votre code admin, et gardé dans ce navigateur.'),
        j, code, el('div.pj-actions', {}, el('button.ke-btn.petit', { type: 'submit' }, 'Garder le jeton')), dit));
    }
    var manques = D.manques(), liste = el('div.pj-manques');
    if (manques.length) { liste.appendChild(el('p.ke-petit', {}, 'Il manque, avant de pouvoir publier :')); manques.forEach(function (m) { liste.appendChild(el('p.pj-manque', {}, m)); }); }
    else liste.appendChild(el('p.ke-petit', {}, 'Tout est là : on peut publier.'));

    var sortie = el('div.pj-journal', { role: 'log', 'aria-live': 'polite' });
    journal.forEach(function (l) { sortie.appendChild(el('p', {}, l)); });
    function dire(l) { journal.push(l); sortie.appendChild(el('p', {}, l)); }
    function lancer(aBlanc, b) {
      garderReglages(); journal = []; sortie.textContent = ''; b.setAttribute('aria-busy', 'true');
      D.publier(dire, aBlanc).then(function () { if (!aBlanc) dessiner(); }, function (err) { dire(err.message); }).then(function () { b.removeAttribute('aria-busy'); });
    }
    s.appendChild(el('div.pj-ad-deux', {},
      el('div.pj-colonne', {}, depot, branche,
        el('label.ke-case.pj-case', {}, ranger, el('span', {}, 'Ranger aussi le jeton chiffré dans le dépôt (content/deploy-key.json), pour qu\'il se déverrouille sur mes autres appareils.')),
        el('p.ke-petit', {}, 'Décoché par défaut : le dépôt est public, et un jeton chiffré qu\'on peut télécharger ne vaut que ce que vaut la phrase qui le chiffre.')),
      jet));
    s.appendChild(liste);
    s.appendChild(el('div.pj-actions', {},
      el('button.ke-btn.plein', { type: 'button', onclick: function (e) { lancer(false, e.currentTarget); } }, 'Publier'),
      bouton('Essai à blanc (rien n\'est envoyé)', function (e) { lancer(true, e.currentTarget); })));
    s.appendChild(sortie);
    s.appendChild(el('details.pj-aide', {}, el('summary', {}, 'Créer le jeton GitHub, pas à pas'),
      el('ol', {},
        el('li', {}, 'Sur GitHub : Settings, Developer settings, Personal access tokens, Fine-grained tokens, « Generate new token ».'),
        el('li', {}, 'Repository access : « Only select repositories », et choisir ce seul dépôt.'),
        el('li', {}, 'Permissions du dépôt : « Contents » en « Read and write ». Rien d\'autre.'),
        el('li', {}, 'Choisir une durée, générer, copier le jeton (il commence par github_pat_).'),
        el('li', {}, 'Le coller ici, dans le champ « Jeton GitHub », avec votre code admin. Nulle part ailleurs : ni dans un message, ni dans un fichier.'))));
    return s;
  }

  /* ── 04 · Cloudflare ── */
  function cloudflare() {
    return el('section.pj-ad', { id: 'cloudflare' }, titre('04', 'Cloudflare, pour les vidéos', 'Rien n\'est branché. Les vidéos ne vont pas dans git : elles se lisent depuis une adresse.'),
      el('div.pj-ad-deux', {},
        el('div', {},
          el('h3', {}, 'Ce qui marche dès maintenant'),
          el('p.ke-texte', {}, 'En mode édition, chaque emplacement a un bouton « Adresse ». On y colle l\'adresse https d\'une vidéo déjà en ligne : un fichier MP4 dans un bucket R2 public, ou un lien Cloudflare Stream. La vidéo se charge par ses métadonnées seulement, joue muette et en boucle quand on la voit, s\'arrête quand elle sort de l\'écran.'),
          el('p.ke-texte', {}, 'Une vidéo déposée à la main sur un emplacement reste dans ce navigateur, pour voir la mise en page ; elle n\'est jamais publiée.')),
        el('div', {},
          el('h3', {}, 'Ce que vous aurez à fournir'),
          el('ol', {},
            el('li', {}, 'Un compte Cloudflare, et un bucket R2 (ou Stream) créé pour le projet.'),
            el('li', {}, 'L\'accès public du bucket : l\'adresse r2.dev, ou un domaine à vous branché dessus.'),
            el('li', {}, 'Des fichiers MP4 (H.264, 1080p ou 21:9 équivalent, sans son ou son coupé pour les fonds), et une image d\'attente par vidéo.'),
            el('li', {}, 'Pour envoyer les vidéos depuis ce tableau de bord plus tard : un petit Worker Cloudflare qui reçoit le fichier et l\'écrit dans R2. Il n\'existe pas encore ; sans lui, on dépose les fichiers dans R2 depuis le site de Cloudflare et on colle l\'adresse ici.')),
          el('p.ke-petit', {}, 'Aucune clé Cloudflare ne se colle dans ce site tant que ce Worker n\'est pas écrit.'))));
  }

  /* ── 05 · ce que protègent les codes ── */
  function securite() {
    return el('section.pj-ad', { id: 'securite' }, titre('05', 'Ce que protègent les codes'),
      el('div.pj-colonne', {},
        el('p.ke-texte', {}, 'Le site est public, et le dépôt aussi. Tout ce qui est publié ici peut être lu par n\'importe qui, avec ou sans code : le texte du script, les commentaires, les images.'),
        el('p.ke-texte', {}, 'Les codes ne sont pas une serrure. Le code invité ouvre seulement le champ des commentaires ; le code admin ouvre les outils d\'édition dans le navigateur. Quelqu\'un qui lit le code de la page peut afficher ces outils sans code : il ne pourra rien publier.'),
        el('p.ke-texte', {}, 'La seule vraie protection est le jeton GitHub : sans lui, rien ne s\'écrit dans le dépôt. Gardez-le pour vous, donnez-lui le droit le plus étroit (un dépôt, « Contents »), et une durée courte.'),
        el('p.ke-texte', {}, 'Les commentaires d\'un invité restent dans son navigateur. Il vous les envoie (bouton « Copier mes commentaires pour Cal »), vous les importez ici, et ils partent à la publication suivante.')));
  }

  function dessiner() {
    var y = window.scrollY; racine.textContent = '';
    racine.appendChild(acces());
    if (D.role() === 'admin') { racine.appendChild(brouillon()); racine.appendChild(publier()); }
    racine.appendChild(cloudflare()); racine.appendChild(securite());
    window.scrollTo(0, y);
  }
  document.addEventListener('DOMContentLoaded', function () { racine = document.getElementById('tableau'); dessiner(); C.quandEdition(dessiner); });
})();
