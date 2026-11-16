/* Essai « La toile des personnages » : les personnages en nœuds, les relations en demi-liens orientés
   (ce que A est pour B n'est pas ce que B est pour A), chacune avec le plan depuis lequel elle vaut.
   Un curseur parcourt les 150 plans : la toile montre les relations en cours à ce plan.
   Geste : tirer un lien d'un personnage vers un autre et écrire la relation. Rien ne s'écrit sans Garder. */
(function () {
  'use strict';
  var E = typeof module === 'object' && module.exports ? require('./commun.js') : window.SE_ESSAIS;
  var esc = E.esc, mmss = E.mmss;

  var SORTES = { humaine: 'humaine', robot: 'robot', vivant: 'vivant de Korê', vaisseau: 'vaisseau-semeur' };

  function gestes(e) {
    return e.gardes.concat(e.attente.map(function (g) { return Object.assign({ attente: true }, g); }));
  }

  function ordre(d, n) { return E.index(d.film).plan[n].ordre; }
  function planA(d, t) { return d.film.plans[t - 1]; }
  function noeud(d, id) { return E.parId(d.toile.noeuds, id); }

  // Toutes les paires orientées, avec leurs étapes dans l'ordre du film et celle qui vaut au plan t.
  function paires(d, t, gs) {
    var carte = {}, liste = [];
    var toutes = d.toile.relations.concat((gs || []).filter(function (g) { return g.type === 'lien'; }).map(function (g) {
      return { de: g.de, vers: g.vers, depuis: g.depuis, mot: g.mot, src: 'choix', attente: !!g.attente };
    }));
    toutes.forEach(function (r) {
      var k = r.de + '>' + r.vers;
      if (!carte[k]) { carte[k] = { de: r.de, vers: r.vers, etapes: [] }; liste.push(carte[k]); }
      carte[k].etapes.push(r);
    });
    liste.forEach(function (p) {
      p.etapes.sort(function (a, b) { return ordre(d, a.depuis) - ordre(d, b.depuis); });
      p.actif = null;
      p.etapes.forEach(function (r) { if (ordre(d, r.depuis) <= t) p.actif = r; });
    });
    return liste;
  }

  function present(d, n, t) { return ordre(d, n.entre) <= t; }

  function decrire(d, g) {
    return noeud(d, g.de).nom + ' → ' + noeud(d, g.vers).nom + ', depuis ' + g.depuis + ' : « ' + g.mot + ' »';
  }

  function init(d, gardes) {
    return { version: '25', m9: 'apres-m4', zoom: null, t: 1, sel: 'seed', vers: null, arme: false, attente: [], gardes: gardes || [] };
  }

  function borne(d, t) { return Math.max(1, Math.min(d.film.plans.length, Math.round(Number(t)) || 1)); }

  function reduire(d, e, a) {
    if (a.type === 'revenir') return Object.assign({}, e, { attente: [], arme: false, vers: null });
    var commun = E.reduireCommun(e, a);
    if (commun) return commun;
    switch (a.type) {
      case 't': return Object.assign({}, e, { t: borne(d, a.v) });
      case 'pas': return Object.assign({}, e, { t: borne(d, e.t + Number(a.v)) });
      case 'aller': return E.index(d.film).plan[a.plan] ? Object.assign({}, e, { t: ordre(d, a.plan) }) : e;
      case 'armer': return Object.assign({}, e, { arme: !e.arme, vers: null });
      case 'noeud':
        if (!noeud(d, a.id)) return e;
        if (e.arme && a.id !== e.sel) return Object.assign({}, e, { vers: a.id, arme: false });
        return Object.assign({}, e, { sel: a.id, vers: null, arme: false });
      case 'attendre': {
        var mot = String(a.texte || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        if (!e.vers || !mot) return e;
        return Object.assign({}, e, { vers: null, attente: e.attente.concat([{ type: 'lien', de: e.sel, vers: e.vers, mot: mot, depuis: planA(d, e.t).n }]) });
      }
      default: return e;
    }
  }

  function phrase(d, e) {
    var p = planA(d, e.t), ps = paires(d, e.t, gestes(e)), sel = noeud(d, e.sel);
    if (e.arme) return 'Clique le personnage vers qui part le lien depuis ' + sel.nom + '. Échap pour renoncer.';
    if (e.vers) {
      var ecrit = ps.filter(function (x) { return x.de === e.sel && x.vers === e.vers && x.actif; })[0];
      return sel.nom + ' → ' + noeud(d, e.vers).nom + ' au plan ' + p.n + ' : ' +
        (ecrit ? 'en cours, « ' + ecrit.actif.mot + ' » depuis ' + ecrit.actif.depuis : 'aucune relation écrite') + '. Écris la tienne à droite.';
    }
    if (e.attente.length) return e.attente.length + ' en attente · ' + decrire(d, e.attente[e.attente.length - 1]) + '.';
    var neuves = ps.filter(function (x) { return x.actif && x.actif.depuis === p.n; });
    var actives = ps.filter(function (x) { return x.actif; }).length;
    return 'Plan ' + p.n + ' · ' + actives + ' relation' + (actives > 1 ? 's' : '') + ' en cours · ' +
      (neuves.length ? neuves.map(function (x) { return noeud(d, x.de).nom + ' → ' + noeud(d, x.vers).nom + ' : ' + x.actif.mot; }).join(' ; ') : 'rien ne change à ce plan') + '.';
  }

  function arrondi(v) { return Math.round(v * 10) / 10; }

  // Demi-lien courbe de a vers b : la courbure s'inverse avec le sens, les deux sens ne se superposent pas.
  function arc(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var x1 = a.x + ux * (a.r + 4), y1 = a.y + uy * (a.r + 4), x2 = b.x - ux * (b.r + 11), y2 = b.y - uy * (b.r + 11);
    var cx = (x1 + x2) / 2 - uy * 36, cy = (y1 + y2) / 2 + ux * 36;
    return {
      d: 'M' + arrondi(x1) + ' ' + arrondi(y1) + ' Q' + arrondi(cx) + ' ' + arrondi(cy) + ' ' + arrondi(x2) + ' ' + arrondi(y2),
      mx: arrondi(0.25 * x1 + 0.5 * cx + 0.25 * x2), my: arrondi(0.25 * y1 + 0.5 * cy + 0.25 * y2),
    };
  }

  function figure(d, e) {
    var p = planA(d, e.t), ps = paires(d, e.t, gestes(e)), liens = '', mots = '', noeuds = '';
    ps.forEach(function (x) {
      if (!x.actif) return;
      var a = noeud(d, x.de), b = noeud(d, x.vers), c = arc(a, b);
      var sens = x.de === e.sel ? 'sortant' : x.vers === e.sel ? 'entrant' : 'autre';
      var cls = 'es-lien es-lien-' + sens + (x.actif.src === 'infere' ? ' es-lien-inf' : '') + (x.actif.src === 'choix' ? ' es-lien-choix' : '') +
        (x.actif.attente ? ' es-lien-att' : '') + (x.actif.depuis === p.n ? ' es-lien-neuf' : '');
      liens += '<path class="' + cls + '" d="' + c.d + '" marker-end="url(#es-fl-' + sens + ')"><title>' + esc(a.nom + ' → ' + b.nom + ' : ' + x.actif.mot + ' (depuis ' + x.actif.depuis + ')') + '</title></path>';
      if (sens !== 'autre') mots += '<text class="es-lien-mot es-lien-mot-' + sens + '" x="' + c.mx + '" y="' + c.my + '" text-anchor="middle">' + esc(x.actif.mot) + '</text>';
    });
    d.toile.noeuds.forEach(function (n) {
      var cls = 'es-noeud es-sorte-' + n.sorte + (n.id === e.sel ? ' es-sel' : '') + (n.id === e.vers ? ' es-vers' : '') + (present(d, n, e.t) ? '' : ' es-absent');
      noeuds += '<g class="' + cls + '" data-act="noeud" data-id="' + n.id + '" data-f="n-' + n.id + '" tabindex="0" role="button" aria-label="' + esc(n.nom) + '" aria-pressed="' + (n.id === e.sel) + '">' +
        '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '"></circle>' +
        '<text x="' + n.x + '" y="' + (n.y + n.r + 17) + '" text-anchor="middle">' + esc(n.nom) + '</text></g>';
    });
    var fleches = ['sortant', 'entrant', 'autre'].map(function (s) {
      return '<marker id="es-fl-' + s + '" class="es-fl-' + s + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"></path></marker>';
    }).join('');
    return '<svg class="es-toile" viewBox="0 0 1040 620" role="group" aria-label="La toile des personnages au plan ' + esc(p.n) + '"><defs>' + fleches + '</defs>' + liens + noeuds + mots + '</svg>';
  }

  // Le curseur ne dépend pas de l'état : la zone n'est rendue qu'une fois, sa valeur est posée par apres().
  function curseur(d) {
    var actes = d.film.actes.map(function (a) {
      var premier = d.film.plans.filter(function (p) { return p.acte === a.id; })[0];
      return E.bouton('t', a.nom === 'Prologue' ? 'Prol.' : a.nom, { v: premier.ordre, f: 'acte-' + a.id });
    }).join('');
    return '<div class="es-groupe"><span class="es-et">Aller à l\'acte</span>' + actes + '</div>' +
      '<input class="es-range" type="range" min="1" max="' + d.film.plans.length + '" step="1" value="1" data-range data-act="t" data-f="curseur" aria-label="Plan du film">';
  }

  function plan(d, e) {
    var I = E.index(d.film), p = planA(d, e.t), a = I.acte[p.acte];
    return '<div class="es-garde">' + E.bouton('pas', 'Plan précédent', { v: -1, inactif: e.t <= 1 }) + E.bouton('pas', 'Plan suivant', { v: 1, inactif: e.t >= d.film.plans.length }) +
      '<span class="es-ici">Plan ' + esc(p.n) + ' · à ' + mmss(p.debut_s) + ' · ' + esc(a.nom === 'Prologue' ? 'Prologue' : 'Acte ' + a.nom) + ' · ' + esc(a.titre || '') + '</span></div>' +
      '<p>' + esc(p.action) + '</p>' + (p.son_ecran ? '<p class="es-ecran">' + esc(p.son_ecran) + '</p>' : '');
  }

  function unePaire(d, e, x, titre) {
    var h = '<li><span class="es-ou">' + esc(titre) + '</span><ol class="es-etapes">';
    x.etapes.forEach(function (r) {
      var etat = r === x.actif ? 'es-actif' : ordre(d, r.depuis) > e.t ? 'es-avenir' : 'es-passe';
      h += '<li class="' + etat + '"><button type="button" class="es-bt es-plan-bt" data-act="aller" data-plan="' + r.depuis + '" data-f="aller-' + x.de + '-' + x.vers + '-' + r.depuis + '" title="Mettre le curseur sur ce plan">' + esc(r.depuis) + '</button>' +
        '<span class="es-quoi">' + esc(r.mot) + (r === x.actif ? ' · en cours' : etat === 'es-avenir' ? ' · à venir' : '') + '</span>' + E.prov(d, r) + '</li>';
    });
    return h + '</ol></li>';
  }

  function cote(d, e) {
    var ps = paires(d, e.t, gestes(e)), sel = noeud(d, e.sel), p = planA(d, e.t), h = '';
    h += '<h2>' + esc(sel.nom) + '</h2><p class="es-et">' + esc(SORTES[sel.sorte]) + ' · ' + (present(d, sel, e.t) ? 'dans le film depuis ' : 'entre au plan ') + esc(sel.entre) + '</p>';
    if (e.vers) {
      h += '<div class="es-si"><h3>' + esc(sel.nom + ' → ' + noeud(d, e.vers).nom) + ', depuis ' + esc(p.n) + '</h3>' +
        '<label class="es-champ"><span class="es-et">Ta relation, en quelques mots</span><input type="text" name="mot" maxlength="80" data-f="champ-mot" autocomplete="off"></label>' +
        '<div class="es-garde">' + E.bouton('attendre', 'Mettre en attente', { champ: 'mot' }) + '</div>' +
        '<p class="es-note">Le « depuis » est le plan du curseur. Une relation n\'est jamais posée sans lui.</p></div>';
    } else {
      h += '<div class="es-garde">' + E.bouton('armer', e.arme ? 'Clique le personnage visé…' : 'Tirer un lien depuis ' + sel.nom, { presse: e.arme }) + '</div>';
    }
    var sortants = ps.filter(function (x) { return x.de === e.sel; }), entrants = ps.filter(function (x) { return x.vers === e.sel; });
    h += '<h3>Ce que ' + esc(sel.nom) + ' est pour les autres</h3>' + (sortants.length ? '<ul class="es-liste es-prov">' +
      sortants.map(function (x) { return unePaire(d, e, x, sel.nom + ' → ' + noeud(d, x.vers).nom); }).join('') + '</ul>' : '<p>Aucune relation écrite.</p>');
    h += '<h3>Ce que les autres sont pour ' + esc(sel.nom) + '</h3>' + (entrants.length ? '<ul class="es-liste es-prov">' +
      entrants.map(function (x) { return unePaire(d, e, x, noeud(d, x.de).nom + ' → ' + sel.nom); }).join('') + '</ul>' : '<p>Aucune relation écrite.</p>');
    h += '<h3>Lire la toile</h3><ul class="es-liste es-legende">' +
      '<li><span class="es-trait-leg es-lien-sortant"></span> part du personnage choisi</li>' +
      '<li><span class="es-trait-leg es-lien-entrant"></span> arrive au personnage choisi</li>' +
      '<li><span class="es-trait-leg es-lien-inf"></span> inféré, ou ton choix : en pointillé</li>' +
      '<li><span class="es-src es-src-docx">récit</span> chaque relation écrite porte sa citation du récit de référence (Récit v2)</li></ul>' +
      '<p class="es-note">Une paire absente de la toile n\'a aucune relation écrite : rien n\'est supposé.</p>';
    return h;
  }

  function vue(d, e) {
    return {
      phrase: esc(phrase(d, e)),
      curseur: curseur(d),
      plan: plan(d, e),
      figure: figure(d, e),
      cote: cote(d, e),
      choix: E.choix(e, function (g) { return decrire(d, g); }),
    };
  }

  function apres(racine, e) {
    var r = racine.querySelector('[data-range]');
    if (r && Number(r.value) !== e.t) r.value = e.t;
  }

  function texte(d, e) {
    var l = ['Second Earth · essai « La toile des personnages » · mes choix'];
    e.gardes.forEach(function (g, i) { l.push((i + 1) + '. ' + decrire(d, g)); });
    return l.join('\n');
  }

  E.essais.toile = { init: init, reduire: reduire, vue: vue, texte: texte, apres: apres, paires: paires };
  if (typeof module === 'object' && module.exports) module.exports = E.essais.toile;
})();
