/* Essai « La Partition du savoir » : une portée par personnage et une pour le spectateur.
   Pour chaque fait, le plan où chacun l'apprend ; l'écart entre deux portées se dessine et se nomme d'un mot :
   ironie (le spectateur sait, le personnage non), suspense (pareil, quand le fait est une menace),
   surprise (un personnage savait avant le spectateur), secret (Rob1 sait et le tait à Seed).
   Geste : poser un « apprend » sur une case, pour voir ce que l'écart deviendrait. Rien ne s'écrit sans Garder. */
(function () {
  'use strict';
  var E = typeof module === 'object' && module.exports ? require('./commun.js') : window.SE_ESSAIS;
  var esc = E.esc, mmss = E.mmss;

  var SAIT = { 'sait': true, 'apprend': true };
  var PERSONNAGES = ['seed', 'rob1', 'terre'];
  var CLASSE = { 'sait': 'sait', 'apprend': 'apprend', 'pressent': 'pressent', 'croit à tort': 'tort' };

  function gestes(e) {
    return e.gardes.concat(e.attente.map(function (g) { return Object.assign({ attente: true }, g); }));
  }

  function nomPortee(d, k) { return E.parId(d.savoir.portees, k).nom; }

  // Ce qu'une portée sait d'un fait sur cet axe : ses points, et le premier où elle sait vraiment.
  function portee(ax, fait, k, gs) {
    var items = fait.portees[k];
    if (!items) return null;
    var pts = items.filter(function (i) { return i.plan || i.module; })
      .map(function (i) { return { i: i, t: E.tPoint(ax, i) }; })
      .filter(function (x) { return x.t != null; });
    (gs || []).forEach(function (g) {
      if (g.type !== 'apprend' || g.fait !== fait.id || g.portee !== k) return;
      pts.push({ i: { plan: g.plan, mode: 'apprend', src: 'choix' }, t: E.tPoint(ax, { plan: g.plan }), choix: true, attente: !!g.attente });
    });
    pts.sort(function (a, b) { return a.t - b.t; });
    var sait = pts.filter(function (x) { return SAIT[x.i.mode]; })[0] || null;
    return {
      items: items, pts: pts, t: sait ? sait.t : null, quand: sait ? E.nomPoint(sait.i) : null,
      manquant: !sait && items.some(function (i) { return i.mode === 'manquant'; }),
    };
  }

  // Les écarts d'un fait : entre le spectateur et chaque personnage, et le secret de Rob1 quand le récit l'écrit.
  function ecarts(ax, fait, gs) {
    var sp = portee(ax, fait, 'spectateur', gs), out = [], devant = null;
    PERSONNAGES.forEach(function (k) {
      var c = portee(ax, fait, k, gs);
      if (!c) return;
      if (c.manquant) { out.push({ sur: k, mot: 'non écrit' }); return; }
      if (sp.t != null && (c.t == null || c.t > sp.t)) {
        out.push({ sur: k, mot: fait.menace ? 'suspense' : 'ironie', t0: sp.t, t1: c.t == null ? ax.total : c.t, ouvert: c.t == null, de: sp.quand, a: c.quand });
      } else if (c.t != null && (sp.t == null || c.t < sp.t) && (!devant || c.t < devant.t)) {
        devant = { t: c.t, k: k, quand: c.quand };
      }
    });
    if (devant) {
      out.push({ sur: 'spectateur', mot: 'surprise', t0: devant.t, t1: sp.t == null ? ax.total : sp.t, ouvert: sp.t == null, de: devant.quand, a: sp.quand, qui: devant.k });
    }
    if (fait.cache) {
      var r = portee(ax, fait, fait.cache.de, gs), s = portee(ax, fait, fait.cache.a, gs);
      if (r && s && r.t != null && (s.t == null || s.t > r.t)) {
        var t0 = Math.max(r.t, E.tPoint(ax, { plan: fait.cache.plan })), t1 = s.t == null ? ax.total : s.t;
        if (t1 > t0) out.push({ sur: fait.cache.a, mot: 'secret', t0: t0, t1: t1, ouvert: s.t == null, de: fait.cache.plan, a: s.quand, qui: fait.cache.de });
      }
    }
    return out;
  }

  function nomEcart(x) {
    if (!x.ouvert) return x.mot;
    return { 'ironie': 'ironie ouverte', 'suspense': 'suspense ouvert', 'surprise': 'jamais dit au spectateur', 'secret': 'secret gardé jusqu\'au bout' }[x.mot] || x.mot;
  }

  function resume(d, x) {
    if (x.mot === 'non écrit') return 'non écrit · ' + nomPortee(d, x.sur);
    return nomEcart(x) + ' · ' + nomPortee(d, x.sur) + ' · ' + x.de + (x.ouvert ? ' → fin' : ' → ' + x.a) + ' · ' + mmss(x.t1 - x.t0);
  }

  // Les mots de Seed dits pendant un écart qui porte sur elle.
  function motsDans(d, ax, x) {
    if (x.sur !== 'seed' || x.t0 == null) return [];
    return d.film.mots.filter(function (m) { var t = E.tPoint(ax, { plan: m.plan }); return t >= x.t0 && t < x.t1; });
  }

  // Ce que deviendraient les écarts si le geste était gardé : trois conséquences au plus.
  function prevoir(d, ax, g, gs) {
    var fait = E.parId(d.savoir.faits, g.fait);
    var avant = ecarts(ax, fait, gs), apres = ecarts(ax, fait, gs.concat([g])), suites = [];
    var cle = function (x) { return x.sur + '/' + x.mot; };
    avant.forEach(function (x) {
      var y = apres.filter(function (z) { return cle(z) === cle(x); })[0];
      var duree = x.ouvert ? 'jusqu\'à la fin' : mmss(x.t1 - x.t0);
      if (!y) suites.push('L\'écart « ' + x.mot + ' » sur ' + nomPortee(d, x.sur) + ' disparaît (il durait ' + duree + ').');
      else if (y.t0 !== x.t0 || y.t1 !== x.t1) {
        suites.push('L\'écart « ' + y.mot + ' » sur ' + nomPortee(d, y.sur) + ' durerait ' + (y.ouvert ? 'jusqu\'à la fin' : mmss(y.t1 - y.t0)) + ', au lieu de ' + duree + '.');
      }
    });
    apres.forEach(function (y) {
      if (!avant.some(function (x) { return cle(x) === cle(y); })) suites.push('Nouveau : ' + resume(d, y) + '.');
    });
    if (g.portee === 'seed') {
      var m0 = [], m1 = [];
      avant.forEach(function (x) { m0 = m0.concat(motsDans(d, ax, x)); });
      apres.forEach(function (x) { m1 = m1.concat(motsDans(d, ax, x)); });
      var perdus = m0.filter(function (m) { return m1.indexOf(m) === -1; });
      if (perdus.length) suites.push('Seed dirait ' + perdus.map(function (m) { return m.texte + ' (' + m.plan + ')'; }).join(', ') + ' en le sachant.');
    }
    return { fait: fait, suites: suites.slice(0, 3), phrase: nomPortee(d, g.portee) + ' apprendrait « ' + fait.titre + ' » en ' + g.plan };
  }

  function decrire(d, g) {
    var fait = E.parId(d.savoir.faits, g.fait);
    return '« ' + fait.titre + ' » : ' + nomPortee(d, g.portee) + ' l\'apprendrait en ' + g.plan;
  }

  function init(d, gardes) {
    return { version: '25', m9: 'apres-m4', zoom: null, sel: null, cas: null, arme: false, attente: [], gardes: gardes || [] };
  }

  function reduire(d, e, a) {
    var commun = E.reduireCommun(e, a);
    if (commun) return commun;
    switch (a.type) {
      case 'sel': return Object.assign({}, e, { sel: e.sel === a.id ? null : a.id, cas: null, arme: false });
      case 'armer': return e.sel ? Object.assign({}, e, { arme: !e.arme }) : e;
      case 'case':
        if (e.arme && e.sel) {
          if (!a.plan || !a.portee) return e;
          return Object.assign({}, e, {
            arme: false,
            attente: e.attente.filter(function (g) { return !(g.fait === e.sel && g.portee === a.portee); })
              .concat([{ type: 'apprend', fait: e.sel, portee: a.portee, plan: a.plan }]),
          });
        }
        return Object.assign({}, e, { cas: a.plan ? { plan: a.plan } : { module: a.module }, arme: false });
      default: return e;
    }
  }

  function phrase(d, e, ax) {
    var fait = e.sel ? E.parId(d.savoir.faits, e.sel) : null;
    if (e.arme && fait) {
      return 'Qui apprendrait « ' + fait.titre + ' », et quand ? ' + (e.zoom ? 'Clique un plan sur sa portée.' : 'Ouvre un acte, puis clique un plan sur sa portée.') + ' Échap pour renoncer.';
    }
    if (e.attente.length) {
      var p = prevoir(d, ax, e.attente[e.attente.length - 1], e.gardes);
      return e.attente.length + ' en attente · ' + p.phrase + (p.suites.length ? ' · ' + p.suites[0] : ' · aucun écart ne change.');
    }
    if (fait) {
      var ec = ecarts(ax, fait, gestes(e));
      return '« ' + fait.titre + ' » · ' + (ec.length ? ec.map(function (x) { return resume(d, x); }).join(' ; ') : 'tous l\'apprennent ensemble, aucun écart') + '.';
    }
    return 'Clique un fait pour voir qui le sait, depuis quel plan, et l\'écart avec le spectateur.';
  }

  function figure(d, e, ax, fen) {
    var gs = gestes(e), fait = e.sel ? E.parId(d.savoir.faits, e.sel) : null, ec = fait ? ecarts(ax, fait, gs) : [];
    var h = '<div class="es-ligne es-tete"><div class="es-gauche es-et">' + (fen.acte ? 'Plans' : 'Actes' + (e.version === '55' ? ' et modules' : '')) + ' · ' + mmss(fen.t1 - fen.t0) +
      '</div><div class="es-piste es-bande">' + E.cases(d, ax, fen, { etiquette: true }) + '</div></div>';
    d.savoir.portees.forEach(function (po) {
      var k = po.id, sur = '', etat = '';
      if (!e.arme) {
        d.savoir.faits.forEach(function (f) {
          if (fait && f.id === fait.id) return;
          var c = portee(ax, f, k, gs);
          if (!c) return;
          c.pts.forEach(function (x) {
            var pl = E.place(fen, x.t);
            if (!pl.hors) sur += '<i class="es-tic" style="left:' + pl.x.toFixed(3) + '%" data-act="sel" data-id="' + f.id + '" title="' + esc(f.titre + ' · ' + x.i.mode + ' en ' + E.nomPoint(x.i)) + '"></i>';
          });
        });
      }
      if (fait) {
        var c = portee(ax, fait, k, gs);
        ec.forEach(function (x) {
          if (x.sur !== k || x.t0 == null) return;
          var a = Math.max(0, E.xDe(fen, x.t0)), b = Math.min(100, E.xDe(fen, x.t1));
          if (b > a) sur += '<i class="es-ecart es-ecart-' + x.mot + (x.ouvert ? ' es-ouvert' : '') + '" style="left:' + a.toFixed(3) + '%;width:' + (b - a).toFixed(3) + '%"><span>' + esc(nomEcart(x)) + '</span></i>';
        });
        if (!c) etat = 'sans objet';
        else {
          c.pts.forEach(function (x) {
            var pl = E.place(fen, x.t);
            sur += '<i class="es-pt es-mode-' + CLASSE[x.i.mode] + (x.choix ? ' es-pt-choix' : '') + (x.attente ? ' es-pt-att' : '') + (pl.hors ? ' es-pt-hors' : '') +
              '" style="left:' + pl.x.toFixed(3) + '%" title="' + esc(x.i.mode + ' en ' + E.nomPoint(x.i)) + '"></i>';
            if (!pl.hors) sur += '<span class="es-etq" style="left:' + pl.x.toFixed(3) + '%">' + esc(x.i.mode + ' · ' + E.nomPoint(x.i)) + '</span>';
          });
          etat = c.t != null ? 'le sait depuis ' + c.quand : c.manquant ? 'non écrit' : 'ne le sait pas';
        }
      }
      h += '<div class="es-ligne es-portee' + (e.arme ? ' es-cible' : '') + '"><div class="es-gauche"><span class="es-titre">' + esc(po.nom) + '</span>' +
        (etat ? '<span class="es-et">' + esc(etat) + '</span>' : '') + '</div><div class="es-piste">' + E.cases(d, ax, fen, { portee: k }) + sur + '</div></div>';
    });
    return h;
  }

  function listeFaits(d, e, ax) {
    var gs = gestes(e), h = '';
    var lignes = d.savoir.faits.map(function (f) {
      var sp = portee(ax, f, 'spectateur', gs), tous = [];
      Object.keys(f.portees).forEach(function (k) { var c = portee(ax, f, k, gs); c.pts.forEach(function (x) { tous.push(x.t); }); });
      return { f: f, ec: ecarts(ax, f, gs), t: sp.t != null ? sp.t : tous.length ? Math.min.apply(null, tous) : ax.total };
    }).sort(function (a, b) { return a.t - b.t; });
    lignes.forEach(function (l) {
      var att = e.attente.some(function (g) { return g.fait === l.f.id; });
      h += '<button type="button" class="es-fait' + (e.sel === l.f.id ? ' es-sel' : '') + (att ? ' es-att' : '') + '" data-act="sel" data-id="' + l.f.id + '" data-f="fait-' + l.f.id + '" aria-pressed="' + (e.sel === l.f.id) + '">' +
        '<span class="es-titre">' + esc(l.f.titre) + '</span><span class="es-ecs">' +
        (l.ec.length ? l.ec.map(function (x) { return '<span class="es-mot es-ec-' + (x.mot === 'non écrit' ? 'manque' : x.mot) + '">' + esc(resume(d, x)) + '</span>'; }).join('') : '<span class="es-et">appris ensemble</span>') +
        '</span></button>';
    });
    return h;
  }

  function cote(d, e, ax) {
    var I = E.index(d.film), gs = gestes(e), h = '';
    var fait = e.sel ? E.parId(d.savoir.faits, e.sel) : null;
    if (fait) {
      h += '<h2>' + esc(fait.titre) + '</h2>';
      if (e.attente.length && e.attente[e.attente.length - 1].fait === fait.id) {
        var p = prevoir(d, ax, e.attente[e.attente.length - 1], e.gardes);
        h += '<div class="es-si"><h3>Si tu gardes</h3><p>' + esc(p.phrase) + '.</p><p class="es-et">Ne bouge pas : le texte des plans, les autres portées.</p><ul class="es-liste">' +
          (p.suites.length ? p.suites.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') : '<li>Aucun écart ne change.</li>') + '</ul></div>';
      }
      d.savoir.portees.forEach(function (po) {
        var c = portee(ax, fait, po.id, gs);
        if (!c) return;
        h += '<h3>' + esc(po.nom) + '</h3><ul class="es-liste es-prov">';
        c.items.forEach(function (it) {
          var nom = it.plan || it.module, absent = nom && E.tPoint(ax, it) == null;
          h += '<li><span class="es-ou">' + esc(it.mode === 'manquant' ? 'non écrit' : it.mode === 'ignore' ? 'ne le sait pas' : it.mode + ' · ' + nom) + (absent ? ' · dans le 55 seulement' : '') + '</span>' + E.prov(d, it) + '</li>';
        });
        c.pts.filter(function (x) { return x.choix; }).forEach(function (x) {
          h += '<li><span class="es-ou">apprend · ' + esc(x.i.plan) + (x.attente ? ' · en attente' : ' · gardé') + '</span>' + E.prov(d, x.i) + '</li>';
        });
        h += '</ul>';
      });
      var ec = ecarts(ax, fait, gs);
      h += '<h3>Écarts</h3>';
      if (!ec.length) h += '<p>Aucun : chacun l\'apprend au même plan que le spectateur.</p>';
      else {
        h += '<ul class="es-liste es-prov">';
        ec.forEach(function (x) {
          h += '<li><span class="es-mot es-ec-' + (x.mot === 'non écrit' ? 'manque' : x.mot) + '">' + esc(resume(d, x)) + '</span>';
          if (x.mot === 'surprise') h += '<span class="es-quoi">' + esc(nomPortee(d, x.qui)) + ' le savait avant le spectateur.</span>';
          if (x.mot === 'secret') h += '<span class="es-quoi">' + esc(nomPortee(d, x.qui)) + ' le sait et ne le dit pas.</span>' + E.prov(d, fait.cache);
          var mots = motsDans(d, ax, x);
          if (mots.length) h += '<span class="es-quoi">Mots de Seed dits pendant cet écart : ' + esc(mots.map(function (m) { return m.texte + ' (' + m.plan + ')'; }).join(', ')) + '</span>';
          h += '</li>';
        });
        h += '</ul>';
      }
      if (fait.menace) h += '<p class="es-note">« Suspense » plutôt qu\'« ironie » parce que ce fait est une menace : ce classement est de moi, pas des documents.</p>';
      h += '<h3>Ton geste</h3><div class="es-garde">' + E.bouton('armer', e.arme ? 'Clique une case sur une portée…' : 'Poser un « apprend »', { presse: e.arme }) + '</div>' +
        '<p class="es-note">Une hypothèse de lecture : qui l\'apprendrait, à quel plan. La page dit ce que l\'écart deviendrait.</p>';
      return h;
    }
    if (e.cas) {
      var nom = E.nomPoint(e.cas);
      if (e.cas.plan) {
        var pl = I.plan[e.cas.plan];
        h += '<h2>Plan ' + esc(pl.n) + '</h2><p class="es-et">' + pl.duree_s + ' s · ' + esc(pl.cadre) + (ax.plan[pl.n] ? ' · à ' + mmss(ax.plan[pl.n].t0) : '') + '</p><p>' + esc(pl.action) + '</p>' +
          (pl.son_ecran ? '<p class="es-ecran">' + esc(pl.son_ecran) + '</p>' : '') + (pl.note ? '<p class="es-note">' + esc(pl.note) + '</p>' : '');
      } else {
        var m = I.module[e.cas.module];
        h += '<h2>' + esc(m.id + ' · ' + m.titre) + '</h2><p class="es-et">Module du 55 · ' + mmss(m.duree_s) + '</p><p>' + esc(m.contenu) + '</p><p class="es-note">Enjeu : ' + esc(m.enjeu) + '</p>';
      }
      var ici = d.savoir.faits.filter(function (f) {
        return Object.keys(f.portees).some(function (k) { return f.portees[k].some(function (it) { return (it.plan || it.module) === nom; }); });
      });
      h += '<h3>Ce qui s\'apprend ici</h3>' + (ici.length ? '<div class="es-garde">' + ici.map(function (f) { return E.bouton('sel', f.titre, { id: f.id, f: 'cas-' + f.id }); }).join('') + '</div>' : '<p>Rien de relevé.</p>');
      return h;
    }
    var compte = {};
    d.savoir.faits.forEach(function (f) { ecarts(ax, f, gs).forEach(function (x) { var n = nomEcart(x); compte[n] = (compte[n] || 0) + 1; }); });
    h += '<h2>Ce que montre cet essai</h2><p>' + d.savoir.faits.length + ' faits, quatre portées. Dans le film de ' + e.version + ' min : ' +
      Object.keys(compte).map(function (k) { return compte[k] + ' × ' + k; }).join(', ') + '.</p>' +
      '<ul class="es-liste es-legende">' +
      '<li><span class="es-mot es-ec-ironie">ironie</span> le spectateur sait, le personnage non</li>' +
      '<li><span class="es-mot es-ec-suspense">suspense</span> pareil, quand le fait est une menace (classement de moi)</li>' +
      '<li><span class="es-mot es-ec-surprise">surprise</span> un personnage savait avant le spectateur</li>' +
      '<li><span class="es-mot es-ec-secret">secret</span> Rob1 sait et le tait à Seed : le récit l\'écrit</li>' +
      '<li><span class="es-mot es-ec-manque">non écrit</span> aucun document ne le dit</li>' +
      '</ul><h3>Sur une portée</h3><ul class="es-liste es-legende">' +
      '<li><i class="es-pt es-mode-apprend"></i> sait ou apprend</li>' +
      '<li><i class="es-pt es-mode-pressent"></i> pressent, sans les détails</li>' +
      '<li><i class="es-pt es-mode-tort"></i> croit à tort</li>' +
      '</ul><h3>Provenance</h3><ul class="es-liste es-legende">' +
      '<li><span class="es-src es-src-docx">récit</span> écrit dans le récit de référence (Récit v2)</li>' +
      '<li><span class="es-src es-src-hors">hors récit</span> écrit dans un autre document du script</li>' +
      '<li><span class="es-src es-src-inf">inféré</span> déduit, avec les plans qui le fondent</li>' +
      '<li><span class="es-src es-src-man">non écrit</span> manquant</li></ul>';
    return h;
  }

  function vue(d, e) {
    var ax = E.axe(d.film, e.version, e.m9), fen = E.fenetre(ax, e.zoom);
    return {
      phrase: esc(phrase(d, e, ax)),
      outils: E.outilsAxe(d, e, ax, fen, {}),
      figure: figure(d, e, ax, fen),
      liste: listeFaits(d, e, ax),
      cote: cote(d, e, ax),
      choix: E.choix(e, function (g) { return decrire(d, g); }),
    };
  }

  function texte(d, e) {
    var l = ['Second Earth · essai « La Partition du savoir » · mes choix'];
    e.gardes.forEach(function (g, i) { l.push((i + 1) + '. ' + decrire(d, g)); });
    return l.join('\n');
  }

  E.essais.savoir = { init: init, reduire: reduire, vue: vue, texte: texte, portee: portee, ecarts: ecarts, prevoir: prevoir };
  if (typeof module === 'object' && module.exports) module.exports = E.essais.savoir;
})();
