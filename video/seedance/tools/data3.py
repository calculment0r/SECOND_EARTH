# Données des 10 séquences Seedance 2.5, version 3 : relation Rob1 / Seed, action, humour, deux paysages par séquence tirés des images de Cal.

GLOBAL_STYLE = (
    "Photoreal live-action feature-film cinematography. Captured on large-format 65mm photochemical film through 2x anamorphic optics, "
    "fine organic film grain, natural halation around highlights, a restrained filmic colour grade with rich but true-to-life colour. "
    "Textures stay real and unretouched: skin pores, scuffed metal, wet stone, dust. No beauty retouch, no digital smoothing, no CGI sheen, no stylization. "
    "Composed for an immersive wraparound screen: deep layered frames with a clear foreground, midground and horizon, subjects placed low in the frame, "
    "wide negative space, stable camera. One decisive camera move per shot, slow and weighty, screen direction kept consistent across cuts. "
    "Emotional tone: warm, playful and tender, with real stakes but nothing frightening. Keep this look identical in every shot."
)

NEGATIVES = (
    "No logos, no readable text, no captions, no subtitles, no watermark, no national flags, no morphing faces or hands, no extra limbs, "
    "no gore, no horror, nothing frightening, no cartoon or video-game look, no lens-flare gimmicks."
)

USE = " Use it only for place, colours, materials and light; ignore any person or text in it."

REFS = {
    "seed": dict(name="Seed", desc=(
        "Seed: a girl of fifteen apparent years, pale skin with freckles, pale blue-grey eyes, very short white-silver buzz-cut hair that reads ivory under the orange star, "
        "a white quilted-texture hooded thermal bodysuit with grey sleeve panels, thick yellow insulated over-trousers with round knee pods, white and yellow boots. "
        "She is almost mute: she acts with her face, hands and breath, laughs silently or in small breaths, and is curious, stubborn and warm. "
        "Keep her face, hair and outfit exactly as in the reference.")),
    "rob1": dict(name="Rob1", desc=(
        "Rob1: a small dark-navy humanoid robot the size of a small child, about one metre tall, the top of his helmet at Seed's waist, with a pale grey rounded helmet-head, a black visor, headphone-like side pods, a broad black chest plate with a small white bracket glyph, "
        "a rounded backpack, dark grey articulated arms, black fingered hands and short sturdy legs. He thinks like an adult, protective, dry-humoured and mischievous, and the girl is his mission. "
        "He never speaks and shows no text: his visor shows simple glowing cyan shapes instead of a face, two soft round eyes by default, changing into curved arcs for a smile, flat bars for deadpan or determination, "
        "wide round discs for surprise, spirals for dizziness, one bar and one arc for a wink, a wavy line for nerves, and a small amber dot for worry. "
        "Keep his design exactly as in the reference.")),
    "big": dict(name="Grand robot", desc=(
        "the big robot: a tall dark-grey bipedal robot with a large rounded smooth head-body, a single round camera lens at the front, a short antenna, "
        "two long arms ending in small articulated hands, thick reverse-jointed legs with broad flat feet and scuffed matte armour plates. It is strong and gentle, never speaks, and moves with heavy deliberate steps. "
        "Keep its design exactly as in the reference.")),
    "xeno": dict(name="XENOPOD-01", desc=(
        "XENOPOD-01: a squat conical landing capsule with a weathered cream hull, a dark band under its domed top, a round porthole, a side hatch, "
        "four angled landing legs with small ladders and a scorched bronze-brown ablative base. Keep its shape exactly as in the reference. "
        "Hull markings stay abstract and illegible: no flag, no logo, no readable lettering.")),
}

# Images de Cal (dossier Drive « seedance input »). idx = numéro d'ordre de ma planche ; title = nom de fichier dans le Drive.
ZM = "httpss.mj.runZMpgThrww8E_httpss.mj.runHd5RfvWnEkI_httpss.mj.r_"
IMG = {
    "i05": dict(idx="05", title="top.2.webp", short="Sentier d'argile rouge, arbres cramoisis",
        desc="a location: a trail across a red desert, tall twisted crimson trees with mushroom-shaped caps, a red clay path, pale spiny grey-green shrubs, a vivid blue sky." + USE),
    "i95": dict(idx="95", title="universal_upscale_0_264087a7-a5f6-495d-83b9-0563e6497112_0.jpg", short="Rivière dans un canyon, bosquets roses",
        desc="a location: a shallow river winding through a pale rocky gorge between steep banded cliffs, round pink and magenta puffball trees clustered along the banks and slopes, a pale milky sky." + USE),
    "i85": dict(idx="85", title="nic007_httpss.mj.run-t-eKAoG3yU_cinematic_still__an_alien_lan_bb1d9914-2ac1-438f-89ce-28b3ff480e51_0.png", short="Vallée verte, oeufs de pierre, falaises",
        desc="a location: a green valley floor under tall pale cliffs, short grass, giant rounded stone eggs and boulders, low mist drifting between the cliffs, a faint stream." + USE),
    "i48": dict(idx="48", title="nic007_httpss.mj.runN2sG_DB7rqk_Cinematic_epic_wide_shot_of_a_5028350c-5af1-4923-bba5-11625941950c_3.png", short="Caverne sombre, masses claires lumineuses",
        desc="a location: a dark cavern with a wet black floor, huge pale cloud-shaped organic masses hanging from the walls and ceiling with warm orange light glowing inside them, teal-green shadow." + USE),
    "i40": dict(idx="40", title=ZM + "86310cfe-0c42-4e3b-b6d8-1f3f4e4b6259_3.png", short="Forêt sombre, rais de lumière bleue, plantes violettes",
        desc="a location: a dark hall of tall black trunks with shafts of pale blue light falling from above and glowing violet-blue tendril plants rising from dark mossy ground." + USE),
    "i55": dict(idx="55", title="nic007_giant_red_raw_crystal_forming_towering_spires_--ar_238_c54feb6d-b327-488b-aafd-00913a88989d_3_bloom_subtle_4x.png", short="Vallée, lichen turquoise, aiguilles rouges",
        desc="a location: a wide valley with dry grass in the foreground, slopes covered in turquoise-blue lichen, tall pointed spires of rust-red rock, a pale blue sky with white clouds." + USE),
    "i45": dict(idx="45", title=ZM + "320898b4-ff26-446a-88a2-d94773365d29_3.png", short="Lac sombre sous la brume, petits champignons lumineux",
        desc="a location: a calm dark lake under heavy mist, a dark forest on the far shore, tiny glowing mushroom plants at the water's edge, teal-grey shadows." + USE),
    "i60": dict(idx="60", title="httpss.mj.runZEetlWqRbeY_cinematic_wild_establishing_shot_In__ff6bd81c-bfae-47cb-8f3c-bbc982de214a_0.png", short="Herbe bleue, arbres-champignons bleus, falaises pourpres",
        desc="a location: a hillside of electric-blue grass below purple-red cliffs, giant dark-blue mushroom-shaped trees with wide flat caps, a turquoise sky." + USE),
    "i58": dict(idx="58", title="nic007_cinematic_wild_establishing_shot_In_the_style_of_a_Zac_e9f641e1-6c06-4641-b69c-2afe85585ab4_3.png", short="Herbe bleue, arbres-champignons, parois pourpres",
        desc="a location: a hillside of blue grass with giant mushroom-shaped trees with dark flat caps, purple-rose rock walls, a turquoise sky." + USE),
    "i14": dict(idx="14", title="hf_20260904_145835_e368be14-293f-4daa-ac5b-be8e10260e33.png", short="Plaine d'herbe dorée, mesa, tours-champignons",
        desc="a location: a vast golden grass plain under a pale pink-lilac sky, a flat-topped blue-grey mesa and giant grey mushroom-shaped towers with flat caps on the horizon, scattered flat-crowned trees." + USE),
    "i12": dict(idx="12", title="hf_20260904_150455_6c93bd70-8a9f-48d0-93d2-5072ca7a4fd3.png", short="Plaine dorée, grande tour-champignon grise",
        desc="a location: a vast golden grass plain, a giant grey mushroom-shaped tower with a flat cap and a fibrous stem rising from a green plateau, a few flat-crowned trees, a pale pink-lilac sky." + USE),
    "i09": dict(idx="09", title="alien_planet__red_forest_giant_yellow_canyon__cinematic_still__705f7482-54ed-4073-b2f2-8a6206e03bb2_1.png", short="Forêt sombre, rais de lumière, feuillage rouge",
        desc="a location: a dark forest in volumetric mist, tall black trunks, shafts of white light, dark red foliage and a small glowing red pool at the base." + USE),
    "i42": dict(idx="42", title=ZM + "ce2db28f-7881-4780-8af7-3b0443dacd56_1.png", short="Canyon orange en vagues, formes de champignons",
        desc="a location: an orange canyon of swirling banded sandstone in waves, pale cream rock caps, clusters of rounded mushroom-shaped rock formations, small green shrubs, a clear pale blue sky." + USE),
    "i97": dict(idx="97", title="A_cinematic_still_of_an_alien_planet_with_bleu_dark_sand_dese_45f50908-aa1a-43ef-a3ed-cd145779fd82_0.png", short="Baie dorée, colonnes de nuée lumineuse",
        desc="a location: a calm golden bay seen from a dark green ridge, a sulphur-gold sky with the sun behind haze, and tall slender columns of glowing dust cloud rising from the water in the distance." + USE),
    "i46": dict(idx="46", title=ZM + "7f452f71-1d2f-4ddc-b076-7a386e1d0098_3.png", short="Cônes volcaniques, coulées orange en éventail",
        desc="a location: dark volcanic hills under mist with smoking conical craters and fan-shaped streams of glowing orange lava threads running down the slopes, a grey sky." + USE),
    "i28": dict(idx="28", title="beautiful_blue_vegetation_and_black_sand_landscape_and_unknow_3887353b-f2fe-4a39-aead-fe0213d1fdfe_0.png", short="Végétation bleu électrique, sable noir, mer",
        desc="a location: a black sand beach beside a cold grey-blue sea, dense cushions of electric-blue vegetation covering the dunes, a low cloudy sky." + USE),
    "i36": dict(idx="36", title="magnific-1yCa0XIHTRXPdBlWfKJr-nic007_aerial_wide_shot_of_an_unknown_planet_black_sand_desert__ea01d14f-5e0d-4adb-84c4-54255151f062.jpeg", short="Désert de sable noir et ocre, volcan",
        desc="a location: a wide black sand and ochre desert with a single dark volcano on the horizon under a pale blue sky, a ring of black ash on the ground. The round dark object in the middle of the image is not part of the landscape: leave it out." + USE),
    "i38": dict(idx="38", title="national_geopgraphic_reportage_sur_an_unknown_planet_made_of__633cbc75-050c-49fe-9152-143d8f941efe_0.png", short="Lacs vert acide, croûte de sel blanche",
        desc="a location: a plain of shallow acid-green and turquoise pools edged by white salt crust and yellow mineral rims, orange-brown ground, a pale blue sky." + USE),
    "i18": dict(idx="18", title="a_wide_shot_of_landscape_of_an_a_unknown_planet__100m_long_gi_b411883b-7135-4503-bdea-aa7461752002_1.png", short="Plaine rose et crème, champignons rouge-rose",
        desc="a location: a plain of pale pink and cream rock with clusters of red-rose umbrella-shaped mushroom plants and large white sculpted stones, a pale sky." + USE),
    "i43": dict(idx="43", title=ZM + "8a7cc909-cf54-404a-a6a0-2b980b2248e6_0.png", short="Arbre cramoisi, lune rouge, brume rouge",
        desc="a location: a calm red scene, a bare crimson tree, soft rounded red shapes and red grass, thick red mist, a large red moon low in a grey-teal sky." + USE),
    "i74": dict(idx="74", title="photrealistic_and_cinematic_photography_of_a_Fantastic_mythic_d7c0e52c-04ac-40ff-a7cf-d98b0506f96f_2.png", short="Bêtes laineuses blanches, grandes cornes (planche)",
        desc="the sleeping giants: huge shaggy white-furred beasts with very large curved black horns and a few blue and orange patches in the coat. Use only the animals' build, fur and horns. Ignore the small people, the layout and the text."),
    "i26": dict(idx="26", title="cinematic_full_body_shot_of_A_genetically_modified_hybrid_ani_ee571f41-4fde-476e-960c-fe13d89abe94_0.png", short="Taureau blanc-bleu en plaine enneigée",
        desc="the sleeping giants, second view: a pale blue-white bull with short wide horns, a heavy build and thick wool. Use only the animal's build, fur and horns."),
}
for k, v in IMG.items():
    REFS[k] = dict(name=v["short"], desc=v["desc"], img=True, idx=v["idx"], title=v["title"])

SEQ = []

# ---------------------------------------------------------------- 01
SEQ.append(dict(
    id="S01", titre="Rob1 refuse d'être porté", trajet="Jungle, puis fleuve entre les tours", plans="1-22 · 2-01 · 2-02",
    palette="Rouge argile → rose et magenta", grad=["#b02a86", "#e8d9b0"], duree=30,
    ecart="Ajout : le refus de Rob1 et la liane (le découpage montre seulement Seed qui le porte). Les images remplacent les fougères et les tours de calcaire par un sentier rouge et un canyon aux bosquets roses.",
    refs=["seed", "rob1", "i05", "i95"],
    scene="Thirty seconds, seven shots, hard cuts. Seed and Rob1 leave the red trail. Rob1, small as a child but proud, refuses to be carried and insists on walking alone on his short legs. "
          "He trips in a coiled red vine and sits stuck in the red clay. Seed lets him wait one beat, then unsticks him, and he finally gives in and rides on her back as they come out into a river gorge lined with pink trees.",
    animals="",
    location="LOCATION A, shots 1 to 5 (Reference image 3): a trail across a red desert at star-rise, tall twisted crimson trees with mushroom-shaped caps, a red clay path, pale spiny grey-green shrubs taller than a child. "
             "LOCATION B, shots 6 and 7 (Reference image 4): a shallow river winding through a pale rocky gorge between steep banded cliffs, round pink and magenta puffball trees along the banks and slopes. "
             "TRANSITION: they leave the red trees and step down onto the river bank.",
    first="Seed and Rob1 stand at the edge of the red trail, Rob1 slightly ahead of her. They travel from screen-left to screen-right in every shot.",
    shots=[
        (0, 4, "wide, low, slow push-in", "On the red clay trail, Seed opens her arms to pick Rob1 up. Rob1 turns his back on her, his visor showing two flat deadpan bars, and marches off alone into the grey-green shrubs on his short legs."),
        (4, 9, "medium tracking shot from behind", "Rob1 marches bravely through spiny shrubs taller than he is, swinging his arms in an exaggerated pace, a small and stubborn figure. Seed follows a few steps behind, a hand over her mouth to hide a smile."),
        (9, 14, "close-up at ground level", "A coiled red vine loops round Rob1's ankle. He trips and sits down hard in the red clay. His visor flashes two wide round discs, then two small spirals. He pulls at the vine with both hands and only winds it tighter."),
        (14, 18, "close-up on Seed", "Seed folds her arms and raises one eyebrow, lips pressed together. Rob1 looks up at her, his visor showing a pleading pair of wide round eyes. She lets him wait one full beat, then grins."),
        (18, 23, "medium shot, slight low angle", "Seed unhooks the vine, lifts Rob1 by the straps of his backpack like a kitten, his legs kicking, his visor two slanted annoyed bars. She swings him onto her back; his arms wrap around her neck and his visor softens into a small smile arc."),
        (23, 26.5, "tracking shot, following them out", "Seed carries Rob1 out from between the last crimson trunks onto a pebble bank. Rob1 rides on her back like a captain, pointing forward with one black hand."),
        (26.5, 30, "very wide ground-level shot, locked, deep focus", "A wide shallow river in a pale gorge, pink and magenta puffball trees on the banks and slopes. Seed wades in with Rob1 on her back, two tiny figures at the foot of the cliffs."),
    ],
    optics="Shots 1 and 2: 35 mm at 0.4 m camera height. Shot 3: 50 mm at ground level. Shot 4: 85 mm. Shot 5: 40 mm. Shot 6: 28 mm. Shot 7: 24 mm, deep focus.",
    physics="Shrubs whip back after Rob1 passes; the vine tightens and slides on his ankle; red clay clings to his legs; Seed's weight shifts as she takes his load; water parts around her ankles at the end.",
    lighting="Star-rise in warm orange 4,500 K light low in the sky, long soft shadows. The red trail glows deep crimson; on the river the light turns pale and milky, the sky a pale turquoise-grey, never a deep blue, the pink trees keep their magenta, and her hair reads ivory.",
    audio="Dry morning wind, shrubs brushing metal, Rob1's small determined servo whirr, a tiny frustrated chirp when he trips, Seed's stifled giggle and a huff of effort as she lifts him, splashing in shallow water. No dialogue.",
))

# ---------------------------------------------------------------- 02
SEQ.append(dict(
    id="S02", titre="La descente", trajet="Vallée de pierre, puis caverne", plans="2-05 · 2-07 · 2-08 · 3-01",
    palette="Vert tendre et brume → noir, orange et vert-de-gris", grad=["#7ba06a", "#2c5a52"], duree=30,
    ecart="Ajout : le vertige de Rob1 et la liane qui cède. Les images remplacent les tours de calcaire par une vallée aux oeufs de pierre, et la caverne aux tiges lumineuses par une caverne aux masses claires qui brillent.",
    refs=["seed", "rob1", "i85", "i48"],
    scene="Thirty seconds, seven shots, hard cuts. At the end of a green valley, a crevasse opened by the earthquake is the only way down. Seed lowers herself on a thick copper-coloured vine with Rob1 strapped to her chest. "
          "Rob1 is afraid of heights and switches his eyes off. A strand snaps, they drop and swing, and they land in a dark cavern lit from inside by glowing pale shapes.",
    animals="",
    location="LOCATION A, shots 1 to 5 (Reference image 3): a green valley floor under tall pale cliffs, short grass, giant rounded stone eggs, low mist, and at the foot of the cliff a black crevasse with thick vines hanging down its walls. "
             "LOCATION B, shots 6 and 7 (Reference image 4): a dark cavern with a wet black floor, huge pale cloud-shaped organic masses hanging from the walls and ceiling with warm orange light glowing inside them, teal-green shadow. "
             "TRANSITION: the descent continues through darkness and the cavern opens beneath them.",
    first="Seed stands at the lip of the crevasse at screen-left, Rob1 already strapped to her chest, the cliffs and stone eggs behind her. All motion goes downward.",
    shots=[
        (0, 4, "wide, static", "A green valley under tall pale cliffs, low mist between giant stone eggs. At the foot of the cliff a crevasse yawns, a black gash in the ground. Seed and Rob1 are two small figures at its lip."),
        (4, 8, "medium shot, slow push-in", "Seed knots vines into a loop harness and straps Rob1 against her chest, facing outward. Rob1's visor goes completely black, eyes shut. Then one cyan eye slowly reappears to peek at the drop, widens, and the visor goes black again."),
        (8, 13, "low wide shot from below", "Seed lowers herself into the crevasse hand over hand on a thick copper-coloured vine, her boots walking down the wet wall, Rob1 strapped to her chest, mist drifting past, the daylight above shrinking."),
        (13, 17, "close-up", "The vine creaks and one strand snaps with a twang. They drop a metre. Seed's hand slides and clamps shut. Her teeth are clenched; Rob1's visor shows two wide round discs, then two spirals."),
        (17, 21, "wide shot, locked", "Seed kicks off the wall and swings in a long pendulum arc across the crevasse, grabs another vine, and hooks it with her arm. Rob1's short legs kick in the air."),
        (21, 26, "wide reveal, slow crane down", "They drop through darkness and the cavern opens beneath them: huge pale cloud-shaped masses hang from the walls, glowing warm orange from within, over a wet black floor. Seed lands softly on a rock ledge."),
        (26, 30, "medium shot, slow push-in", "Seed bends over with her hands on her knees, shaking with silent laughter. Rob1, unstrapped, stands on the ledge, his visor a calm cyan ring and then a smug wink. She pats his helmet."),
    ],
    optics="Shot 1: 24 mm, deep focus. Shot 2: 50 mm. Shot 3: 24 mm looking up. Shot 4: 85 mm. Shot 5: 28 mm. Shot 6: 24 mm. Shot 7: 50 mm.",
    physics="The vine stretches and creaks under load; a strand snaps and recoils; pebbles and dust rain into the dark; mist swirls around the swing; the glow inside the pale masses pulses softly like breathing.",
    lighting="Morning light in warm orange 4,500 K and pale mist at the top, dimming quickly down the crevasse; the cavern is lit from inside by the warm orange glow of the pale masses, with teal-green shadows and a cool cast on skin and metal.",
    audio="Wind at the lip, creaking fibre, a sharp twang, a breath of effort from Seed, Rob1's small frightened servo chirp, echoing drips in the dark, a soft low hum from the glowing masses, Seed's silent laugh as breath. No dialogue.",
))

# ---------------------------------------------------------------- 03
SEQ.append(dict(
    id="S03", titre="Click, click, click", trajet="Caverne, puis montagne", plans="3-03 · 3-04 · 3-05 · 3-06 · 4-05",
    palette="Noir et bleu-violet → turquoise et rouille", grad=["#4a5fc8", "#2fb6c6"], duree=30,
    ecart="Le grand robot joue ici le rôle de Rob2. La montée de la paroi dehors est ajoutée. Les images remplacent le col enneigé par une vallée au lichen turquoise.",
    refs=["seed", "rob1", "big", "i40", "i55"],
    scene="Thirty seconds, seven shots, hard cuts. In a dark glowing hall the big robot turns in circles, stuck in a loop. Rob1 climbs onto its back and docks with three clicks; the big robot straightens, and Rob1 swells with pride while Seed watches, stunned, then delighted. "
          "Then, out in a wide valley of rust-red spires, the big robot climbs a rock face with Seed holding on, and a handhold crumbles.",
    animals="",
    location="LOCATION A, shots 1 to 5 (Reference image 4): a dark hall of tall black trunks and pillars with shafts of pale blue light falling from above and glowing violet-blue tendril plants rising from dark mossy ground. "
             "LOCATION B, shots 6 and 7 (Reference image 5): a wide valley with dry grass in the foreground, slopes covered in turquoise-blue lichen, tall pointed spires of rust-red rock, a pale blue sky with white clouds. "
             "TRANSITION: a hard cut from the dark glowing hall to the open valley in daylight.",
    first="Seed and Rob1 stand at screen-left at the edge of the glow; the big robot turns at screen-right. In the valley the climb goes upward to screen-right.",
    shots=[
        (0, 5, "wide, low, slow push-in", "In the dark hall the big robot turns slowly in circles among the glowing violet plants, one long arm dragging, its camera lens sweeping the pillars. Seed and Rob1 arrive at the edge of the glow."),
        (5, 9, "close-up", "Rob1's visor shows two curious wide eyes and he tilts his head. The big robot completes a circle and stops dead, facing him; its lens irises open; silence."),
        (9, 14, "medium shot", "Rob1 scurries up the big robot's leg and back like a child climbing a statue, slips once, catches himself, and reaches its shoulders. Seed watches with her hands on her hips, baffled."),
        (14, 18, "tight inserts, three quick close-ups", "Close on the docking point on its back: at 14.8 seconds a small connector locks with a click; at 15.8 seconds a panel clicks; at 16.8 seconds the big robot's lens flashes bright cyan with a third click."),
        (18, 22, "medium shot, slow push-in", "The combined machine rises to full height, Rob1 seated on its shoulders with his chest out, his visor a broad proud smile arc. Seed steps back with her mouth open, then breaks into a grin and claps silently."),
        (22, 26, "wide shot, locked", "In daylight the big robot climbs a rust-red rock face at the foot of the spires, Seed clinging to its back with both arms, Rob1 on its shoulder, the turquoise lichen slopes and a wide valley below."),
        (26, 30, "medium close shot, slow push-in", "A handhold crumbles under its foot and pebbles clatter down. Seed's legs dangle. The big robot's long arm snaps out and catches the ledge. They hang for one beat, Rob1's visor two flat bars, then it heaves up and Seed lets out a relieved laugh."),
    ],
    optics="Shot 1: 24 mm at 0.3 m camera height. Shot 2: 85 mm. Shot 3: 35 mm. Shot 4: 100 mm close focus. Shot 5: 40 mm. Shot 6: 24 mm. Shot 7: 50 mm.",
    physics="The big robot's heavy steps shake loose small stones; the docking clicks are crisp and tiny; pebbles and dust cascade from the crumbling hold; Seed's body swings against the robot's back.",
    lighting="In the hall, dark teal shadow with shafts of pale blue light and the violet glow of the plants, a cool cast on armour and skin. In the valley, clear daylight from a warm orange 4,500 K star, a pale milky sky, rust-red rock and turquoise lichen at full saturation; Rob1's cyan visor is the cool accent and Seed's hair reads ivory.",
    audio="Echoing servo whirr of a robot turning, a soft glassy hum of the plants, three crisp clicks, heavy deliberate footsteps, wind in the valley, scraping rock, a clatter of falling pebbles, Seed's startled gasp and relieved laugh. No dialogue.",
))

# ---------------------------------------------------------------- 04
SEQ.append(dict(
    id="S04", titre="La veille", trajet="Lac sous la brume, puis vallée bleue", plans="4-12 · 5-06 · 5-11 · 5-12",
    palette="Brume gris-bleu nocturne → herbe et arbres bleus", grad=["#7f9ac0", "#3d7bff"], duree=30,
    ecart="Ajouts : la perturbation magnétique (sans aurore, W03) et la nuée d'insectes-étincelles (FB-02). Les réserves critiques viennent du plan 5-11. Les images remplacent le pied du glacier et la forêt aux troncs crème par un lac sous la brume et une vallée d'herbe bleue.",
    refs=["seed", "rob1", "i45", "i60"],
    scene="Thirty seconds, six shots, hard cuts. Night on the shore of a misty lake. Seed sleeps curled in a hollow while Rob1 keeps watch. His visor shows amber warnings, the reserves are running low, and every time she stirs he wipes them and shows a calm smile. "
          "A magnetic disturbance passes and he stands over her like a shield. Before dawn they walk down into a valley of blue grass and giant blue mushroom-shaped trees, and a swarm of tiny flashing insects swirls around them.",
    animals="The swarm: thousands of tiny winged insects, 1 to 2 cm, pearly cream bodies, iridescent wings, abdomens that glow and pulse in blue, green, orange or pink.",
    location="LOCATION A, shots 1 to 4 (Reference image 3): a calm dark lake under heavy mist at night, a dark forest on the far shore, a stony hollow on the near shore with tiny glowing mushroom plants at the water's edge, teal-grey shadows. "
             "LOCATION B, shots 5 and 6 (Reference image 4): a hillside of electric-blue grass below purple-red cliffs, giant dark-blue mushroom-shaped trees with wide flat caps, a turquoise pre-dawn sky. "
             "TRANSITION: they walk down a slope and the grey mist gives way to the blue grass.",
    first="Seed lies curled at screen-left in the hollow under her hood, Rob1 stands on the rim at screen-right, facing out. Later they walk downhill toward screen-right.",
    shots=[
        (0, 5, "wide, static", "A misty lake at night, a dark forest on the far shore. Seed is a small curled shape under her hood in a stony hollow; Rob1 stands guard on the rim, tiny and silhouetted against the pale mist."),
        (5, 10, "close-up on Rob1's visor, slow push-in", "Columns of amber glyph bars cascade down his visor and a thin amber triangle pulses, shapes only, no text. His eyes narrow into flat bars. He slowly turns his head to look at Seed."),
        (10, 14, "medium shot", "Seed stirs and murmurs in her sleep. Rob1's visor instantly wipes clean to a calm smile arc. He tucks the edge of her hood back around her ear with one careful black hand. She settles. The moment she is still, his visor falls back to the amber warnings and he turns away from her."),
        (14, 19, "wide shot, locked", "A magnetic disturbance: small pebbles on the ground lift a few millimetres and tremble, a small dial on Rob1's forearm spins, static crackles across his visor, loose strands of Seed's hair lift, the mist ripples. Rob1 steps over her and plants himself as a shield, arms spread, visor a determined bar, until the pebbles drop and everything goes still."),
        (19, 24, "tracking shot from the front", "Before dawn Seed yawns and walks down a stony slope with Rob1 beside her, who offers her a small ration, his visor cheerful. Far below, a hillside of blue grass appears between the rocks."),
        (24, 30, "wide low-angle shot, slow dolly-in", "They enter the valley of electric-blue grass and giant dark-blue mushroom trees. A cloud of tiny insects flashing blue, green, orange and pink rises and swirls around them in slow spirals. Seed spins with her arms out, laughing; Rob1's eyes flash in the same colours in rhythm, then glance up at her with one flicker of an amber dot that vanishes."),
    ],
    optics="Shot 1: 35 mm. Shot 2: 85 mm. Shot 3: 50 mm. Shot 4: 28 mm. Shot 5: 40 mm. Shot 6: 24 mm at 0.5 m camera height.",
    physics="Pebbles lift and settle; the forearm dial spins; Seed's hair floats and falls; mist ripples; the insect swarm moves in slow living spirals.",
    lighting="Part A: cold grey-blue night light through heavy mist, a large low moon behind the cloud, no aurora; Rob1's visor is the main practical light, cyan or amber. Part B: pre-dawn, no direct sun; saturated electric-blue grass, a turquoise sky, the multicolour flashes of the insects and a soft blue fill on faces.",
    audio="Still lake air, a faint cold ringing, soft servo hum, a tiny electric crackle during the disturbance, Seed's sleepy murmur and yawn, soft footsteps on stones, then tiny insect pulses and Seed's laughter. No dialogue.",
))

# ---------------------------------------------------------------- 05
SEQ.append(dict(
    id="S05", titre="Les géants endormis", trajet="Vallée bleue, puis plaine dorée", plans="5-14 · 6-03 · 6-04",
    palette="Bleu → or, laine blanche", grad=["#3d7bff", "#d9a441"], duree=30,
    ecart="Ajout : le troupeau dort (dans le découpage il charge). Scène d'infiltration à deux, au crépuscule plutôt qu'en pleine nuit pour rester fidèle à la plaine dorée de l'image.",
    refs=["seed", "rob1", "i58", "i14", "i74", "i26"],
    scene="Thirty seconds, seven shots, hard cuts. Infiltration as if danger were near. Seed and Rob1 must cross a plain at dusk where a herd of giant white animals sleeps like scattered hills. Hand signals, tiptoes, a snore that blows her hair, a giant leg swinging down that Rob1 stops with his bare strength, a huge eye that half opens. "
          "They make it across and collapse in the grass laughing.",
    animals="The sleeping giants (Reference images 5 and 6): massive white grazing animals, 3 to 4 metres tall at the shoulder and about four tonnes, thick pure white wool, wide curved horns, heavy shoulders and a low head, enormous eyes (closed when asleep); dozens lie scattered across the plain.",
    location="LOCATION A, shot 1 (Reference image 3): the edge of a valley of blue grass under giant mushroom-shaped trees with dark flat caps, purple-rose rock walls. "
             "LOCATION B, shots 2 to 7 (Reference image 4): a vast golden grass plain at dusk under a pale pink-lilac sky, a flat-topped blue-grey mesa and giant grey mushroom-shaped towers on the horizon, scattered flat-crowned trees, a long thin line of orange fire far along the horizon. Dozens of sleeping white giants lie scattered like hills. "
             "TRANSITION: the two stop at the edge of the blue valley and look out over the plain.",
    first="Seed and Rob1 stand at the edge of the blue valley at screen-left, the sleeping herd spreads out toward screen-right. They cross the plain from left to right.",
    shots=[
        (0, 4, "wide, static", "At the edge of the blue-grass valley, Seed and Rob1 stop and look out over a golden plain dotted with huge white mounds, sleeping giants, under a thin orange line of distant fire. Rob1 raises one flat black hand: stop."),
        (4, 9, "medium shot", "Hand signals: Rob1 points two fingers at his visor and then at the herd; Seed copies him; she presses a finger to her lips; his visor shows one thin cyan bar for silence. They tiptoe forward with exaggerated high knees, comically careful."),
        (9, 14, "low wide shot, deep focus", "They thread between sleeping giants: thick white wool rising and falling, enormous column legs, curved horns resting on the grass, warm breath rolling out like fog. The two tiny figures weave through them."),
        (14, 18, "close-up", "A giant's ear flicks and a deep snore blows Seed's hair and rocks Rob1. His visor shows two spirals and three small drifting dots. Seed stuffs a fist in her mouth to hold back her laughter."),
        (18, 24, "medium-wide shot", "A giant rolls over in its sleep and a massive leg swings down beside them. Rob1 leaps in front of Seed, plants his feet and braces both arms against the descending hoof, and lowers it gently to the ground like a lever. Seed stares at him; his visor shows two serious bars."),
        (24, 27, "close-up at eye level", "One enormous eye half opens right in front of them. They freeze and hold their breath; Rob1's visor goes completely dark. The eye slowly closes again."),
        (27, 30, "wide shot", "They slip out past the last sleeper and collapse in the grass, Seed in a silent laughing fit, Rob1 giving a proud wink. Behind them the herd breathes slowly; the orange fire line glows on the horizon."),
    ],
    optics="Shot 1: 28 mm. Shot 2: 40 mm. Shot 3: 24 mm at 0.3 m camera height. Shot 4: 85 mm. Shot 5: 35 mm. Shot 6: 100 mm. Shot 7: 28 mm.",
    physics="Thick wool rises and falls with slow breathing; breath rolls out as warm fog; grass bends in the exhalations; the hoof presses a hollow in the soil as Rob1's heels dig in; a few dust motes float in the last light.",
    lighting="Dusk, just after sunset. The last warm light rakes the golden grass, a pale pink-lilac sky, the orange fire line on the horizon rim-lights the white wool, cold blue shadow in the folds; Rob1's cyan visor is the only close source. The pure white wool is the brightest thing in the frame.",
    audio="Slow huge breaths, deep sleeping rumbles, a long snore, soft footfalls in grass, a faint servo strain as Rob1 holds the hoof, Seed's muffled giggle, distant crackle of fire. No dialogue.",
))

# ---------------------------------------------------------------- 06
SEQ.append(dict(
    id="S06", titre="La secousse", trajet="Plaine dorée, puis forêt sombre", plans="6-01 · 6-02 · 7-01",
    palette="Or et rose-lilas → noir, brume et feuillage rouge", grad=["#c8a24a", "#a83a2a"], duree=30,
    ecart="Séisme ajouté à la place de la charge de la horde. Le mot « Rob » reste le premier mot de Seed. Elle est seule au début. Les images remplacent la vallée aux arbres-cathédrales par une forêt sombre aux rais de lumière.",
    refs=["seed", "rob1", "i12", "i09"],
    scene="Thirty seconds, seven shots, hard cuts. At dawn on the plain Seed sits alone, trying to whistle. An earthquake splits the ground between her and Rob1, who is returning from scouting. A rock slab tips toward her; Rob1 catches it and holds it up with one burst of hidden strength, then shakes his sore hands. "
          "Seed grabs him and runs, and they slide down a slope into a dark misty forest, landing in soft moss, laughing.",
    animals="",
    location="LOCATION A, shots 1 to 6 (Reference image 3): a vast golden grass plain at dawn, a giant grey mushroom-shaped tower with a flat cap and a fibrous stem rising from a green plateau, a few flat-crowned trees, a pale pink-lilac sky, a rocky outcrop in the foreground. "
             "LOCATION B, shot 7 (Reference image 4): a dark forest in volumetric mist, tall black trunks, shafts of white light, dark red foliage and a small glowing red pool at the base of the trees. "
             "TRANSITION: they slide off the plain's edge down a slope and tumble into the forest.",
    first="Seed sits alone in the grass at screen-left, Rob1 trots in from the far right. The crack opens between them. The slide goes downhill toward screen-right.",
    shots=[
        (0, 5, "wide, locked", "Dawn on the golden plain. Seed sits alone in the grass trying to whistle: only air and a little spit come out. She frowns, scrunches her face and tries again. Far behind her, a small figure trots back from scouting: Rob1."),
        (5, 9, "medium shot", "The grass starts to tremble in rings. Small flying animals burst out of it. Seed's smile falls. Rob1, running toward her, shows a wobbling line on his visor."),
        (9, 13, "wide shot", "The ground splits: a long crack races between them. At 10.5 seconds Seed cries out one word, hoarse and cracked: \"Rob!\" He leaps the crack in a single bound. A slab of rock from the outcrop tips toward her."),
        (13, 18, "medium shot, low angle", "Rob1 lands in front of her and catches the toppling slab with both hands above his head, his boots sinking into the soil, servos whining, his visor two fierce bars. The slab shudders. Seed scrambles out from under it."),
        (18, 21, "close-up", "He lets the slab fall aside, then shakes both hands as if they sting, his visor showing a wavy line and tiny sparks. Seed stares at him, then laughs."),
        (21, 26, "wide shot, tracking", "Seed scoops Rob1 under one arm like a parcel and sprints across the cracking plain toward the edge of a cliff. The ground tilts and they slide sideways down a steep grassy slope in a cloud of dust."),
        (26, 30, "wide shot, slow crane down", "They tumble onto soft moss in a dark forest of tall black trunks, shafts of white light cutting through the mist. Seed lies on her back laughing silently; Rob1 sits up with moss on his helmet, his visor a smug smile. A small pool glows red between the trees."),
    ],
    optics="Shot 1: 24 mm, deep focus. Shot 2: 35 mm. Shot 3: 24 mm. Shot 4: 35 mm at 0.3 m camera height. Shot 5: 85 mm. Shot 6: 28 mm. Shot 7: 24 mm.",
    physics="Grass trembles in concentric rings; the crack widens in jerks with soil falling in; the slab shudders and sheds dust under his hands; the slope kicks up dust and grass; moss cushions the landing with a puff of spores.",
    lighting="Dawn: warm orange 4,500 K light low and raking, long shadows, a pale pink-lilac sky, golden grass catching the light. In the forest the light is dim and diffused through mist, hard shafts of white light, dark red foliage, the red pool glowing softly.",
    audio="Dawn wind in the grass, Seed's airy failed whistle, a low deep rumble rising, tearing earth, Seed's hoarse \"Rob!\" at 10.5 seconds, servo strain, a crash of rock, Seed's laugh, sliding grass, a soft landing in moss, dripping water in the forest. No other dialogue.",
))

# ---------------------------------------------------------------- 07
SEQ.append(dict(
    id="S07", titre="L'aimant", trajet="Canyon orange, puis baie dorée", plans="7-18",
    palette="Orange rouille → or soufre", grad=["#c9843a", "#e8c24a"], duree=30,
    ecart="Tempête magnétique et nuées : hors Bible, ajoutées à ta demande, sans aurore (W03). Les images remplacent le canyon rayé et la forêt de verre par un canyon orange en vagues et une baie dorée aux colonnes de nuée.",
    refs=["seed", "rob1", "i42", "i97"],
    scene="Thirty seconds, seven shots, hard cuts. Seed and Rob1 climb through an orange canyon of swirling rock. A magnetic disturbance builds, loose metal flies to the cliff and Rob1 is dragged across the ground and sticks to the iron-rich wall like a magnet. "
          "Seed laughs and tries to pry him off. Then the canyon opens on a golden bay where tall columns of glowing cloud stand over the water, calm and far away.",
    animals="",
    location="LOCATION A, shots 1 to 5 (Reference image 3): an orange canyon of swirling banded sandstone in waves, pale cream rock caps, clusters of rounded mushroom-shaped rock formations, small green shrubs, a clear pale blue sky. "
             "LOCATION B, shots 6 and 7 (Reference image 4): a calm golden bay seen from a dark green ridge, a sulphur-gold sky with the sun behind haze, and tall slender columns of glowing dust cloud rising from the water in the distance. "
             "TRANSITION: the canyon walls open and they step out onto the ridge above the bay.",
    first="Seed leads at screen-left with Rob1 beside her; the iron-rich wall is at screen-right. They travel from left to right.",
    shots=[
        (0, 4, "wide shot, locked", "A canyon of orange rock folded in waves, small green shrubs in the cracks. Seed and Rob1 climb a path along its floor toward brighter light, Rob1 keeping up on his short legs."),
        (4, 9, "wide shot, slow push-in", "A small dial on Rob1's forearm starts to spin, static crackles on his visor and Seed's hair floats upward. They look at each other."),
        (9, 14, "medium shot", "Small stones and a few loose metal clips roll toward the cliff. Rob1's boots lift off the ground and he is dragged sideways. Seed grabs his arm and skids with him, and he slams chest-first against the rock wall and sticks flat, his legs dangling."),
        (14, 19, "close-up", "Rob1 pinned against the wall, his visor squashed into two flat cyan bars, deadpan. Seed puts her boot against the wall and pulls with both hands, face scrunched, then stops and bursts into silent laughter, wiping a tear."),
        (19, 23, "medium shot", "The disturbance fades. With a pop Rob1 comes unstuck and falls into her arms. She holds him up like a trophy, and his visor gives a bashful wink."),
        (23, 27, "wide shot, slow dolly-in", "The canyon walls open onto a dark green ridge above a calm golden bay. Seed walks out onto the ridge, her hair ivory against the sulphur-gold sky."),
        (27, 30, "close-up then wide, rack focus", "Rob1's visor fills with tiny gold glints. Beyond them, far across the water, tall slender columns of glowing cloud stand motionless in the haze, calm and silent."),
    ],
    optics="Shot 1: 28 mm. Shot 2: 24 mm. Shot 3: 35 mm. Shot 4: 85 mm. Shot 5: 50 mm. Shot 6: 24 mm. Shot 7: 100 mm then 28 mm.",
    physics="Hair and loose threads float toward the wall; small stones roll up the ground and stick to the rock; metal clips fly; Rob1's feet lift and scrape; when the field fails he drops with a soft clank; haze drifts slowly over the bay.",
    lighting="Late afternoon, warm orange 4,500 K light low from the left, the canyon walls glowing orange and cream; on the ridge the sky turns sulphur-gold, the bay reflects it, the cloud columns glow softly from inside. No aurora.",
    audio="Wind in the canyon, a rising electric hum and crackle, scraping stones, a metallic clang as Rob1 hits the wall, Seed's grunts and laughter, a soft pop as he unsticks, then a wide quiet wind over the bay and a faint low hum from the distant clouds. No dialogue.",
))

# ---------------------------------------------------------------- 08
SEQ.append(dict(
    id="S08", titre="La plage qui s'allume", trajet="Cônes volcaniques, puis plage de sable noir", plans="7-21 · 7-22",
    palette="Orange de lave → bleu électrique sur sable noir", grad=["#c9843a", "#2a54d8"], duree=30,
    ecart="Ajout : le plancton qui s'allume (MA-03) joué en danse, et la mauvaise nouvelle cachée. Pas de fièvre. Les images remplacent la mer grise et les sels colorés par une plage de sable noir bordée de végétation bleue.",
    refs=["seed", "rob1", "i46", "i28"],
    scene="Thirty seconds, six shots, hard cuts. Dusk. Seed runs down a volcanic slope with Rob1 on her back and reaches a black sand beach on a cold sea. Rob1 steps into the shallows and sapphire-blue plankton light blooms around his foot. He starts a clumsy dance and Seed joins him. "
          "Then he glances at a warning on his forearm, looks at her dancing, and quietly hides it.",
    animals="The plankton: tiny luminous organisms in the water, each 0.1 to 1 mm, glowing sapphire blue, emerald green and soft orange when the water around them moves, forming swarms, spirals and sheets of light.",
    location="LOCATION A, shots 1 and 2 (Reference image 3): dark volcanic hills under mist with smoking conical craters and fan-shaped streams of glowing orange lava threads running down the slopes, a grey sky turning to deep red at the horizon. "
             "LOCATION B, shots 3 to 6 (Reference image 4): a black sand beach beside a cold grey-blue sea, dense cushions of electric-blue vegetation covering the dunes behind it, early night. "
             "TRANSITION: they run off the dark slope onto the sand.",
    first="Seed runs downhill from screen-left to screen-right with Rob1 on her back. On the beach she sets him down at the water's edge, the sea at screen-right.",
    shots=[
        (0, 5, "wide tracking shot, low", "A dark volcanic slope at dusk, thin orange lava threads glowing in fans down the hillsides. Seed runs down it laughing silently with Rob1 on her back, his arm pointing forward like a captain, kicking up black ash."),
        (5, 9, "wide shot", "They reach a black sand beach, dunes covered in cushions of electric-blue vegetation, a cold grey-blue sea. Seed sets Rob1 down at the water's edge, and he plants his feet in the wet sand."),
        (9, 13, "close-up on his foot", "Rob1's foot steps into the shallows. Sapphire-blue and emerald plankton light blooms around it in a ring. His visor shows two wide round discs."),
        (13, 19, "wide low-angle shot", "Rob1 starts stomping. Rings of light ripple outward. Seed begins to spin and splash, and the whole shore ripples with blue-green light under the dusk. His visor shows a pulsing row of bars like a beat."),
        (19, 24, "close-up", "Rob1 glances at his forearm: amber warning bars. His eyes narrow into flat bars. He looks at Seed dancing in the light and covers the display with his hand until the amber goes out."),
        (24, 30, "medium shot, slow push-in", "Seed notices and comes closer, tilting her head. Rob1 instantly gives a wink and holds up a small sprig of the electric-blue plant like a gift. She takes it and holds it to the light, smiling. He keeps watching her with a faint worry: his visor smile flickers to a single amber dot and back."),
    ],
    optics="Shot 1: 28 mm at 0.4 m camera height. Shot 2: 24 mm. Shot 3: 85 mm close focus. Shot 4: 24 mm at 0.2 m camera height. Shot 5: 100 mm. Shot 6: 50 mm.",
    physics="Black ash kicks up in puffs; the plankton glow blooms and ripples with each stomp and splash; droplets fly in arcs from Seed's boots; the blue sprig trembles in her fingers.",
    lighting="Dusk then early night: deep red afterglow on the horizon, orange glow from the lava threads on the slope; on the beach the key light is the sapphire-blue and emerald plankton glow from below, plus a soft red rim from the horizon; Rob1's visor and the amber dot are the only close practicals.",
    audio="Boots on loose ash, wind, a low rumble far away, small waves, a glassy shimmer each time the plankton lights, Rob1's rhythmic stomp and soft servo beat, Seed's silent laugh as breath and splashing, a faint electronic double chirp of the warning. No dialogue.",
))

# ---------------------------------------------------------------- 09
SEQ.append(dict(
    id="S09", titre="Ko-rê", trajet="Désert de sable noir, puis lacs salés", plans="8-01 · 8-02 · 8-03",
    palette="Noir et ocre → vert acide et sel blanc", grad=["#7d9a8a", "#9bd04a"], duree=30,
    ecart="Ajout : Rob1 qui glisse sur la pellicule d'eau. Le cri « Ko-rê » et le mot « Korê » sont ceux du plan 8-02. Écart avec la Bible : les lacs de l'image sont vert acide, la Bible les dit rose et pourpre. À toi de trancher.",
    refs=["seed", "rob1", "i36", "i38"],
    scene="Thirty seconds, seven shots, hard cuts. First amber dawn. Seed and Rob1 leave a black sand desert for a basin of salt lakes. Rob1 steps onto the thin water film and slides across it on his backside, spinning, with Seed skating after him. "
          "He slides into a colony of tall purple birds that lift off together calling a two-note cry. Rob1 records it and plays it back, the birds answer, and Seed whispers the word that names the planet.",
    animals="The birds: tall purple wading birds 1.4 m high with a 2.2 m wingspan, a long sinuous neck and a down-curved bill, rich purple plumage shading to rose-pink on the chest, soft grey legs, wings edged in glossy black; thousands in a colony. Their call has two notes, \"Ko-rê\".",
    location="LOCATION A, shots 1 and 2 (Reference image 3): a wide black sand and ochre desert with a single dark volcano on the horizon under a pale blue sky, a ring of black ash on the ground; leave out the round dark object in the middle of the image. "
             "LOCATION B, shots 3 to 7 (Reference image 4): a plain of shallow acid-green and turquoise pools edged by white salt crust and yellow mineral rims, orange-brown ground, a pale blue sky, a thin film of water mirroring the sky. "
             "Dawn: a small intense amber point, a companion star, rises on the horizon before the main star. "
             "TRANSITION: they walk off the black sand onto the white salt crust and the thin mirror film.",
    first="Seed and Rob1 walk from screen-left to screen-right. Rob1 slides toward the birds in the middle distance at screen-right.",
    shots=[
        (0, 5, "very wide shot, locked", "A black sand desert, a dark volcano on the horizon, the first amber light at the edge of the sky. Seed and Rob1 walk out of the dark sand toward a white line of salt crust."),
        (5, 10, "wide shot, slow push-in", "They step onto the thin water film over the salt, a mirror under the pale sky. Rob1 steps ahead, his feet skid, his visor shows wide discs, and he slides away across the mirror on his backside, spinning with his arms flailing."),
        (10, 14, "wide tracking shot, low", "Seed runs after him and then slides on her boots like a skater, arms out, laughing silently, her reflection beneath her. Rob1 glides toward a distant group of tall purple birds standing in the green shallows."),
        (14, 20, "wide low-angle shot", "Rob1 slides to a stop in the middle of thousands of purple wading birds, who lift off together in a rolling wave, wings edged in black, calling a two-note cry that fills the basin. His visor shows wide discs, then a tilted curious look."),
        (20, 24, "close-up", "Rob1 lifts his head, a small cyan waveform pulses on his visor, and he replays the two-note call. Birds nearby answer him. His visor shows two laughing arcs."),
        (24, 27, "medium shot", "Seed slides to a stop beside him and sits down in the shallows, the colony wheeling overhead, amber light on the water."),
        (27, 30, "close-up on Seed in profile, slow push-in", "Her eyes on the birds, her lips shaping the two notes. At 28.5 seconds she whispers one word, soft and wondering: \"Korê.\""),
    ],
    optics="Shot 1: 24 mm, deep focus. Shot 2: 35 mm. Shot 3: 28 mm at 0.2 m camera height. Shot 4: 24 mm at 0.3 m camera height. Shot 5: 85 mm. Shot 6: 40 mm. Shot 7: 85 mm.",
    physics="The water film ripples and mirrors; Rob1 spins as he slides; birds run on the water before taking off, droplets flying off their legs; wings beat in staggered waves; Seed's skid throws a fan of spray.",
    lighting="Amber dawn: pale amber light about 3,500 K from the small companion star, then the first warm orange of the main star lifting the horizon; green and turquoise water, white salt, a pale turquoise-grey sky, never a deep blue; the purple birds stand out against the green; her hair reads ivory.",
    audio="Wind over sand at the start, boots on salt crust, a squeak and slide on the water film, Seed's silent laugh as breath, hundreds of wings and a wall of two-note calls, Rob1's replayed call and the answering birds, Seed's whispered \"Korê\" at 28.5 seconds. No other dialogue.",
))

# ---------------------------------------------------------------- 10
SEQ.append(dict(
    id="S10", titre="Les câbles", trajet="Plaine rose, puis clairière rouge", plans="9-01 · 9-02 · 9-04 · 9-05",
    palette="Rose et crème → rouge cramoisi", grad=["#c45a9e", "#b02a1a"], duree=30,
    ecart="Le grand robot remplace Rob2 et Rob3 pour la traction. Rob1 déclenche la manoeuvre. Les images remplacent les lacs pourpres et la clairière magenta par une plaine rose et une clairière rouge sous une lune rouge.",
    refs=["seed", "rob1", "big", "xeno", "i18", "i43"],
    scene="Thirty seconds, seven shots, hard cuts. They come back to the sinkhole where the XENOPOD fell. Rob1 plans the rescue, the big robot descends on a cable to hook the capsule, and all three haul: Seed, Rob1 and the big robot. "
          "The cable slips and flings Rob1 backward, then the dented capsule heaves over the rim and the three celebrate.",
    animals="",
    location="LOCATION A, shot 1 (Reference image 5): a plain of pale pink and cream rock with clusters of red-rose umbrella-shaped mushroom plants and large white sculpted stones, a pale sky. "
             "LOCATION B, shots 2 to 7 (Reference image 6): a clearing at dusk in a calm red scene, a bare crimson tree, soft rounded red shapes and red grass, thick red mist, a large red moon low in a grey-teal sky; in the middle of the clearing a large dark circular sinkhole with pale grey walls, and far below the dented top of the XENOPOD-01 capsule (Reference image 4). "
             "TRANSITION: a hard cut from the pink plain to the red clearing.",
    first="In shot 1 Seed, Rob1 and the big robot walk toward camera, Rob1 riding on the big robot's shoulders. At the pit the sinkhole is at screen-right, the cable runs from the crimson tree at screen-left.",
    shots=[
        (0, 5, "wide shot, slow push-in", "A pale pink plain dotted with red-rose mushroom plants and white stones. Seed, Rob1 and the big robot walk in a line toward the camera, Rob1 riding on the big robot's shoulders."),
        (5, 9, "wide shot, low", "A red clearing at dusk, thick red mist, a large red moon low in the sky. They reach the edge of the dark pit. Seed looks down; far below, the dented cream top of the capsule lies in the shadow."),
        (9, 14, "medium shot", "Rob1 hops down, his visor drawing a thin cyan angle line that tilts, then a second line, planning the pull. The big robot nods its lens. Seed ties a steel cable around the trunk of the crimson tree."),
        (14, 19, "close-up then wide", "The big robot lowers itself into the pit on the cable and hooks the capsule; it holds up one long hand in a small ring: done. Seed and Rob1 grip the cable on the surface."),
        (19, 25, "wide shot", "All three haul together: Seed dug in, leaning back with her teeth clenched, Rob1 pulling with both small arms, his visor straining bars, the big robot hauling over the edge. The cable creaks and the capsule rises centimetre by centimetre."),
        (25, 28, "medium shot", "The cable slips and Rob1 shoots backward and tumbles across the red grass, Seed grabs the cable with both hands, the big robot catches them both with one long arm."),
        (28, 30, "wide shot", "The dented capsule heaves over the rim and falls onto the grass, whole. Seed drops flat on her back with her arms out; Rob1 does a tiny stomping dance on top of the capsule while the big robot lifts its lens to the red moon."),
    ],
    optics="Shot 1: 28 mm. Shot 2: 24 mm at 0.4 m camera height. Shot 3: 40 mm. Shot 4: 35 mm then 24 mm. Shot 5: 28 mm. Shot 6: 50 mm. Shot 7: 24 mm.",
    physics="The steel cable creaks and sings under load; red dust and loose stones trickle into the pit; the capsule scrapes the wall; the tree trunk shudders as the cable bites; when the cable slips it whips through the grass.",
    lighting="Soft pale daylight on the pink plain, then dusk in the clearing: thick red mist, a large red moon low in a grey-teal sky, long deep shadows, a rosy cast on skin and armour; the pit is dark with a faint warm rim light on the cream capsule.",
    audio="Wind over rock, heavy robot steps, a hum of servos, cable creak and metallic hiss, grunts of effort from Seed, Rob1's rhythmic effort chirps, a loud slip and thump, the capsule's dull scrape and thud on the grass, a small triumphant chime from Rob1. No dialogue.",
))

for s in SEQ:
    t = 0
    for a, b, *_ in s["shots"]:
        assert a == t, (s["id"], a, t)
        t = b
    assert t == 30, (s["id"], t)
    for r in s["refs"]:
        assert r in REFS, (s["id"], r)
print(len(SEQ), "séquences, durées vérifiées")

# Planche d'échelle de Cal (image 4) : jointe à toutes les séquences, en dernier
REFS["board"] = dict(name="Planche d'échelle Seed / Rob1", desc=(
    "the scale board: Seed (orange frame) and the small Rob1 (green frame, four views) shown side by side at their true relative sizes. "
    "Keep exactly these proportions in every shot: Rob1 stands about one metre tall, the top of his helmet at Seed's waist. Ignore the coloured frames and all text labels."))
REFS["board_full"] = dict(name="Planche d'échelle complète", desc=(
    "the scale board: the big robot (red frame, three views), Seed (orange frame) and the small Rob1 (green frame, four views) shown side by side at their true relative sizes. "
    "Keep exactly these proportions in every shot: Rob1 stands about one metre tall, the top of his helmet at Seed's waist. Ignore the coloured frames and all text labels."))
for _s in SEQ:
    _s["refs"].append("board_full" if "big" in _s["refs"] else "board")
