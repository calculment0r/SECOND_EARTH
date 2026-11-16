"""Lance des séquences Seedance 2.5 avec la CLI Higgsfield (compte de Cal), puis télécharge les vidéos.

Usage : python3 launch.py <kit_dir> <S05> [S01 ...] [--ratio 21:9] [--res 720p] [--duree 30] [--out videos]
<kit_dir> contient un dossier par séquence (images numérotées 1_, 2_... + prompt.txt), produit par kit.py.
Respecte la limite de 8 générations simultanées (rate_limit_reached) en réessayant toutes les 30 s.
Ne jamais lancer sans l'accord explicite de Cal, et tester une seule séquence avant un lot.
"""
import glob, json, os, subprocess, sys, time, urllib.request
args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
ratio, res, duree, outdir = opt("--ratio", "21:9"), opt("--res", "720p"), opt("--duree", "30"), opt("--out", "videos")
kit, seqs = args[0], args[1:]
os.makedirs(outdir, exist_ok=True)
pending, jobs, done = list(seqs), {}, set()
while pending or len(done) < len(jobs):
    if pending:
        sid = pending[0]; d = glob.glob(f"{kit}/{sid}_*")[0]
        imgs = sorted(glob.glob(f"{d}/*.jpg"), key=lambda p: int(os.path.basename(p).split("_")[0]))
        cmd = ["higgsfield", "generate", "create", "seedance_2_5", "--mode", "omni_reference", "--duration", duree,
               "--resolution", res, "--aspect_ratio", ratio, "--generate_audio", "true", "--prompt", open(f"{d}/prompt.txt").read(), "--json"]
        for f in imgs: cmd += ["--image-references", f]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0:
            jobs[sid] = json.loads(r.stdout)[0]; pending.pop(0); print(sid, "lancé", jobs[sid], flush=True); continue
        if "rate_limit" not in r.stdout + r.stderr:
            print(sid, "erreur", (r.stdout + r.stderr)[:300], flush=True); pending.pop(0)
    for sid, jid in jobs.items():
        if sid in done: continue
        g = json.loads(subprocess.run(["higgsfield", "generate", "get", jid, "--json"], capture_output=True, text=True).stdout or "{}")
        if g.get("status") == "completed" and g.get("result_url"):
            out = f"{outdir}/{sid}_{ratio.replace(':', 'x')}_{res}_{duree}s.mp4"
            urllib.request.urlretrieve(g["result_url"], out); done.add(sid); print(sid, "terminé", out, flush=True)
        elif g.get("status") in ("failed", "nsfw", "canceled", "cancelled"):
            done.add(sid); print(sid, "échec", g.get("status"), flush=True)
    time.sleep(30)
