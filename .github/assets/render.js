const { chromium } = require('playwright');
const path = require('path');
const G = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 800 } });
  const jobs = [["banner", 1], ["ranking", 1], ["pipeline", 1], ["social", 0], ["og", 0]];
  for (const [scene, rounded] of jobs) for (const theme of ["dark", "light"]) {
    if ((scene === "social" || scene === "og") && theme === "light") continue;
    await p.goto(`file://${G}/graphics.html?scene=${scene}&theme=${theme}${rounded ? "&rounded=1" : ""}`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    const el = await p.$(`#${scene}`);
    const name = scene === "social" ? "social-preview.png" : scene === "og" ? "og-image.png" : `${scene}-${theme}.png`;
    await el.screenshot({ path: path.join(G, "out", name), omitBackground: true });
    console.log(name);
  }
  await b.close();
})();
