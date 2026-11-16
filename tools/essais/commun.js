/* Second Earth · essais de lecture du film : socle commun aux trois essais.
   L'axe du temps (film de 25 min, ou de 55 min avec ses modules), les cases, la provenance,
   la pile « en attente » avec Garder / Revenir, et le montage dans la page.
   Chaque essai fournit : init(d, gardes), reduire(d, etat, action), vue(d, etat), texte(d, etat).
   vue() rend du HTML par zone ; rien ne s'écrit ailleurs que dans le navigateur (stockage local).
   Aucune dépendance. Chargé par la page (window.SE_ESSAIS) et par les tests (require). */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function mmss(s) {
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  var memo = new WeakMap();
  function index(film) {
    var i = memo.get(film);
    if (!i) {
      i = { plan: {}, module: {}, acte: {} };
      film.plans.forEach(function (p) { i.plan[p.n] = p; });
      film.modules.forEach(function (m) { i.module[m.id] = m; });
      film.actes.forEach(function (a) { i.acte[a.id] = a; });
      memo.set(film, i);
    }
    return i;
  }

  function parId(liste, id) {
    for (var k = 0; k < liste.length; k++) if (liste[k].id === id) return liste[k];
    return null;
  }

  // L'axe du temps. version « 25 » : les 150 plans. version « 55 » : chaque module est posé juste après
  // le plan de sa charnière (convention de l'essai : les documents disent « le 55 ouvre ici ») ;
  // M9 va après M4, ou en prégénérique (les deux places que les documents laissent ouvertes).
  function axe(film, version, m9) {
    var I = index(film), apres = {}, segs = [], plan = {}, mod = {}, t = 0;
    function pose(id, acte) {
      var s = { type: 'module', id: id, acte: acte, t0: t, t1: t + I.module[id].duree_s };
      segs.push(s); mod[id] = s; t = s.t1;
    }
    if (version === '55') {
      film.charnieres.forEach(function (c) {
        if (c.module && c.module !== 'M9') (apres[c.plan] = apres[c.plan] || []).push(c.module);
      });
      if (m9 === 'pregenerique') pose('M9', film.actes[0].id);
      else {
        var e4 = parId(film.charnieres, 'E4');
        (apres[e4.plan] = apres[e4.plan] || []).push('M9');
      }
    }
    film.plans.forEach(function (p) {
      var s = { type: 'plan', n: p.n, acte: p.acte, t0: t, t1: t + p.duree_s };
      segs.push(s); plan[p.n] = s; t = s.t1;
      (apres[p.n] || []).forEach(function (id) { pose(id, p.acte); });
    });
    var actes = film.actes.map(function (a) {
      var miens = segs.filter(function (s) { return s.acte === a.id; });
      return { id: a.id, nom: a.nom, titre: a.titre, t0: miens[0].t0, t1: miens[miens.length - 1].t1 };
    });
    return { version: version, m9: m9, total: t, segs: segs, plan: plan, module: mod, actes: actes };
  }

  function fenetre(ax, zoom) {
    var a = zoom ? parId(ax.actes, zoom) : null;
    return a ? { t0: a.t0, t1: a.t1, acte: a.id } : { t0: 0, t1: ax.total, acte: null };
  }

  // Début d'un point ({plan} ou {module}) sur l'axe ; null si le point n'existe pas dans cette version.
  function tPoint(ax, pt) {
    var s = pt.plan ? ax.plan[pt.plan] : ax.module[pt.module];
    return s ? s.t0 : null;
  }

  function nomPoint(pt) { return pt.plan || pt.module; }

  function xDe(fen, t) { return (t - fen.t0) / (fen.t1 - fen.t0) * 100; }

  function nomActe(a) { return a.nom === 'Prologue' ? 'le Prologue' : "l'Acte " + a.nom; }

  // Position d'un temps dans la fenêtre : x en %, et de quel côté il déborde (-1, 0, 1).
  function place(fen, t) {
    var x = xDe(fen, t);
    return x < 0 ? { x: 0, hors: -1 } : x > 100 ? { x: 100, hors: 1 } : { x: x, hors: 0 };
  }

  // Les cases d'une piste : les actes (un clic en ouvre un), ou les plans de l'acte ouvert.
  function cases(d, ax, fen, o) {
    o = o || {};
    var I = index(d.film), h = '', cle = o.portee || 'b';
    var extra = o.portee ? ' data-portee="' + o.portee + '"' : '';
    function style(s) {
      return 'left:' + xDe(fen, s.t0).toFixed(3) + '%;width:' + ((s.t1 - s.t0) / (fen.t1 - fen.t0) * 100).toFixed(3) + '%';
    }
    function unModule(s) {
      var m = I.module[s.id];
      return '<button type="button" class="es-case es-module" style="' + style(s) + '" data-act="case" data-module="' + s.id + '"' + extra +
        ' data-f="c-' + cle + '-' + s.id + '" title="' + esc(s.id + ' · ' + m.titre + ' · ' + mmss(m.duree_s)) + '">' + (o.etiquette ? s.id : '') + '</button>';
    }
    if (!fen.acte) {
      ax.actes.forEach(function (a) {
        h += '<button type="button" class="es-case es-acte" style="' + style(a) + '" data-act="zoom" data-id="' + a.id + '" data-f="z-' + cle + '-' + a.id +
          '" title="' + esc('Ouvrir ' + nomActe(a) + ' · ' + (a.titre || '')) + '">' + (o.etiquette ? esc(a.nom === 'Prologue' ? 'Prol.' : a.nom) : '') + '</button>';
      });
      ax.segs.forEach(function (s) { if (s.type === 'module') h += unModule(s); });
      return h;
    }
    ax.segs.forEach(function (s) {
      if (s.t0 < fen.t0 || s.t1 > fen.t1) return;
      if (s.type === 'module') { h += unModule(s); return; }
      var p = I.plan[s.n];
      h += '<button type="button" class="es-case es-plan' + (p.mot ? ' es-plan-mot' : '') + '" style="' + style(s) + '" data-act="case" data-plan="' + s.n + '"' + extra +
        ' data-f="c-' + cle + '-' + s.n + '" title="' + esc(s.n + ' · ' + p.duree_s + ' s · ' + p.action) + '">' + (o.etiquette ? esc(s.n.split('-')[1]) : '') + '</button>';
    });
    return h;
  }

  // La provenance d'un élément : docx, autre document du script, déduction, manquant, ou choix de Cal.
  function prov(d, p) {
    if (!p) return '';
    if (p.src === 'choix') return '<span class="es-src es-src-choix">ton choix</span>';
    if (p.src === 'infere') {
      return '<span class="es-src es-src-inf">inféré</span><span class="es-cit">' + esc(p.pourquoi) +
        ' <span class="es-fonde">Fondé sur ' + p.fonde.map(esc).join(', ') + '.</span></span>';
    }
    if (p.src === 'manquant') {
      return '<span class="es-src es-src-man">non écrit</span><span class="es-cit">' + esc(p.note) + (p.voir ? ' ' + prov(d, p.voir) : '') + '</span>';
    }
    var hors = p.src !== 'docx';
    return '<span class="es-src ' + (hors ? 'es-src-hors' : 'es-src-docx') + '">' + (hors ? 'hors docx · ' + esc(d.docs[p.src].nom) : 'docx') + '</span>' +
      '<span class="es-cit">« ' + esc(p.cit) + ' »' + (p.note ? ' ' + esc(p.note) : '') + '</span>';
  }

  function bouton(act, label, o) {
    o = o || {};
    var h = '<button type="button" class="es-bt' + (o.cls ? ' ' + o.cls : '') + '" data-act="' + act + '" data-f="' + esc(o.f || act + '-' + (o.id || o.v || '')) + '"';
    if (o.id != null) h += ' data-id="' + esc(o.id) + '"';
    if (o.v != null) h += ' data-v="' + esc(o.v) + '"';
    if (o.i != null) h += ' data-i="' + o.i + '"';
    if (o.champ) h += ' data-champ="' + o.champ + '"';
    if (o.presse != null) h += ' aria-pressed="' + (o.presse ? 'true' : 'false') + '"';
    if (o.inactif) h += ' disabled';
    return h + '>' + esc(label) + '</button>';
  }

  // Les réglages de l'axe : 25 ou 55, la place de M9, l'acte ouvert.
  function outilsAxe(d, e, ax, fen, o) {
    o = o || {};
    var h = '<div class="es-groupe"><span class="es-et">Film</span>' +
      bouton('version', '25 min', { v: '25', presse: e.version === '25' }) +
      bouton('version', '55 min', { v: '55', presse: e.version === '55' }) + '</div>';
    if (o.m9 && e.version === '55') {
      h += '<div class="es-groupe"><span class="es-et">Module M9, les Titans</span>' +
        bouton('m9', 'après le col (M4)', { v: 'apres-m4', presse: e.m9 !== 'pregenerique' }) +
        bouton('m9', 'en prégénérique', { v: 'pregenerique', presse: e.m9 === 'pregenerique' }) + '</div>';
    }
    h += '<div class="es-groupe"><span class="es-et">Vue</span>' + bouton('zoom', 'Tout le film', { id: '', presse: !fen.acte, f: 'zoom-tout' });
    if (fen.acte) {
      var k = ax.actes.findIndex(function (a) { return a.id === fen.acte; });
      if (k > 0) h += bouton('zoom', 'Acte précédent', { id: ax.actes[k - 1].id, f: 'zoom-prec' });
      h += '<span class="es-ici">' + esc(ax.actes[k].nom === 'Prologue' ? 'Prologue' : 'Acte ' + ax.actes[k].nom) + ' · ' + esc(ax.actes[k].titre || '') + '</span>';
      if (k < ax.actes.length - 1) h += bouton('zoom', 'Acte suivant', { id: ax.actes[k + 1].id, f: 'zoom-suiv' });
    } else h += '<span class="es-ici">Un clic sur un acte l\'ouvre plan par plan.</span>';
    return h + '</div>';
  }

  // La pile « en attente », Garder / Revenir, et les choix gardés (avec « Copier mes choix »).
  function choix(e, decrire) {
    var h = '<div class="es-garde">' +
      bouton('garder', 'Garder', { cls: 'es-go', inactif: !e.attente.length }) +
      bouton('revenir', 'Revenir', { inactif: !e.attente.length && !e.arme }) +
      '<span class="es-et">' + (e.attente.length ? e.attente.length + ' en attente' : 'Rien en attente') + '</span></div>';
    if (e.attente.length) {
      h += '<ul class="es-liste es-att">' + e.attente.map(function (g) { return '<li>' + esc(decrire(g)) + '</li>'; }).join('') + '</ul>';
    }
    h += '<div class="es-garde"><span class="es-et">Mes choix gardés · ' + e.gardes.length + '</span>' +
      bouton('copier', 'Copier mes choix', { inactif: !e.gardes.length }) + '</div>';
    if (e.gardes.length) {
      h += '<ul class="es-liste">' + e.gardes.map(function (g, i) {
        return '<li><span>' + esc(decrire(g)) + '</span>' + bouton('retirer', 'Retirer', { i: i, f: 'retirer-' + i }) + '</li>';
      }).join('') + '</ul>';
    }
    return h + '<p class="es-note">Tes choix restent dans ce navigateur. Ils ne changent ni le script ni les documents : « Copier mes choix » en fait un texte à coller dans le chat.</p>';
  }

  // Réductions communes à tous les essais ; renvoie null si l'action n'est pas de celles-là.
  function reduireCommun(e, a) {
    switch (a.type) {
      case 'version': return Object.assign({}, e, { version: a.v === '55' ? '55' : '25' });
      case 'm9': return Object.assign({}, e, { m9: a.v === 'pregenerique' ? 'pregenerique' : 'apres-m4' });
      case 'zoom': return Object.assign({}, e, { zoom: a.id || null });
      case 'garder': return e.attente.length ? Object.assign({}, e, { gardes: e.gardes.concat(e.attente), attente: [], arme: false }) : e;
      case 'revenir': return Object.assign({}, e, { attente: [], arme: false });
      case 'retirer': return Object.assign({}, e, { gardes: e.gardes.filter(function (_, i) { return i !== Number(a.i); }) });
      default: return null;
    }
  }

  function copier(texte) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texte).catch(function () { return copieDeSecours(texte); });
    }
    return copieDeSecours(texte);
  }
  function copieDeSecours(texte) {
    return new Promise(function (ok, non) {
      var ta = document.createElement('textarea');
      ta.value = texte; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) ok(); else non(); } catch (err) { non(err); }
      document.body.removeChild(ta);
    });
  }

  var essais = {};

  // Monte un essai dans la page : les zones [data-zone] reçoivent le HTML de vue() ;
  // tout élément [data-act] envoie une action ; Entrée garde, Échap revient.
  function monter(nom, racine, d) {
    var essai = essais[nom], cle = 'se.essais.' + nom + '.v1', gardes = [];
    try { gardes = JSON.parse(localStorage.getItem(cle) || '[]'); } catch (err) { gardes = []; }
    if (!Array.isArray(gardes)) gardes = [];
    var etat = essai.init(d, gardes), zones = {}, dernier = {};
    Array.prototype.forEach.call(racine.querySelectorAll('[data-zone]'), function (z) { zones[z.getAttribute('data-zone')] = z; });

    function rendre() {
      var v = essai.vue(d, etat), actif = document.activeElement;
      var f = actif && actif.getAttribute ? actif.getAttribute('data-f') : null;
      Object.keys(v).forEach(function (k) {
        if (zones[k] && dernier[k] !== v[k]) { zones[k].innerHTML = v[k]; dernier[k] = v[k]; }
      });
      if (f && (!document.activeElement || document.activeElement.getAttribute('data-f') !== f)) {
        var cible = racine.querySelector('[data-f="' + f.replace(/"/g, '') + '"]');
        if (cible && cible.focus) cible.focus();
      }
      if (essai.apres) essai.apres(racine, etat);
    }

    function agir(a) {
      var avant = etat;
      etat = essai.reduire(d, etat, a) || etat;
      if (etat.gardes !== avant.gardes) {
        try { localStorage.setItem(cle, JSON.stringify(etat.gardes)); } catch (err) { /* stockage indisponible */ }
      }
      rendre();
    }

    racine.addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-act]');
      if (!el || !racine.contains(el) || el.disabled || el.hasAttribute('data-range')) return;
      var a = { type: el.getAttribute('data-act') };
      ['id', 'v', 'i', 'plan', 'module', 'portee'].forEach(function (k) {
        var val = el.getAttribute('data-' + k);
        if (val != null) a[k] = val;
      });
      if (el.getAttribute('data-champ')) {
        var champ = racine.querySelector('[name="' + el.getAttribute('data-champ') + '"]');
        a.texte = champ ? champ.value : '';
      }
      if (a.type === 'copier') {
        var libelle = el.textContent;
        copier(essai.texte(d, etat)).then(function () { el.textContent = 'Copié'; }, function () { el.textContent = 'Échec de la copie'; });
        setTimeout(function () { el.textContent = libelle; }, 2000);
        return;
      }
      agir(a);
    });

    racine.addEventListener('input', function (ev) {
      var el = ev.target;
      if (el.hasAttribute && el.hasAttribute('data-range')) agir({ type: el.getAttribute('data-act'), v: el.value });
    });

    document.addEventListener('keydown', function (ev) {
      var el = ev.target, tag = el && el.tagName ? el.tagName.toLowerCase() : '';
      if (ev.key === 'Escape') { agir({ type: 'revenir' }); return; }
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((ev.key === 'Enter' || ev.key === ' ') && el.getAttribute && el.getAttribute('data-act') && tag !== 'button') {
        ev.preventDefault(); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return;
      }
      if (ev.key === 'Enter' && tag !== 'button' && tag !== 'a') agir({ type: 'garder' });
    });

    rendre();
    return { agir: agir, etat: function () { return etat; } };
  }

  var api = {
    esc: esc, mmss: mmss, index: index, parId: parId, axe: axe, fenetre: fenetre, tPoint: tPoint, nomPoint: nomPoint,
    xDe: xDe, place: place, nomActe: nomActe, cases: cases, prov: prov, bouton: bouton, outilsAxe: outilsAxe, choix: choix,
    reduireCommun: reduireCommun, essais: essais, monter: monter,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SE_ESSAIS = api;
})();
