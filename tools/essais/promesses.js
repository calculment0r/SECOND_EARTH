/* Essai « Le livre des promesses » : chaque promesse du film, où elle est posée, où elle est payée,
   à quelle distance ; dans le 25 seul, puis dans le 55 avec ses modules.
   États : posée (payée seulement dans le 55), payée, due (aucun paiement écrit), assumée (choix de Cal).
   Gestes : marquer une promesse due « assumée » ; lui donner un paiement en cliquant une case ;
   passer du 25 au 55. Rien ne s'écrit sans Garder, et rien ne sort du navigateur. */
(function () {
  'use strict';
  var E = typeof module === 'object' && module.exports ? require('./commun.js') : window.SE_ESSAIS;
  var esc = E.esc, mmss = E.mmss;

  var CLASSE = { 'posée': 'posee', 'payée': 'payee', 'due': 'due', 'assumée': 'assumee', 'payée sans avoir été posée': 'orpheline' };
  var FILTRES = [['toutes', 'Toutes'], ['crochet', 'Crochets du 55'], ['interne', 'Dans le 25'], ['due', 'Dues'], ['regarder', 'À regarder']];

  function gestes(e) {
    return e.gardes.concat(e.attente.map(function (g) { return Object.assign({ attente: true }, g); }));
  }

  function visibles(ax, pts) {
    return pts.map(function (p) { return { p: p, t: E.tPoint(ax, p) }; })
      .filter(function (x) { return x.t != null; })
      .sort(function (a, b) { return a.t - b.t; });
  }

  // L'état d'une promesse sur un axe donné, avec les gestes de Cal (gardés ou en attente).
  function etatPromesse(ax, pr, gs) {
    var posee = visibles(ax, pr.posee), payee = visibles(ax, pr.payee), assumee = false;
    (gs || []).forEach(function (g) {
      if (g.promesse !== pr.id) return;
      if (g.type === 'assumer') assumee = true;
      if (g.type === 'paiement') {
        var t = E.tPoint(ax, g.cible);
        if (t != null) payee.push({ p: Object.assign({ src: 'choix' }, g.cible), t: t, choix: true, attente: !!g.attente });
      }
    });
    payee.sort(function (a, b) { return a.t - b.t; });
    var ailleurs = ax.version === '25' ? pr.payee.filter(function (p) { return p.module; }) : [];
    var mot;
    if (!posee.length) mot = 'payée sans avoir été posée';
    else if (payee.length) mot = 'payée';
    else if (ailleurs.length) mot = 'posée';
    else mot = assumee ? 'assumée' : 'due';
    // une pose qu'aucun paiement ne suit : le paiement précède la promesse
    var inverse = payee.length ? posee.filter(function (x) { return !payee.some(function (y) { return y.t >= x.t; }); }) : [];
    var premier = posee.length ? payee.filter(function (y) { return y.t >= posee[0].t; })[0] || null : null;
    return {
      posee: posee, payee: payee, mot: mot, ailleurs: ailleurs, inverse: inverse,
      distance: premier ? premier.t - posee[0].t : null, premier: premier,
      debut: posee.length ? posee[0].t : payee.length ? payee[0].t : 0,
    };
  }

  function aRegarder(pr, et) {
    return et.inverse.length > 0 || et.mot === 'payée sans avoir été posée' || (pr.alertes || []).length > 0;
  }

  function decrire(d, g) {
    var pr = E.parId(d.promesses, g.promesse);
    if (g.type === 'assumer') return '« ' + pr.titre + ' » : assumée, laissée ouverte à dessein';
    return '« ' + pr.titre + ' » : payée en ' + E.nomPoint(g.cible);
  }

  function init(d, gardes) {
    return { version: '25', m9: 'apres-m4', zoom: null, sel: null, cas: null, arme: false, filtre: 'toutes', attente: [], gardes: gardes || [] };
  }

  function reduire(d, e, a) {
    var commun = E.reduireCommun(e, a);
    if (commun) return commun;
    switch (a.type) {
      case 'filtre': return Object.assign({}, e, { filtre: a.v });
      case 'sel': return Object.assign({}, e, { sel: e.sel === a.id ? null : a.id, cas: null, arme: false });
      case 'armer': return e.sel ? Object.assign({}, e, { arme: !e.arme }) : e;
      case 'assumer':
        if (!e.sel) return e;
        return Object.assign({}, e, {
          attente: e.attente.filter(function (g) { return !(g.type === 'assumer' && g.promesse === e.sel); }).concat([{ type: 'assumer', promesse: e.sel }]),
        });
      case 'case': {
        var cible = a.plan ? { plan: a.plan } : { module: a.module };
        if (e.arme && e.sel) {
          return Object.assign({}, e, {
            arme: false,
            attente: e.attente.filter(function (g) { return !(g.type === 'paiement' && g.promesse === e.sel); })
              .concat([{ type: 'paiement', promesse: e.sel, cible: cible }]),
          });
        }
        return Object.assign({}, e, { cas: cible, sel: null, arme: false });
      }
      default: return e;
    }
  }

  function phrase(d, e, ax, liste) {
    var sel = e.sel ? liste.filter(function (x) { return x.pr.id === e.sel; })[0] : null;
    if (e.arme && sel) {
      return 'Choisis la case qui paierait « ' + sel.pr.titre + ' » : ' + (e.zoom ? 'clique un plan' : 'ouvre un acte, puis clique un plan') +
        (e.version === '55' ? ', ou clique un module' : '') + '. Échap pour renoncer.';
    }
    if (e.attente.length) {
      var g = e.attente[e.attente.length - 1], pr = E.parId(d.promesses, g.promesse), txt = e.attente.length + ' en attente · ';
      if (g.type === 'assumer') return txt + '« ' + pr.titre + ' » resterait ouverte à dessein : assumée, plus due.';
      var et = etatPromesse(ax, pr, [Object.assign({ attente: true }, g)]), t = E.tPoint(ax, g.cible);
      txt += '« ' + pr.titre + ' » serait payée en ' + E.nomPoint(g.cible);
      if (t == null) return txt + ' · ce module n\'existe que dans le 55.';
      if (et.posee.length && t < et.posee[0].t) return txt + ' · ce paiement viendrait avant la promesse.';
      return txt + (et.distance != null ? ' · distance ' + mmss(et.distance) : '') + '.';
    }
    if (sel) {
      var s = '« ' + sel.pr.titre + ' » · ';
      s += sel.et.posee.length ? 'posée en ' + sel.et.posee.map(function (x) { return E.nomPoint(x.p); }).join(', ') : 'jamais posée';
      if (sel.et.payee.length) s += ' · payée en ' + sel.et.payee.map(function (x) { return E.nomPoint(x.p); }).join(', ');
      else if (sel.et.ailleurs.length) s += ' · payée dans le 55 seulement (' + sel.et.ailleurs.map(E.nomPoint).join(', ') + ')';
      else s += ' · aucun paiement écrit';
      if (sel.et.distance != null) s += ' · distance ' + mmss(sel.et.distance);
      return s + '.';
    }
    return 'Clique une promesse pour voir où elle est posée, où elle est payée, et à quelle distance.';
  }

  function outils(d, e, ax, fen, liste) {
    var h = E.outilsAxe(d, e, ax, fen, { m9: true }) + '<div class="es-groupe"><span class="es-et">Montrer</span>';
    FILTRES.forEach(function (f) {
      var n = liste.filter(function (x) { return garde(f[0], x); }).length;
      h += E.bouton('filtre', f[1] + ' · ' + n, { v: f[0], presse: e.filtre === f[0] });
    });
    return h + '</div>';
  }

  function garde(filtre, x) {
    if (filtre === 'crochet' || filtre === 'interne') return x.pr.genre === filtre;
    if (filtre === 'due') return x.et.mot === 'due' || x.et.mot === 'assumée';
    if (filtre === 'regarder') return aRegarder(x.pr, x.et);
    return true;
  }

  function figure(d, e, ax, fen, liste) {
    var h = '<div class="es-ligne es-tete"><div class="es-gauche es-et">' +
      (fen.acte ? 'Plans' : 'Actes' + (e.version === '55' ? ' et modules' : '')) + ' · ' + mmss(fen.t1 - fen.t0) +
      '</div><div class="es-piste es-bande">' + E.cases(d, ax, fen, { etiquette: true }) + '</div></div>';
    liste.forEach(function (x) {
      var et = x.et, pts = '', tous = et.posee.concat(et.payee);
      if (tous.length > 1) {
        var a = Math.min.apply(null, tous.map(function (y) { return y.t; })), b = Math.max.apply(null, tous.map(function (y) { return y.t; }));
        var xa = Math.max(0, E.xDe(fen, a)), xb = Math.min(100, E.xDe(fen, b));
        if (xb > xa) pts += '<i class="es-trait" style="left:' + xa.toFixed(3) + '%;width:' + (xb - xa).toFixed(3) + '%"></i>';
      }
      et.posee.forEach(function (y) { pts += unPoint(fen, y, 'posee', 'posée en ' + E.nomPoint(y.p)); });
      et.payee.forEach(function (y) { pts += unPoint(fen, y, 'payee' + (y.choix ? ' es-pt-choix' : '') + (y.attente ? ' es-pt-att' : ''), 'payée en ' + E.nomPoint(y.p)); });
      var att = e.attente.some(function (g) { return g.promesse === x.pr.id; });
      h += '<div class="es-ligne' + (e.sel === x.pr.id ? ' es-sel' : '') + (att ? ' es-att' : '') + '">' +
        '<button type="button" class="es-gauche es-nom" data-act="sel" data-id="' + x.pr.id + '" data-f="sel-' + x.pr.id + '" aria-pressed="' + (e.sel === x.pr.id) + '">' +
        '<span class="es-mot es-mot-' + CLASSE[et.mot] + '">' + esc(et.mot === 'payée sans avoir été posée' ? 'sans pose' : et.mot) + '</span>' +
        '<span class="es-titre">' + esc(x.pr.titre) + (aRegarder(x.pr, et) ? ' <span class="es-vu">à regarder</span>' : '') + '</span></button>' +
        '<div class="es-piste">' + pts + '</div></div>';
    });
    if (!liste.length) h += '<p class="es-vide">Aucune promesse dans ce tri.</p>';
    return h;
  }

  function unPoint(fen, y, cls, titre) {
    var pl = E.place(fen, y.t);
    return '<i class="es-pt es-pt-' + cls + (pl.hors ? ' es-pt-hors' : '') + '" style="left:' + pl.x.toFixed(3) + '%" title="' + esc(titre + (pl.hors ? ' (hors de cette vue)' : '')) + '"></i>';
  }

  function lignePoint(d, ax, pt, role) {
    var I = E.index(d.film), nom = E.nomPoint(pt), absent = E.tPoint(ax, pt) == null;
    var quoi = pt.plan ? I.plan[pt.plan].action : I.module[pt.module].titre + ' (module du 55)';
    return '<li><span class="es-ou">' + role + ' · ' + esc(nom) + (absent ? ' · dans le 55 seulement' : '') + '</span>' +
      '<span class="es-quoi">' + esc(quoi) + '</span>' + E.prov(d, pt) + '</li>';
  }

  function cote(d, e, ax, liste) {
    var I = E.index(d.film), h = '';
    var sel = e.sel ? liste.filter(function (x) { return x.pr.id === e.sel; })[0] : null;
    if (sel) {
      var pr = sel.pr, et = sel.et, gs = gestes(e);
      h += '<h2>' + esc(pr.titre) + '</h2><p><span class="es-mot es-mot-' + CLASSE[et.mot] + '">' + esc(et.mot) + '</span> ' +
        esc(pr.genre === 'crochet' ? 'Crochet que le 55 déplie.' : 'Posée et payée à l\'intérieur du 25.') + '</p>';
      if (et.mot === 'posée') h += '<p>Dans le 25, elle reste posée : c\'est ' + esc(et.ailleurs.map(E.nomPoint).join(', ')) + ', dans le 55, qui la paie.</p>';
      if (et.mot === 'due') h += '<p>Aucun document ne dit où elle est payée.</p>';
      h += '<h3>Qui dit que c\'est une promesse</h3><ul class="es-liste es-prov"><li>' + E.prov(d, pr.dit) + '</li></ul>';
      h += '<h3>Les points</h3><ul class="es-liste es-prov">';
      pr.posee.forEach(function (pt) { h += lignePoint(d, ax, pt, 'posée'); });
      pr.payee.forEach(function (pt) { h += lignePoint(d, ax, pt, 'payée'); });
      et.payee.filter(function (y) { return y.choix; }).forEach(function (y) { h += lignePoint(d, ax, y.p, y.attente ? 'payée (en attente)' : 'payée (gardé)'); });
      if (!pr.posee.length) h += '<li><span class="es-ou">posée</span><span class="es-quoi">Aucun plan ne la pose.</span></li>';
      h += '</ul>';
      var d25 = etatPromesse(E.axe(d.film, '25', e.m9), pr, gs), d55 = etatPromesse(E.axe(d.film, '55', e.m9), pr, gs);
      h += '<h3>Distance entre la pose et le premier paiement</h3><p>Dans le 25 : ' + (d25.distance != null ? mmss(d25.distance) : 'pas de paiement') +
        ' · dans le 55 : ' + (d55.distance != null ? mmss(d55.distance) : 'pas de paiement après la pose') + '</p>';
      var notes = et.inverse.map(function (y) {
        return 'Posée en ' + E.nomPoint(y.p) + ', après son dernier paiement (' + E.nomPoint(et.payee[et.payee.length - 1].p) + ') : le paiement précède la promesse.';
      });
      if (et.mot === 'payée sans avoir été posée') notes.push('Elle est payée sans qu\'aucun plan ne l\'ait posée.');
      if (notes.length || (pr.alertes || []).length) {
        h += '<h3>À regarder</h3><ul class="es-liste es-prov">' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('');
        (pr.alertes || []).forEach(function (al) {
          h += '<li>' + esc(al.texte) + al.preuves.map(function (p) { return '<div class="es-preuve">' + E.prov(d, p) + '</div>'; }).join('') + '</li>';
        });
        h += '</ul>';
      }
      if (et.mot === 'due' || et.mot === 'assumée') {
        h += '<h3>Tes gestes</h3><div class="es-garde">' +
          (et.mot === 'due' ? E.bouton('assumer', 'La marquer assumée') : '') +
          E.bouton('armer', e.arme ? 'Choisis une case…' : 'Lui donner un paiement', { presse: e.arme }) + '</div>' +
          '<p class="es-note">« Assumée » : ouverte à dessein, ce n\'est pas une faute. Un paiement donné ici est une hypothèse de lecture, marquée « ton choix ».</p>';
      }
      return h;
    }
    if (e.cas) {
      var nom = E.nomPoint(e.cas), touchent = liste.filter(function (x) {
        return x.pr.posee.concat(x.pr.payee).some(function (pt) { return E.nomPoint(pt) === nom; });
      });
      if (e.cas.plan) {
        var p = I.plan[e.cas.plan];
        h += '<h2>Plan ' + esc(p.n) + '</h2><p class="es-et">' + p.duree_s + ' s · ' + esc(p.cadre) + (ax.plan[p.n] ? ' · à ' + mmss(ax.plan[p.n].t0) : '') + '</p><p>' + esc(p.action) + '</p>' +
          (p.son_ecran ? '<p class="es-ecran">' + esc(p.son_ecran) + '</p>' : '') + (p.note ? '<p class="es-note">' + esc(p.note) + '</p>' : '');
      } else {
        var m = I.module[e.cas.module];
        h += '<h2>' + esc(m.id + ' · ' + m.titre) + '</h2><p class="es-et">Module du 55 · ' + mmss(m.duree_s) + '</p><p>' + esc(m.contenu) + '</p><p class="es-note">Enjeu : ' + esc(m.enjeu) + '</p>';
      }
      h += '<h3>Promesses qui passent par là</h3>' + (touchent.length ? '<div class="es-garde">' + touchent.map(function (x) {
        return E.bouton('sel', x.pr.titre, { id: x.pr.id, f: 'cas-' + x.pr.id });
      }).join('') + '</div>' : '<p>Aucune.</p>');
      return h;
    }
    var compte = {};
    liste.forEach(function (x) { compte[x.et.mot] = (compte[x.et.mot] || 0) + 1; });
    h += '<h2>Ce que montre cet essai</h2><p>' + liste.length + ' promesses dans le film de ' + (e.version === '55' ? '55' : '25') + ' min : ' +
      Object.keys(compte).map(function (k) { return compte[k] + ' ' + (k === 'payée sans avoir été posée' ? 'payée sans pose' : k) + (compte[k] > 1 && k !== 'payée sans avoir été posée' ? 's' : ''); }).join(', ') + '.</p>' +
      '<ul class="es-liste es-legende">' +
      '<li><i class="es-pt es-pt-posee"></i> posée : le plan où la promesse est faite</li>' +
      '<li><i class="es-pt es-pt-payee"></i> payée : le plan ou le module qui la tient</li>' +
      '<li><span class="es-mot es-mot-posee">posée</span> payée seulement dans le 55</li>' +
      '<li><span class="es-mot es-mot-due">due</span> aucun paiement écrit</li>' +
      '<li><span class="es-mot es-mot-assumee">assumée</span> ouverte à dessein (ton choix)</li>' +
      '</ul><h3>Provenance</h3><ul class="es-liste es-legende">' +
      '<li><span class="es-src es-src-docx">récit</span> écrit dans le récit de référence (Récit v2)</li>' +
      '<li><span class="es-src es-src-hors">hors récit</span> écrit dans le découpage, le séquencier, l\'architecture ou les modules</li>' +
      '<li><span class="es-src es-src-inf">inféré</span> déduit, avec les plans qui le fondent</li>' +
      '</ul><p class="es-note">Dans le 55, chaque module est posé juste après le plan de sa charnière : c\'est une convention de cet essai, les documents disent seulement « le 55 ouvre ici ».</p>';
    return h;
  }

  function prepare(d, e) {
    var ax = E.axe(d.film, e.version, e.m9), gs = gestes(e);
    var liste = d.promesses.filter(function (pr) { return e.version === '55' || !pr.seulement_55; })
      .map(function (pr) { return { pr: pr, et: etatPromesse(ax, pr, gs) }; })
      .sort(function (a, b) { return a.et.debut - b.et.debut; });
    return { ax: ax, fen: E.fenetre(ax, e.zoom), liste: liste };
  }

  function vue(d, e) {
    var c = prepare(d, e), montre = c.liste.filter(function (x) { return garde(e.filtre, x); });
    return {
      phrase: esc(phrase(d, e, c.ax, c.liste)),
      outils: outils(d, e, c.ax, c.fen, c.liste),
      figure: figure(d, e, c.ax, c.fen, montre),
      cote: cote(d, e, c.ax, c.liste),
      choix: E.choix(e, function (g) { return decrire(d, g); }),
    };
  }

  function texte(d, e) {
    var l = ['Second Earth · essai « Le livre des promesses » · mes choix'];
    e.gardes.forEach(function (g, i) { l.push((i + 1) + '. ' + decrire(d, g)); });
    return l.join('\n');
  }

  E.essais.promesses = { init: init, reduire: reduire, vue: vue, texte: texte, etatPromesse: etatPromesse, prepare: prepare };
  if (typeof module === 'object' && module.exports) module.exports = E.essais.promesses;
})();
