# Écrit les décisions du round 18 (27/11/2026) dans docs/film/00-recit-v2.md, et sort la liste des passages pour la page de relecture.
import json
from pathlib import Path
P = Path(r"C:\SECOND EARTH\repo\docs\film\00-recit-v2.md")
t = P.read_text(encoding="utf-8")
M = " **[ajout du 27/11]**"
E = []  # (acte, décision, titre, avant, après)

def rep(acte, dec, titre, old, new, montre=None):
    global t
    assert t.count(old) == 1, (titre, t.count(old))
    t = t.replace(old, new)
    E.append({"acte": acte, "dec": dec, "titre": titre, "avant": old if len(old) < 700 else old[:700] + "…", "apres": montre or new})

rep("En tête", "Round 18", "La liste des changements",
    "10. Trois crochets payés",
    "12. **Les décisions de Cal du 27/11/2026** (Registre, round 18 : ce qui change chez Seed et chez Rob1, l'alarme, la cuve ouverte par Rob1, la musique du vent, la danse, la horde dans les Hautes Plaines, MOTHER) sont écrites dans le texte : marquées **[ajout du 27/11]**.\n10. Trois crochets payés")

rep("Prologue", "W08", "MOTHER, la station de départ",
    "Dans le chantier spatial qui flotte au-dessus de l'atmosphère, des bras robotisés accrochent la capsule.",
    "Dans le chantier spatial qui flotte au-dessus de l'atmosphère, la station MOTHER," + M + " des bras robotisés accrochent la capsule.")

rep("Acte I", "W06", "Rob1 : les yeux bleus",
    "À peine un mètre de haut, silhouette compacte, blocs arrondis gris foncé.",
    "À peine un mètre de haut, silhouette compacte, blocs arrondis gris foncé. Sur sa visière sombre, deux yeux bleus, lumineux, qui changent de forme avec ce qu'il pense." + M)

rep("Acte I", "P04", "Le séisme : Rob1 choisit d'arrêter et d'ouvrir la cuve",
    "Tout cela provoque une erreur dans le processus de croissance.\n\nL'incubation s'arrête.",
    "La machine s'affole : le fluide tangue dans la cuve, les courbes de croissance se brisent, les alertes se contredisent. Aucune règle ne prévoit ce cas. Rob1 calcule. CONTINUER : RISQUE INCONNU. ARRÊTER : SUJET INCOMPLET. Il n'a pas d'ordre. Il choisit : il arrête l'incubation." + M + "\n\nL'incubation s'arrête.")

rep("Acte I", "P03, W07", "Le réveil : l'alarme lui fait mal, Rob1 la coupe",
    "Rob1 ne parle jamais : il écrit sur son écran-visage et fait des gestes ; Seed lit, et répond par gestes. **[ajout du 20/11]**",
    "Rob1 ne parle jamais : il écrit sur sa visière et fait des gestes ; Seed lit, et répond par gestes. **[ajout du 20/11]**\n\n"
    "Rob1 ouvre la cuve. Le fluide s'écoule. Elle a les cheveux blancs, très courts : elle a grandi trop vite pour qu'ils poussent. L'alarme de fin d'incubation se déclenche, une simple sonnerie. Pour elle, c'est une douleur. Aucun de ses sens n'a encore servi : la lumière, le froid, l'air sur sa peau, le bruit, tout arrive trop fort et dans le désordre. Elle se recroqueville, les mains sur les oreilles. Rob1 coupe l'alarme. Sur sa visière, une ligne : PROTOCOLE : ALARME DE SORTIE, 60 SECONDES. Il la barre. C'est la première chose qu'elle apprend de lui : il la protège du bruit." + M)

rep("Acte I", "P12, P01", "Les 23 % : des images et des sons, sans savoir",
    "Elle a ses gènes, des fragments de ses souvenirs, des flashs incompréhensibles.",
    "Elle a ses gènes, des fragments de ses souvenirs, des flashs incompréhensibles : des images et des sons, sans le savoir qui va avec. Une forêt, une musique, un geste. Elle sait à quoi ressemble la pluie ; elle n'a jamais été mouillée." + M)

rep("Acte I", "P01", "La sortie : elle sent pour la première fois",
    "et sur les arbustes, des fleurs par milliers. Elle explore avec Rob1.",
    "et sur les arbustes, des fleurs par milliers. Ce qu'elle connaissait en image, elle le sent pour la première fois : l'odeur de la terre, la mousse sous ses pieds, la chaleur de l'étoile sur son visage. Elle reste longtemps immobile." + M + " Elle explore avec Rob1.")

rep("Acte I", "P10", "Ce que « VIABLE » amènerait",
    "Phase 1, complète. Phase 2, en cours. Sujet : Elena Vasquez, clone partiel, transfert incomplet.",
    "Phase 1, complète. Phase 2, en cours. Phase 3, si la planète est viable : colonie, terraformation." + M + " Sujet : Elena Vasquez, clone partiel, transfert incomplet.")

rep("Acte II", "P05", "Rob1 refuse d'être porté, boude, puis accepte",
    "La première fois qu'elle le prend sur son dos, son écran affiche : PROTOCOLE : LE SUJET NE PORTE PAS DE CHARGE. Il regarde la ligne. Il l'efface. **[ajout du 20/11]**",
    "Il refuse d'abord. Il marche seul, tombe, se relève, tombe encore. Quand elle tend les bras, il se détourne et croise les siens : il boude. Elle attend. Il finit par grimper sur son dos." + M + " Son écran affiche : PROTOCOLE : LE SUJET NE PORTE PAS DE CHARGE. Il regarde la ligne. Il l'efface. **[ajout du 20/11]**")

rep("Acte II", "P06", "La musique du vent dans les fleurs",
    "Seed boit au fleuve, à genoux ;",
    "Au pied d'une tour, le vent passe dans un massif de fleurs, et les fleurs sonnent : une musique. Seed se fige. Elle fredonne, sans voix, comme si elle connaissait l'air. Rob1 cherche la source dans ses données. Rien." + M + " Seed boit au fleuve, à genoux ;")

rep("Acte II", "P09", "Rob2 : ce que Rob1 serait sans elle",
    "Il épuise ses batteries depuis des jours.",
    "Il épuise ses batteries depuis des jours. Rob1 le regarde tourner un long moment : un robot qui suit sa règle jusqu'à l'épuisement. Ce qu'il serait sans elle." + M)

rep("Acte III", "P06", "La caverne reprend la musique",
    "font une musique envoûtante, comme des fées.",
    "font une musique envoûtante, comme des fées. Seed la reconnaît : celle des fleurs, en plus grave." + M)

rep("Acte V", "P11", "« Cobaye » s'efface",
    "Et pour la première fois, le journal écrit son nom à la place de « sujet ».",
    "Et pour la première fois, le journal écrit son nom à la place de « sujet ». À l'écran, l'ancienne ligne RÔLE : COBAYE s'efface." + M)

rep("Acte VI", "S07", "Le trajet jusqu'aux Hautes Plaines",
    "## Acte VI : la horde\n\n",
    "## Acte VI : la horde\n\n"
    "Au matin, Seed découvre Rob3 debout. Ils repartent le jour même, sans s'assembler : s'assembler, c'est laisser le chargeur solaire, et ils en ont besoin. Rob3 roule devant et tire son robopod ; Rob1/2 court à côté. La famille de rongeurs est restée dedans. La forêt s'éclaircit, puis s'arrête : les Hautes Plaines, de l'herbe jusqu'à l'horizon, et des feux très loin dans la nuit. Carton : Jour 23 · 1 700 km. Ils campent au milieu de l'herbe." + M + "\n\n")

rep("Acte VI", "P08", "Elle comprend l'alarme des rongeurs",
    "comme pour la sortir du sommeil.)",
    "comme pour la sortir du sommeil. Leur sifflement d'alarme, aigu, répété : elle le comprend tout de suite. Le bruit qui lui faisait mal au premier jour est devenu un son qu'elle sait lire." + M + ")")

rep("Acte VI", "S07", "Rob3 n'est plus « réveillé dans la nuit »",
    "Rob2 s'assemble à Rob3, réveillé dans la nuit.",
    "Rob2 s'assemble à Rob3.")

rep("Acte VII", "P08", "Elle suit l'animal, et se trompe",
    "L'animal le mange tranquillement, sans danger apparent.",
    "L'animal le mange tranquillement, sans danger apparent. Elle lui fait confiance, comme aux autres. Cette fois elle se trompe : ce qui le nourrit n'est pas fait pour elle." + M)

rep("Acte VII", "P13", "Rob1 doit lâcher Seed",
    "Rob1 recule sur la plage. Les heures passent.",
    "Rob1 recule sur la plage. Il n'a plus de solution à lui. Il l'a confiée à un autre, et il attend. Dans son journal, cette nuit-là, une ligne commence pour la première fois par « je » : J'ATTENDS." + M + " Les heures passent.")

rep("Acte VIII", "P07", "La danse de Rob1",
    "Sur son écran-visage, il affiche le cri tel qu'il l'entend : KORÊ ? Puis quelque chose qui ressemble à un rire, une animation qu'on ne lui a jamais vue.",
    "Sur sa visière, il affiche le cri tel qu'il l'entend : KORÊ ? Puis quelque chose qui ressemble à un rire, une animation qu'on ne lui a jamais vue. Puis il bouge. Un pas, un autre, au rythme du cri : il danse, quelques secondes. Seed rit, sans son." + M)

for old, new in (("Sur son écran-visage, une animation : quelque chose qui ressemble à de la détermination", "Sur sa visière, une animation : quelque chose qui ressemble à de la détermination"),
                 ("Sur son écran-visage, des lignes de code défilent", "Sur sa visière, des lignes de code défilent")):
    assert t.count(old) == 1; t = t.replace(old, new)
assert "écran-visage" not in t
P.write_text(t, encoding="utf-8")
json.dump(E, open(r"C:\SECOND EARTH\_travail_inventaire\chantiers\recit_r18.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(E), "passages ;", t.count("[ajout du 27/11]"), "marques")
