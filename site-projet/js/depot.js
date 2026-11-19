/* Second Earth · site du projet · le dépôt local.
   Ce fichier tient : le contenu publié (inliné dans la page), le brouillon local (localStorage, IndexedDB
   pour les médias), les rôles (invité, admin) par code, le jeton GitHub chiffré, et la publication.
   Écrit pour ce dépôt, sur le principe du site NirvaLabWeb de Cal (aucun fichier n'en est recopié).

   Rappel affiché partout où il le faut : le site est public. Les codes sont un voile, pas une serrure.
   La seule vraie protection de la publication est le jeton GitHub. */
(function () {
  'use strict';
  var P = 'se-projet.';                     // préfixe des clés locales
  var CHEMIN = 'site-projet/content/';      // où vit le contenu dans le dépôt
  var ITER = 310000;                        // PBKDF2-SHA-256
  var LONG_ADMIN = 1, LONG_INVITE = 1;   // Cal, 19/11 : pas de longueur imposée

  var publie = { contenu: null, modifs: {}, commentaires: { fils: [] }, acces: {}, cle: null };
  try {
    var n = document.getElementById('publie');
    if (n) publie = Object.assign(publie, JSON.parse(n.textContent));
  } catch (e) { console.error('contenu publié illisible', e); }

  /* ── petites mémoires ── */
  function lire(cle, defaut) { try { var v = localStorage.getItem(P + cle); return v == null ? defaut : JSON.parse(v); } catch (e) { return defaut; } }
  function ecrire(cle, v) { try { if (v == null) localStorage.removeItem(P + cle); else localStorage.setItem(P + cle, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function session(cle, v) {
    try {
      if (arguments.length === 1) { var s = sessionStorage.getItem(P + cle); return s == null ? null : JSON.parse(s); }
      if (v == null) sessionStorage.removeItem(P + cle); else sessionStorage.setItem(P + cle, JSON.stringify(v));
    } catch (e) { /* sans mémoire de session, on redemandera le code */ }
    return null;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid(p) { return (p || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function maintenant() { return new Date().toISOString(); }
  function dateFr(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } }

  /* ── IndexedDB : les médias déposés, tant qu'ils ne sont pas publiés ── */
  var bdd = null;
  function ouvrirBdd() {
    if (bdd) return bdd;
    bdd = new Promise(function (ok, non) {
      var r = indexedDB.open('se-projet', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('medias'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { non(r.error); };
    });
    return bdd;
  }
  function idb(mode, f) {
    return ouvrirBdd().then(function (d) {
      return new Promise(function (ok, non) {
        var t = d.transaction('medias', mode), r = f(t.objectStore('medias'));
        t.oncomplete = function () { ok(r && r.result); };
        t.onerror = function () { non(t.error); };
      });
    });
  }
  var urls = {};
  var medias = {
    poser: function (blob) { var id = uid('m'); return idb('readwrite', function (s) { return s.put(blob, id); }).then(function () { return id; }); },
    prendre: function (id) { return idb('readonly', function (s) { return s.get(id); }); },
    retirer: function (id) { delete urls[id]; return idb('readwrite', function (s) { return s.delete(id); }); },
    cles: function () { return idb('readonly', function (s) { return s.getAllKeys(); }); },
    /* l'adresse à mettre dans src : un média local devient une adresse blob ; un média publié mais pas
       encore déployé est servi depuis la copie locale. */
    adresse: function (src) {
      if (!src) return Promise.resolve('');
      var enAttente = lire('medias-publies', {});
      var id = src.indexOf('local:') === 0 ? src.slice(6) : enAttente[src];
      if (!id) return Promise.resolve(src);
      if (urls[id]) return Promise.resolve(urls[id]);
      return medias.prendre(id).then(function (b) { if (!b) return src.indexOf('local:') === 0 ? '' : src; urls[id] = URL.createObjectURL(b); return urls[id]; }, function () { return src; });
    }
  };

  /* Une image déposée : bord long ramené à 2560 px, en WebP. Une vidéo : gardée telle quelle, en local seulement. */
  function preparerFichier(fichier) {
    if (/^video\//.test(fichier.type)) return medias.poser(fichier).then(function (id) { return { src: 'local:' + id, genre: 'video', poids: fichier.size, nom: fichier.name }; });
    if (!/^image\//.test(fichier.type)) return Promise.reject(new Error('Ce fichier n\'est ni une image ni une vidéo.'));
    if (fichier.type === 'image/svg+xml') return Promise.reject(new Error('Les SVG ne sont pas pris : déposer un PNG, un JPEG ou un WebP.'));
    return createImageBitmap(fichier).then(function (bmp) {
      var k = Math.min(1, 2560 / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (ok) { c.toBlob(ok, 'image/webp', 0.86); });
    }).then(function (blob) {
      if (!blob) throw new Error('Ce navigateur ne sait pas écrire du WebP.');
      return medias.poser(blob).then(function (id) { return { src: 'local:' + id, genre: 'image', poids: blob.size, nom: fichier.name }; });
    });
  }

  /* ── le contenu : publié, ou brouillon quand on a la main ── */
  var contenu = {
    publie: function () { return publie.contenu; },
    brouillon: function () { return lire('brouillon', null); },
    courant: function () { var b = role() === 'admin' ? contenu.brouillon() : null; return clone(b || publie.contenu || { sections: [] }); },
    garder: function (c) {
      if (JSON.stringify(c) === JSON.stringify(publie.contenu)) ecrire('brouillon', null); else if (!ecrire('brouillon', c)) throw new Error('Le brouillon ne tient plus dans la mémoire du navigateur.');
      signaler();
    },
    abandonner: function () { ecrire('brouillon', null); signaler(); }
  };

  /* ── le script : les corrections de paragraphes ── */
  var modifs = {
    publiees: function () { return publie.modifs || {}; },
    locales: function () { return lire('modifs', {}); },
    /* le texte courant d'un paragraphe, et d'où il vient */
    de: function (id, origine) {
      var l = role() === 'admin' ? modifs.locales()[id] : null, p = modifs.publiees()[id];
      if (l) return { texte: l.texte, etat: 'brouillon', date: l.date };
      if (p) return { texte: p.texte, etat: 'modifie', date: p.date };
      return { texte: origine, etat: 'origine' };
    },
    garder: function (id, texte, origine) {
      var l = modifs.locales(), p = modifs.publiees()[id], base = p ? p.texte : origine;
      if (texte === base) delete l[id]; else l[id] = { texte: texte, date: maintenant() };
      ecrire('modifs', l); signaler();
    },
    /* revenir au texte d'origine (celui du docx) : c'est une correction comme une autre, tracée */
    histoire: function (id, origine) {
      var h = [{ texte: origine, date: '', qui: 'origine (docx)' }], p = modifs.publiees()[id], l = modifs.locales()[id];
      if (p) { (p.historique || []).forEach(function (x) { h.push(x); }); h.push({ texte: p.texte, date: p.date, qui: p.auteur || '' }); }
      if (l) h.push({ texte: l.texte, date: l.date, qui: 'brouillon' });
      return h;
    },
    abandonner: function () { ecrire('modifs', null); signaler(); },
    /* ce qui part à la publication : les corrections locales posées sur les publiées, l'ancien texte gardé */
    fusion: function (auteur) {
      var f = clone(modifs.publiees()), l = modifs.locales();
      Object.keys(l).forEach(function (id) {
        var avant = f[id], h = avant ? (avant.historique || []).concat([{ texte: avant.texte, date: avant.date, qui: avant.auteur || '' }]) : [];
        f[id] = { texte: l[id].texte, date: l[id].date, auteur: auteur, historique: h };
      });
      return f;
    }
  };

  /* ── les commentaires : les fils publiés, plus ce qu'on a écrit ici ── */
  var commentaires = {
    locaux: function () { return lire('commentaires', { fils: [], reponses: {}, regles: {} }); },
    tous: function () {
      var l = commentaires.locaux(), fils = clone((publie.commentaires || {}).fils || []);
      var connus = {}; fils.forEach(function (f) { connus[f.id] = 1; });
      l.fils.forEach(function (f) { if (!connus[f.id]) { var c = clone(f); c.local = true; fils.push(c); } });
      fils.forEach(function (f) {
        var vus = {}; (f.reponses || []).forEach(function (r) { vus[r.id] = 1; });
        (l.reponses[f.id] || []).forEach(function (r) { if (!vus[r.id]) { var c = clone(r); c.local = true; (f.reponses = f.reponses || []).push(c); } });
        if (f.id in l.regles) { if (!!f.regle !== !!l.regles[f.id]) f.localRegle = true; f.regle = !!l.regles[f.id]; }
      });
      return fils;
    },
    ajouter: function (para, extrait, texte) {
      var l = commentaires.locaux(), f = { id: uid('c'), para: para, extrait: extrait || '', auteur: nom(), date: maintenant(), texte: texte, regle: false, reponses: [] };
      l.fils.push(f); ecrire('commentaires', l); signaler(); return f;
    },
    repondre: function (fil, texte) {
      var l = commentaires.locaux(), r = { id: uid('r'), auteur: nom(), date: maintenant(), texte: texte };
      var mien = l.fils.filter(function (f) { return f.id === fil; })[0];
      if (mien) mien.reponses.push(r); else (l.reponses[fil] = l.reponses[fil] || []).push(r);
      ecrire('commentaires', l); signaler();
    },
    regler: function (fil, oui) {
      var l = commentaires.locaux(), mien = l.fils.filter(function (f) { return f.id === fil; })[0];
      if (mien) mien.regle = !!oui; else l.regles[fil] = !!oui;
      ecrire('commentaires', l); signaler();
    },
    retirer: function (fil) { var l = commentaires.locaux(); l.fils = l.fils.filter(function (f) { return f.id !== fil; }); ecrire('commentaires', l); signaler(); },
    compte: function () { var l = commentaires.locaux(); return l.fils.length + Object.keys(l.reponses).reduce(function (n, k) { return n + l.reponses[k].length; }, 0) + Object.keys(l.regles).length; },
    /* un invité ne peut pas publier : il envoie ses commentaires à Cal, qui les importe */
    exporter: function () { return JSON.stringify({ quoi: 'commentaires Second Earth', de: nom(), le: maintenant(), donnees: commentaires.locaux() }, null, 1); },
    importer: function (texte) {
      var d = JSON.parse(texte); if (!d || !d.donnees || !Array.isArray(d.donnees.fils)) throw new Error('Ce fichier n\'est pas un export de commentaires.');
      var l = commentaires.locaux(), connus = {}; l.fils.forEach(function (f) { connus[f.id] = 1; });
      var n = 0;
      d.donnees.fils.forEach(function (f) { if (!connus[f.id]) { l.fils.push(f); n++; } });
      Object.keys(d.donnees.reponses || {}).forEach(function (k) { var vus = {}; (l.reponses[k] = l.reponses[k] || []).forEach(function (r) { vus[r.id] = 1; }); d.donnees.reponses[k].forEach(function (r) { if (!vus[r.id]) { l.reponses[k].push(r); n++; } }); });
      ecrire('commentaires', l); signaler(); return n;
    },
    abandonner: function () { ecrire('commentaires', null); signaler(); },
    fusion: function () { return { fils: commentaires.tous().map(function (f) { delete f.local; delete f.localRegle; (f.reponses || []).forEach(function (r) { delete r.local; }); return f; }) }; }
  };

  /* ── les rôles ── */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function b64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }
  function deb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function alea(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  function derive(code, sel, iter) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(code.normalize('NFKC')), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sel, iterations: iter || ITER, hash: 'SHA-256' }, k, 256); });
  }
  function empreinte(code) { var sel = alea(16); return derive(code, sel).then(function (bits) { return { sel: b64(sel), iter: ITER, empreinte: hex(bits) }; }); }
  function verifier(code, e) { if (!e || !e.empreinte) return Promise.resolve(false); return derive(code, deb64(e.sel), e.iter).then(function (bits) { return hex(bits) === e.empreinte; }); }

  var acces = {
    table: function () { return Object.assign({}, publie.acces || {}, lire('acces', {})); },
    adminDefini: function () { return !!(acces.table().admin || {}).empreinte; },
    inviteDefini: function () { return !!(acces.table().invite || {}).empreinte; },
    definir: function (qui, code) {
      var min = qui === 'admin' ? LONG_ADMIN : LONG_INVITE;
      if ((code || '').length < min) return Promise.reject(new Error('Trop court : ' + min + ' caractères au moins.'));
      return empreinte(code).then(function (e) { var l = lire('acces', {}); l[qui] = e; ecrire('acces', l); signaler(); });
    },
    aPublier: function () { var l = lire('acces', {}), p = publie.acces || {}; return Object.keys(l).some(function (k) { return JSON.stringify(l[k]) !== JSON.stringify(p[k]); }); },
    entrer: function (code) {
      var t = acces.table();
      return verifier(code, t.admin).then(function (ok) {
        if (ok) { session('role', 'admin'); return deverrouiller(code).then(function () { signaler(); return 'admin'; }); }
        return verifier(code, t.invite).then(function (ok2) { if (ok2) { session('role', 'invite'); signaler(); return 'invite'; } return null; });
      });
    },
    sortir: function () { session('role', null); session('jeton', null); signaler(); }
  };
  function role() { return session('role') || 'visiteur'; }
  function nom(v) { if (arguments.length) { ecrire('nom', (v || '').trim().slice(0, 60) || null); signaler(); } return lire('nom', ''); }

  /* ── le jeton GitHub : chiffré par une clé tirée du code admin (PBKDF2 puis AES-GCM) ── */
  function cleAes(code, sel, iter) { return derive(code, sel, iter).then(function (bits) { return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt', 'decrypt']); }); }
  var jeton = {
    present: function () { return !!session('jeton'); },
    range: function () { return !!(lire('cle', null) || publie.cle); },
    /* poser un jeton : il faut redonner le code admin, qui sert de clé */
    poser: function (valeur, code) {
      valeur = (valeur || '').trim();
      if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(valeur)) return Promise.reject(new Error('Ceci ne ressemble pas à un jeton GitHub (il commence par github_pat_).'));
      return verifier(code, acces.table().admin).then(function (ok) {
        if (!ok) throw new Error('Le code admin ne correspond pas.');
        var sel = alea(16), iv = alea(12);
        return cleAes(code, sel).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, new TextEncoder().encode(valeur)); })
          .then(function (c) { ecrire('cle', { sel: b64(sel), iv: b64(iv), iter: ITER, donnees: b64(c) }); session('jeton', valeur); signaler(); });
      });
    },
    oublier: function () { ecrire('cle', null); session('jeton', null); signaler(); },
    valeur: function () { return session('jeton'); },
    chiffre: function () { return lire('cle', null) || publie.cle; }
  };
  function deverrouiller(code) {
    var c = jeton.chiffre(); if (!c || !c.donnees) return Promise.resolve(false);
    return cleAes(code, deb64(c.sel), c.iter).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: deb64(c.iv) }, k, deb64(c.donnees)); })
      .then(function (clair) { session('jeton', new TextDecoder().decode(clair)); return true; }, function () { return false; });
  }

  /* ── la publication : un seul commit, par l'API Git de GitHub ── */
  function depotParDefaut() {
    var h = location.hostname.match(/^([^.]+)\.github\.io$/), seg = location.pathname.split('/').filter(Boolean)[0];
    return h && seg ? h[1] + '/' + seg : 'calculment0r/SECOND_EARTH';
  }
  var reglages = {
    lire: function () { return Object.assign({ depot: depotParDefaut(), branche: '', rangerCle: false }, lire('reglages', {})); },
    garder: function (r) { ecrire('reglages', r); }
  };

  function parcourirMedias(c, f) {
    (c.sections || []).forEach(function (s) { (s.blocs || []).forEach(function (b) { if (b.media) f(b.media); (b.items || []).forEach(function (i) { if (i.media) f(i.media); }); }); });
  }

  /* ce qui attend : pour la pastille et le tableau de bord */
  function bilan() {
    var b = contenu.brouillon(), images = 0, videos = 0;
    if (b) parcourirMedias(b, function (m) { if ((m.src || '').indexOf('local:') === 0) { if (m.genre === 'video') videos++; else images++; } });
    return { contenu: !!b, images: images, videosLocales: videos, modifs: Object.keys(modifs.locales()).length, commentaires: commentaires.compte(), acces: acces.aPublier(),
      total: (b ? 1 : 0) + Object.keys(modifs.locales()).length + commentaires.compte() + (acces.aPublier() ? 1 : 0) };
  }

  /* la liste de ce qui manque avant de publier ; vide = on peut */
  function manques() {
    var m = [];
    if (role() !== 'admin') m.push(acces.adminDefini() ? 'la connexion admin (entrer le code admin)' : 'un code admin (à choisir dans le tableau de bord)');
    if (!jeton.present()) m.push(jeton.range() ? 'le jeton GitHub : il est rangé mais verrouillé, se reconnecter en admin' : 'le jeton GitHub (à coller une fois dans le tableau de bord)');
    if (!/^[\w.-]+\/[\w.-]+$/.test(reglages.lire().depot)) m.push('le nom du dépôt, sous la forme propriétaire/dépôt');
    return m;
  }

  function gh(chemin, methode, corps) {
    return fetch('https://api.github.com/repos/' + reglages.lire().depot + chemin, {
      method: methode || 'GET',
      headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + jeton.valeur(), 'X-GitHub-Api-Version': '2022-11-28' },
      body: corps ? JSON.stringify(corps) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) return j;
        var quoi = r.status === 401 ? 'GitHub refuse le jeton (expiré, ou mal copié).' : r.status === 403 ? 'Le jeton n\'a pas le droit d\'écrire dans ce dépôt (il lui faut « Contents : Read and write »).' : r.status === 404 ? 'Dépôt ou branche introuvable avec ce jeton.' : r.status === 409 || r.status === 422 ? 'GitHub a refusé l\'écriture : ' + (j.message || r.status) : 'GitHub a répondu ' + r.status + '.';
        var e = new Error(quoi); e.statut = r.status; throw e;
      });
    });
  }
  function blobEnB64(blob) { return blob.arrayBuffer().then(b64); }
  function texteEnB64(s) { return b64(new TextEncoder().encode(s)); }

  /* publier(dire, aBlanc) : dire(message) raconte chaque pas. aBlanc = tout préparer, ne rien envoyer. */
  function publier(dire, aBlanc) {
    dire = dire || function () {};
    var m = manques();
    if (m.length && !aBlanc) return Promise.reject(Object.assign(new Error('Il manque : ' + m.join(' ; ') + '.'), { manques: m }));
    var r = reglages.lire(), c = clone(contenu.brouillon() || publie.contenu), fichiers = [], enAttente = {}, videos = 0, auteur = nom() || 'admin';
    var locaux = [];
    parcourirMedias(c, function (md) { if ((md.src || '').indexOf('local:') === 0) locaux.push(md); });
    dire('Préparation : ' + locaux.length + ' média(s) déposé(s) à regarder.');
    return locaux.reduce(function (p, md) {
      return p.then(function () {
        var id = md.src.slice(6);
        if (md.genre === 'video') { videos++; md.src = ''; md.attendu = (md.attendu || '') + ' (vidéo déposée en local : à mettre sur Cloudflare, puis coller son adresse)'; return null; }
        return medias.prendre(id).then(function (blob) {
          if (!blob) { md.src = ''; return null; }
          var chemin = 'content/media/' + id + '.webp';
          enAttente[chemin] = id; md.src = chemin; delete md.poids; delete md.nom;
          return blobEnB64(blob).then(function (d) { fichiers.push({ path: CHEMIN + 'media/' + id + '.webp', b64: d }); });
        });
      });
    }, Promise.resolve()).then(function () {
      var j = function (o) { return JSON.stringify(o, null, 1) + '\n'; };
      fichiers.push({ path: CHEMIN + 'site-content.json', b64: texteEnB64(j(c)) });
      fichiers.push({ path: CHEMIN + 'script-modifs.json', b64: texteEnB64(j(modifs.fusion(auteur))) });
      fichiers.push({ path: CHEMIN + 'commentaires.json', b64: texteEnB64(j(commentaires.fusion())) });
      fichiers.push({ path: CHEMIN + 'acces.json', b64: texteEnB64(j(acces.table())) });
      if (r.rangerCle && jeton.chiffre()) fichiers.push({ path: CHEMIN + 'deploy-key.json', b64: texteEnB64(j(jeton.chiffre())) });
      if (videos) dire(videos + ' vidéo(s) déposée(s) en local : elles ne partent pas dans git. Elles restent dans le brouillon, à héberger sur Cloudflare.');
      dire(fichiers.length + ' fichier(s) à écrire dans ' + r.depot + '.');
      if (aBlanc) {
        if (m.length) dire('Essai à blanc : rien n\'est envoyé. Il manque : ' + m.join(' ; ') + '.'); else dire('Essai à blanc : rien n\'est envoyé. Tout est prêt.');
        return { aBlanc: true, fichiers: fichiers.map(function (f) { return f.path; }), manques: m };
      }
      var branche, tete;
      return (r.branche ? Promise.resolve({ default_branch: r.branche }) : gh('')).then(function (d) {
        branche = d.default_branch; dire('Branche : ' + branche + '.');
        return gh('/git/ref/heads/' + encodeURIComponent(branche));
      }).then(function (ref) { tete = ref.object.sha; return gh('/git/commits/' + tete); })
        .then(function (commit) {
          var arbre = [];
          return fichiers.reduce(function (p, f, i) {
            return p.then(function () { dire('Envoi ' + (i + 1) + ' / ' + fichiers.length + ' : ' + f.path.replace(CHEMIN, '')); return gh('/git/blobs', 'POST', { content: f.b64, encoding: 'base64' }); })
              .then(function (b) { arbre.push({ path: f.path, mode: '100644', type: 'blob', sha: b.sha }); });
          }, Promise.resolve()).then(function () { return gh('/git/trees', 'POST', { base_tree: commit.tree.sha, tree: arbre }); });
        }).then(function (t) {
          return gh('/git/commits', 'POST', { message: 'Site du projet : contenu publié depuis le site (' + auteur + ')', tree: t.sha, parents: [tete] });
        }).then(function (nc) { return gh('/git/refs/heads/' + encodeURIComponent(branche), 'PATCH', { sha: nc.sha }).then(function () { return nc; }); })
        .then(function (nc) {
          /* tout est parti : le brouillon devient « publié, en attente de déploiement » */
          ecrire('medias-publies', Object.assign(lire('medias-publies', {}), enAttente));
          var reste = contenu.brouillon();
          if (reste) { parcourirMedias(reste, function (md) { var id = (md.src || '').slice(6); Object.keys(enAttente).forEach(function (ch) { if (enAttente[ch] === id && md.genre !== 'video') { md.src = ch; delete md.poids; delete md.nom; } }); }); ecrire('brouillon', reste); }
          var fm = modifs.fusion(auteur), fc = commentaires.fusion();
          ecrire('envoye', { le: maintenant(), commit: nc.sha, contenu: JSON.stringify(c), modifs: JSON.stringify(fm), commentaires: JSON.stringify(fc) });
          ecrire('modifs-envoyees', fm); ecrire('commentaires-envoyes', fc);
          ecrire('modifs', null); ecrire('commentaires', null);
          publie.modifs = lire('modifs-envoyees', {}); publie.commentaires = lire('commentaires-envoyes', { fils: [] });
          signaler();
          dire('Publié. Commit ' + nc.sha.slice(0, 7) + ' sur ' + branche + '. GitHub Pages reconstruit le site : une à deux minutes.');
          return { commit: nc.sha, branche: branche, videos: videos };
        });
    });
  }

  /* Après une publication, le site n'est pas encore reconstruit : on garde ce qu'on vient d'envoyer
     jusqu'à ce que la page servie le contienne. */
  (function rapprocher() {
    var e = lire('envoye', null); if (!e) return;
    var b = lire('brouillon', null);
    var deploye = JSON.stringify(publie.contenu) === e.contenu && JSON.stringify(publie.modifs || {}) === e.modifs && JSON.stringify(publie.commentaires || { fils: [] }) === e.commentaires;
    var perime = Date.now() - new Date(e.le).getTime() > 6 * 3600 * 1000;   /* au-delà, on rend la main à ce que sert le site */
    if (deploye || perime) {
      if (b && JSON.stringify(b) === e.contenu) ecrire('brouillon', null);
      ecrire('envoye', null); ecrire('modifs-envoyees', null); ecrire('commentaires-envoyes', null);
      if (deploye && !acces.aPublier()) ecrire('acces', null);
      if (perime && !deploye) return;
      var mp = lire('medias-publies', {}); Object.keys(mp).forEach(function (k) { medias.retirer(mp[k]).catch(function () {}); }); ecrire('medias-publies', null);
    } else {
      publie.modifs = lire('modifs-envoyees', publie.modifs); publie.commentaires = lire('commentaires-envoyes', publie.commentaires);
    }
  })();

  /* ── prévenir les pages que quelque chose a changé ── */
  var ecouteurs = [];
  function signaler() { ecouteurs.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }

  window.Depot = {
    contenu: contenu, modifs: modifs, commentaires: commentaires, medias: medias, acces: acces, jeton: jeton, reglages: reglages,
    role: role, nom: nom, bilan: bilan, manques: manques, publier: publier, preparerFichier: preparerFichier,
    enAttenteDeDeploiement: function () { return lire('envoye', null); },
    quand: function (f) { ecouteurs.push(f); }, uid: uid, clone: clone, dateFr: dateFr,
    LONG_ADMIN: LONG_ADMIN, LONG_INVITE: LONG_INVITE
  };
})();
