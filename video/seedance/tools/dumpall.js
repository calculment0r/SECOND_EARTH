const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(600);
  const r = await p.evaluate(() => D.seq.map(s => ({ id: s.id, titre: s.titre, refs: s.refs, prompt: compose(s) })));
  fs.writeFileSync(process.argv[3], JSON.stringify(r)); await b.close();
})();
