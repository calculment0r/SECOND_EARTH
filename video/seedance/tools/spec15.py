import sys, os, json, glob, re
sys.path.insert(0, os.path.dirname(__file__))
import data3 as D
NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten']
base = {s["id"]: s for s in D.SEQ}
SP = [
 dict(id="SP1", src="S05", titre="Les geants endormis", speech="No speech at all.",
  scene="Fifteen seconds, four shots, hard cuts. Spectacular scale and quiet comedy: at dusk Seed and Rob1 sneak through a herd of giant white animals asleep across a golden plain like scattered hills. A giant leg swings down and Rob1 stops it with his hidden strength; a huge eye half opens, then closes.",
  first="Seed and Rob1 enter from screen-left at the edge of the plain, the sleeping herd spreads toward screen-right.",
  shots=[(0,4,"very wide, low, slow crane up","A vast golden plain at dusk under a pale pink-lilac sky, dozens of sleeping white giants lying like hills, a thin orange line of fire on the horizon, giant grey mushroom-shaped towers and a mesa far away. Two tiny figures, Seed and Rob1, at the edge of the herd."),
         (4,8,"low wide tracking shot, deep focus","Seed and Rob1 tiptoe between the sleeping giants with exaggerated careful steps: thick white wool rising and falling, enormous column legs, curved horns resting on the grass, warm breath rolling out like fog around them."),
         (8,12,"medium-wide shot, slight low angle","A giant rolls over in its sleep and a massive leg swings down beside them. Rob1 leaps in front of Seed, plants his feet and braces both arms against the descending hoof, and lowers it gently to the ground. His visor shows two serious bars; Seed stares at him."),
         (12,15,"close-up at eye level","One enormous eye half opens right in front of them. They freeze; Rob1's visor goes completely dark. The eye slowly closes again, and Seed lets out a silent breath of laughter.")],
  optics="Shot 1: 24 mm, deep focus. Shot 2: 24 mm at 0.3 m camera height. Shot 3: 35 mm. Shot 4: 100 mm."),
 dict(id="SP2", src="S07", titre="L-aimant et la baie aux nuees", speech="No speech at all.",
  scene="Fifteen seconds, four shots, hard cuts. A magnetic disturbance in an orange canyon pulls Rob1 against the rock wall like a magnet while Seed laughs and pulls him free; then they step out above a golden bay where immense columns of glowing cloud stand over the water, calm and far away.",
  first="Seed leads at screen-left with Rob1 beside her; the rock wall is at screen-right.",
  shots=[(0,4,"wide shot, slow push-in","An orange canyon of swirling banded sandstone in waves. Seed's hair floats upward, small stones lift off the ground, the dial on Rob1's forearm spins, static crackles across his visor."),
         (4,8,"medium shot","Rob1's boots lift and he is dragged sideways and slams flat against the rock wall, legs dangling, his visor squashed into two flat cyan bars. Seed grabs his arm and pulls with her boot against the wall, shaking with silent laughter."),
         (8,11,"medium shot","The pull fades; with a pop Rob1 comes unstuck and drops into her arms. She holds him up like a trophy; his visor gives a bashful wink."),
         (11,15,"very wide shot, slow dolly back","They step out onto a dark green ridge above a calm golden bay under a sulphur-gold sky; far across the water tall slender columns of glowing dust cloud rise motionless into the haze. Two tiny figures in the foreground.")],
  optics="Shot 1: 24 mm. Shot 2: 35 mm. Shot 3: 50 mm. Shot 4: 21 mm, deep focus."),
 dict(id="SP3", src="S06", titre="La secousse", speech="One spoken word only: Seed cries \"Rob!\" at 5.5 seconds; no other speech.",
  scene="Fifteen seconds, four shots, hard cuts. An earthquake splits a golden plain at dawn between Seed and Rob1; Rob1 leaps the crack and holds up a toppling rock slab with a burst of hidden strength; Seed grabs him and they slide down into a dark misty forest.",
  first="Seed stands at screen-left, Rob1 runs in from screen-right; the crack opens between them.",
  shots=[(0,4,"very wide, locked, deep focus","Dawn on a vast golden plain, a giant grey mushroom-shaped tower rising from a green plateau. The grass trembles in rings and a flock of small flying animals bursts out of it. Seed and Rob1 are two small figures far apart."),
         (4,8,"wide shot","The ground splits: a long crack races between them. At 5.5 seconds Seed cries one hoarse word: \"Rob!\" Rob1 leaps the crack in a single bound as a slab of rock tips toward her."),
         (8,12,"medium shot, low angle","Rob1 catches the toppling slab with both hands above his head, boots sinking into the soil, servos whining, visor two fierce bars. Seed scrambles out from under it."),
         (12,15,"wide shot, tracking","Seed scoops Rob1 under one arm and sprints; the ground tilts and they slide down a steep slope into a dark forest of tall black trunks and shafts of white light, landing in soft moss.")],
  optics="Shot 1: 24 mm, deep focus. Shot 2: 24 mm. Shot 3: 35 mm at 0.3 m camera height. Shot 4: 28 mm."),
 dict(id="SP4", src="S02", titre="La descente", speech="No speech at all.",
  scene="Fifteen seconds, four shots, hard cuts. Seed lowers herself into a deep crevasse on a thick vine with Rob1 strapped to her chest; a strand snaps, they drop and swing, and a vast dark cavern lit from inside by glowing pale masses opens beneath them.",
  first="Seed stands at the lip of the crevasse at screen-left, Rob1 strapped to her chest. All motion goes downward.",
  shots=[(0,4,"very wide, static","A green valley floor under tall pale cliffs, giant rounded stone eggs, low mist, and at the foot of the cliff a black crevasse. Seed and Rob1 are two tiny figures at its lip."),
         (4,8,"low wide shot from below","Seed lowers herself hand over hand on a thick copper-coloured vine down the wet wall, Rob1 strapped to her chest with his visor completely black, eyes shut, the daylight shrinking above."),
         (8,11,"close-up","The vine snaps with a twang; they drop a metre; Seed's hand clamps shut, teeth clenched; one cyan eye reappears on Rob1's visor, then two spirals."),
         (11,15,"wide reveal, slow crane down","Seed swings out in a long arc and the cavern opens beneath them: huge pale cloud-shaped masses hanging from the walls glow warm orange from within over a wet black floor. She lands softly on a rock ledge.")],
  optics="Shot 1: 21 mm, deep focus. Shot 2: 24 mm looking up. Shot 3: 85 mm. Shot 4: 24 mm."),
]
def locks(s, refs):
    n = lambda k: refs.index(k) + 1
    L = ["Seed's face, freckles, white buzz-cut hair, white hooded bodysuit and yellow over-trousers stay identical across every cut (Reference image %d)." % n('seed'),
         "Rob1 keeps the same small body, about 75 cm tall with the top of his helmet just below Seed's hip, clearly much smaller than Seed in every shot where both appear, the same helmet-head, side pods and backpack across every cut (Reference image %d); his visor only ever shows simple cyan or amber shapes, never text or a human face." % n('rob1')]
    places = [k for k in refs if D.REFS[k].get("img") and D.REFS[k]["desc"].startswith("a location")]
    if len(places) == 2: L.append("LOCATION A always follows Reference image %d and LOCATION B always follows Reference image %d: same shapes, materials and colours as the references." % (n(places[0]), n(places[1])))
    beasts = [k for k in refs if D.REFS[k].get("img") and not D.REFS[k]["desc"].startswith("a location")]
    if beasts: L.append("The giant animals follow Reference images %s for build, fur and horns." % " and ".join(str(n(b)) for b in beasts))
    bd = 'board' if 'board' in refs else ('board_full' if 'board_full' in refs else '')
    if bd: L.append('Relative sizes always follow the scale board (Reference image %d): Seed and Rob1 keep exactly the proportions shown there.' % n(bd))
    L.append("Only these two characters appear: no other people, no extra robots.")
    L.append("Exactly %s shots and %s hard cuts, no dissolves." % (NUM[len(s['shots'])], NUM[len(s['shots'])-1]))
    return " ".join(L)
def compose(s):
    b = base[s["src"]]; refs = b["refs"]
    out = ["GLOBAL STYLE: " + D.GLOBAL_STYLE + " Shot at the widest cinema framing, 21:9.",
           "FORMAT MODE: Controlled %s-shot sequence, %s HARD CUTs, 15.0 seconds total, real-time motion with no slow motion. %s No music." % (NUM[len(s['shots'])], NUM[len(s['shots'])-1], s["speech"]),
           "SCENE: " + s["scene"],
           "REFERENCES: " + " ".join("Reference image %d is %s" % (i+1, D.REFS[k]["desc"]) for i, k in enumerate(refs))]
    if b["animals"]: out.append("ANIMALS AND PROPS: " + b["animals"])
    out += ["LOCATION: " + re.sub(r",? shots? \d+( (to|and) \d+)?", "", b["location"]), "FIRST FRAME AND BLOCKING: " + s["first"]]
    lines = ["SHOTS (15 seconds, %d shots, hard cuts):" % len(s["shots"])]
    for i, (a, e, cam, act) in enumerate(s["shots"]):
        lines.append("%.1fs to %.1fs, SHOT %d, %s. %s" % (a, e, i+1, cam, act))
        if i < len(s["shots"]) - 1: lines.append("HARD CUT.")
    out += ["\n".join(lines), "CAPTURE FORMAT AND OPTICS: " + s["optics"], "PHYSICS: " + b["physics"], "LIGHTING: " + b["lighting"],
            "AUDIO: " + b["audio"].replace(" at 10.5 seconds", " at 5.5 seconds") + " No music, no narration, no subtitles.",
            "POSITIVE LOCKS: " + locks(s, refs), "TEXTURE AND REALISM: " + D.NEGATIVES]
    return "\n\n".join(out)
K = sys.argv[1]
for s in SP:
    src_dir = glob.glob(f"{K}/Seedance_SecondEarth/{s['src']}_*")[0]
    d = f"{K}/Spectaculaires_15s_1080p/{s['id']}_{s['titre'].replace(' ', '-')}"
    os.makedirs(d, exist_ok=True)
    for f in glob.glob(f"{src_dir}/*.jpg"):
        os.system(f"cp '{f}' '{d}/'")
    open(f"{d}/prompt.txt", "w").write(compose(s) + "\n")
    print(d, len(compose(s).split()), "mots")
