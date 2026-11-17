# Berkshire Architects

A static website preview for the New Zealand residential architecture and interiors practice. The page and its images, fonts and scripts are served locally, with no build step.

## Preview

Run `python -m http.server 4178 --bind 127.0.0.1` from this directory and open [the local preview](http://127.0.0.1:4178/). You can also open `index.html` directly in a browser.

## Publish with GitHub Pages

1. Push these files to a repository owned by the intended GitHub account.
2. In the repository, open **Settings → Pages**. Choose **Deploy from a branch**, then select the branch and **/ (root)**.
3. After buying the domain, verify it in your GitHub account, add it in **Settings → Pages**, and set the DNS records at the registrar using [GitHub’s custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Enable **Enforce HTTPS** when available.

GitHub publishes the Pages URL using the account’s username. GitHub Free supports Pages from public repositories. See [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Enquiry form

The site displays `admin@berkshire.nz` and `027 887 7007`. The enquiry form submits a first name, email address and contact number to that mailbox through [FormSubmit](https://formsubmit.co/). GitHub Pages serves the static site while FormSubmit handles the email delivery.

Once `admin@berkshire.nz` can receive mail, send a test enquiry from the live site and confirm the address using FormSubmit’s activation email. Submit again and check that all three fields arrive. Repeat the delivery check after switching the website to `berkshire.nz`. Set up the mailbox and its MX records with your email provider independently from the GitHub Pages domain records.

## Image sources

- `assets/images/concrete-passage.webp` — [1933 Old Millfun, photographed by Declan Sun](https://unsplash.com/photos/a-concrete-brutalist-building-with-stairs-and-windows-1K65uaupMVA).
- `assets/images/concrete-stair.webp` — [Lugdunum Museum, photographed by Sébastien Lavalaye](https://unsplash.com/photos/a-modern-spiral-staircase-ascends-inside-a-concrete-building-gNY6RsMIsPo).
- Both photographs use the [Unsplash License](https://unsplash.com/license).
- Font licences are in `assets/fonts/`.

### Concept renders

Generated with the built-in ImageGen tool. The mobile hero is a crop of the desktop hero.

- `assets/images/coastal-house.webp` and `assets/images/coastal-house-mobile.webp` — Use case: stylized-concept. Generate a premium photoreal architectural render for the full-bleed homepage horizon of an architecture practice. A strong, single-storey modernist courtyard pavilion in warm board-formed concrete with a long heavy horizontal slab and deep bronze-black windows, tucked into windswept coastal grasses. Large sculptural tree at far right, natural hazy ridgeline and a pale soft cloud-streaked sky. Ultra-wide 2:1 landscape composition, photographed low from a straight-on yet slightly oblique three-quarter view, building stretches from 35% to 90% of frame, sky occupies the top third. Keep left third darker, quiet and free of attention-grabbing detail for a white text overlay. Soft warm evening sidelight, moody olive and sand palette, architectural magazine photography, foreground depth. Full bleed, single image, no collages, no text, no marks.
- `assets/images/courtyard-house.webp` — Use case: stylized-concept. A refined photoreal architectural concept render of a sheltered courtyard residence, framed wide at eye level. A thick warm grey concrete roof planes across the top, full-height clear glass and ebonized timber frame a garden courtyard. A sculptural small tree in gravel near the left third and subtle warm interior glow behind. Contemporary New Zealand / Pacific architecture sensibility, natural stone and timber, muted forest greens, quietly sophisticated architectural editorial photography. Horizontal 4:3 composition, one full bleed image, no words or watermarks.
- `assets/images/new-zealand-brick-house.webp` — Use case: stylized-concept. Single photoreal architectural concept render for a premium New Zealand residential practice website. A believable contemporary architect-designed Aotearoa New Zealand standalone home on a gently sloped Wellington or Auckland hillside, low intersecting pitched and flat forms interpreting the local gable vernacular, pale grey clay brick walls laid in long carefully jointed courses, light honey-toned vertical timber cladding inside a recessed glazed gable, flat charcoal metal roof and slim dark metal window frames. Veranda opens into a native garden with tussock, tī kōuka cabbage trees, hebe and flax with an open low ridge in the distance, not a forest. Broad view at human height from path across foreground, asymmetrical framing with architecture centered, full building visible with moderate negative space at sides. Soft high overcast New Zealand daylight, crisp silver greys and natural warm timbers, understated and grounded. Landscape 3:2, professional editorial photography with real construction logic and subtle textures. No people, text, watermark, excessive glazing, luxury styling or impossible cantilevers.
- `assets/images/brick-timber-detail.webp` — Use case: stylized-concept. A single exceptionally realistic close-range architectural detail rendering for a contemporary Aotearoa New Zealand residential architecture website. The subject is the actual construction junction where pale ash-grey textured elongated clay brick returns into a deeply recessed entry clad in light honey-toned vertical timber. Compose as a material close-up with a brick wall in the left foreground occupying about 55 percent of the image and the neatly detailed shadow reveal and clean vertical timber in the right background. Fine matte grey slightly recessed mortar beds and staggered perpends visibly defined, natural pinholes and softly irregular handmade brick faces, accurately lit subtle timber grain, real end joints and a thin dark architectural trim at the junction. Oblique angle and medium-shallow depth of field with the material interface sharp. Overcast daylight with a directional grazing highlight, soft greys and natural light wood. Vertical 4:5 architectural material photography style, full bleed. No graphics, text, people, decorative props or collage.
