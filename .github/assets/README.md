# Repository graphics

The README banner, the feature images and the social preview. All are drawn from
`graphics.html` with the tokens in `src/styles.css` and the numbers in `src/data/mock.ts`,
then rendered at 2x in light and dark.

To re-render after a design or data change, update `graphics.html` and run
`node .github/assets/render.js "$PWD/.github/assets"`.

`social-preview.png` is not used by the README. Upload it under the repo's
Settings → General → Social preview so links to the repo show it.
