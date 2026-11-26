/* KIT ÉTUDE · la page des HUD : les exemples (des relevés écrits pour la page). Les pièces sont dans hud.js. */
(function () {
  'use strict';
  var KE = window.KitEtude, H = KE.hud, el = KE.outils.el;
  function par(id) { return document.getElementById(id); }
  function fr(x, d) { return (x < 0 ? '−' : '') + Math.abs(x).toFixed(d || 0).replace('.', ','); }

  /* 05 · le radar et sa fiche */
  var radar = par('le-radar'), fiche = par('fiche-echo');
  function ficher(e, portee) {
    fiche.textContent = '';
    if (!e) { fiche.appendChild(el('p', { class: 'hud-fiche-nom', style: 'color:var(--pale)', text: 'Aucun écho tenu' })); fiche.appendChild(el('p', { class: 'hud-leg', text: 'portée ' + fr(portee, 0) + ' km · ' + radar._hud.echos.filter(function (x) { return x.d <= portee; }).length + ' échos dans le cercle' })); return; }
    fiche.appendChild(el('p', { class: 'hud-fiche-nom', text: e.nom }));
    fiche.appendChild(el('dl', { class: 'hud-fiche' }, [el('dt', { text: 'relèvement' }), el('dd', { class: 'or' }, [('00' + e.a).slice(-3), el('small', { text: 'degrés' })]), el('dt', { text: 'distance' }), el('dd', {}, [fr(e.d, 1), el('small', { text: 'km' })]),
      el('dt', { text: 'route' }), el('dd', {}, [('00' + e.cap).slice(-3), el('small', { text: 'degrés' })]), el('dt', { text: 'vitesse' }), el('dd', {}, [String(e.v), el('small', { text: 'nœuds' })]),
      el('dt', { text: 'au plus près' }), el('dd', { class: 'amb' }, [fr(e.d * .4, 1), el('small', { text: 'km, prédit dans ' + Math.round(e.d / e.v * 60) + ' min' })])]));
  }
  radar.addEventListener('ke:change', function (e) { ficher(e.detail.echo, e.detail.portee); [].forEach.call(par('portees').children, function (b) { b.setAttribute('aria-pressed', String(+b.dataset.p === e.detail.portee)); }); });
  par('portees').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) radar._hud.portee(+b.dataset.p); });
  ficher(radar._hud.tenu(), 20);

  /* 07 · la télémétrie, l'oscilloscope et ses deux réglages */
  H.tele(par('la-tele'), [{ nom: 'cap', v: 47.2, amp: 1.4, unite: '°', dec: 1 }, { nom: 'vitesse', v: 142.6, amp: 6, unite: 'nœuds', dec: 1 }, { nom: 'altitude', v: 2480, amp: 40, unite: 'm', dec: 0, etat: 'tenu' }, { nom: 'taux de montée', v: 3.42, amp: 1.2, unite: 'm/s', dec: 2 },
    { nom: 'température', v: -8.5, amp: 2.2, unite: '°C', dec: 1 }, { nom: 'pression', v: 752.31, amp: 3, unite: 'hPa', dec: 2 }, { nom: 'autonomie', v: 96.4, amp: 5, unite: 'min', dec: 1, etat: 'predit' }, { nom: 'liaison montante', v: 12.8, amp: 4, unite: 'dB', dec: 1, etat: 'perdu' }, { nom: 'tension', v: 11.874, amp: .06, unite: 'V', dec: 3 }]);
  par('osc-f').addEventListener('ke:change', function (e) { par('oscillo')._hud.regler(e.detail.valeur / 100); });
  par('osc-a').addEventListener('ke:change', function (e) { par('oscillo')._hud.regler(undefined, e.detail.valeur); });

  /* 08 · la chronologie */
  var dit = par('chrono-dit');
  par('la-chrono').addEventListener('ke:temps', function (e) { dit.textContent = ''; dit.appendChild(el('small', { text: KE.outils.temps(e.detail.t) })); dit.appendChild(document.createTextNode(e.detail.phase ? e.detail.phase.nom + ' en cours.' : '')); });
  H.chrono(par('la-chrono'), { duree: 840, maintenant: 372, cran: 30, phases: [{ nom: 'Préparation', de: 0 }, { nom: 'Montée', de: 120 }, { nom: 'Palier', de: 330 }, { nom: 'Relevés', de: 480 }, { nom: 'Retour', de: 690 }],
    jalons: [{ t: 64, nom: 'contrôles faits' }, { t: 250, nom: 'premier col' }, { t: 430, nom: 'ravitaillement' }, { t: 610, nom: 'dernier relevé', predit: 1 }, { t: 840, nom: 'posé', predit: 1, fin: 1 }] });

  /* 09 · la figure annotée et le menu radial */
  (function () {
    var NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'), i, d;
    s.setAttribute('class', 'hud'); s.setAttribute('viewBox', '0 0 980 560'); s.setAttribute('role', 'group'); s.setAttribute('aria-label', 'Un relief annoté');
    function p(d, c) { var e = document.createElementNS(NS, 'path'); e.setAttribute('d', d); e.setAttribute('class', c); s.appendChild(e); return e; }
    /* un relief en courbes de niveau : des ovales déformés, emboîtés */
    for (i = 0; i < 9; i++) { d = ''; for (var a = 0; a <= 360; a += 6) { var r = (230 - i * 24) * (1 + .13 * Math.sin((a * 3 + i * 25) * Math.PI / 180) + .07 * Math.cos((a * 5 - i * 40) * Math.PI / 180)), x = 470 + i * 9 + r * 1.25 * Math.cos(a * Math.PI / 180), y = 285 - i * 6 + r * .78 * Math.sin(a * Math.PI / 180); d += (a ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } p(d + 'Z', i % 3 === 0 ? 'hud-t' : 'hud-pale'); }
    p('M222 300C320 250 400 330 470 290S620 220 742 262', 'hud-amb');
    s.appendChild(H.cote(222, 470, 742, 470, '5,2 km'));
    s.appendChild(H.angle(222, 300, 70, 52, 90, '38°'));
    [{ x: 548, y: 238, dx: 96, dy: -128, titre: 'Le sommet', valeur: '2 612 m', sous: 'relevé 15 · tenu', etat: 'tenu', ancre: 'carre' },
      { x: 342, y: 270, dx: -84, dy: -150, titre: 'Le premier col', valeur: '2 104 m', sous: 'dit par le relevé 11' },
      { x: 742, y: 262, dx: 70, dy: 96, titre: 'L’arrivée', valeur: 'dans 12 min', sous: 'prédit', etat: 'predit' },
      { x: 300, y: 392, dx: -70, dy: 62, titre: 'Le relevé 9', valeur: 'pas de réponse', sous: 'signal perdu', etat: 'perdu', ancre: 'croix' },
      { x: 640, y: 372, dx: 96, dy: 74, titre: 'Le versant sud', valeur: '31°', sous: 'pente moyenne' }].forEach(function (o) { s.appendChild(H.appel(o)); });
    par('la-figure').appendChild(s);
  })();
  /* 10 · les états figés : une rangée par famille, une colonne par état */
  (function () {
    var g = par('les-etats'), ETATS = [['repos', ''], ['survol', 'est-survol'], ['focus', 'est-focus'], ['tenu', 'est-tenu'], ['avec le prévu', 'prevu'], ['en chargement', 'chargement'], ['signal perdu', 'perdu'], ['hors service', 'arret']];
    var FAM = [
      { nom: 'l’arc', hud: 'arc', d: { nom: 'Régime', unite: 'tours', valeur: '46', consigne: '60' }, prevu: { prevu: '58' } },
      { nom: 'les segments', hud: 'segments', d: { traits: '16', valeur: '62', unite: '%', consigne: '75' }, prevu: { prevu: '70' } },
      { nom: 'les crans', hud: 'crans', d: { nom: 'Gain', unite: 'décibels', min: '0', max: '20', valeur: '11.5', consigne: '14' }, prevu: { prevu: '13' } },
      { nom: 'la règle', hud: 'regle', cls: 'hud-regleh', d: { min: '-50', max: '50', valeur: '12', consigne: '0', unite: '‰' }, prevu: { prevu: '4' } },
      { nom: 'le ruban', hud: 'ruban', d: { nom: 'Vitesse', unite: 'nœuds', valeur: '142', consigne: '150', k: '3.4', pas: '5', gros: '25', min: '0' }, prevu: { prevu: '147' } },
      { nom: 'la rose', hud: 'boussole', d: { cap: '47', consigne: '110' }, prevu: { prevu: '72' } },
      { nom: 'l’anneau', hud: 'anneau', d: { valeur: '22', total: '60' }, prevu: { prevu: '41' } }];
    g.appendChild(el('div', { class: 'e-tete', text: 'famille' })); ETATS.forEach(function (e) { g.appendChild(el('div', { class: 'e-tete', text: e[0] })); });
    FAM.forEach(function (f) {
      g.appendChild(el('div', { class: 'e-nom', text: f.nom }));
      ETATS.forEach(function (e) {
        var n = document.createElement('div'), k; n.className = (f.cls || 'hud-' + f.hud) + (e[1].indexOf('est-') === 0 ? ' ' + e[1] : '') + (f.hud === 'anneau' ? ' petit' : ''); n.dataset.hud = f.hud;
        for (k in f.d) n.dataset[k] = f.d[k]; if (e[1] === 'prevu') for (k in f.prevu) n.dataset[k] = f.prevu[k];
        if (['chargement', 'perdu', 'arret'].indexOf(e[1]) >= 0) { n.dataset.etat = e[1]; delete n.dataset.consigne; }
        n.setAttribute('aria-label', f.nom + ', ' + e[0]); g.appendChild(el('div', { class: 'e-cel' }, [n]));
      });
    });
    H.monter(g);
  })();
  H.radial(par('le-radial'), { choisi: 1, items: [{ nom: 'viser' }, { nom: 'suivre' }, { nom: 'mesurer' }, { nom: 'marquer' }, { nom: 'relier', inerte: 'il faut deux relevés' }, { nom: 'effacer' }] });
})();
