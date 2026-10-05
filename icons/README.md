# Reusable symbol library

The approved private-dashboard backup references **13 illustrated navigation symbols**, **eight illustrated tile sheets**, and **nine appliance-control SVGs**. Every one of those custom asset files is bundled under `assets/`. Home Assistant's built-in Material Design Icons are referenced by name in `mdi-names-used.txt`; their glyph files come from Home Assistant and are not duplicated here.

Open [the visual gallery](gallery.html) through a local web server to inspect every illustrated sheet position. `custom-symbols.json` lists the files, positions, and the semantic names of the navigation symbols. `reusable-symbols.css` selects individual symbols directly from the original sprite sheets without cropping or changing the artwork.

For example, after copying both `icons/` and `assets/` into the same `/config/www/vie_sauvage_share/` folder:

```html
<link rel="stylesheet" href="/local/vie_sauvage_share/icons/reusable-symbols.css">
<span class="my-home-symbol my-home-nav-symbol my-home-nav-pool"></span>
<span class="my-home-symbol my-home-tile-symbol my-home-sheet-01 my-home-r4c4"></span>
```

The first span is the Pool navigation glyph. The second is row 4, column 4 of sheet 01, the illustrated garage. Change `--my-home-symbol-size` to scale both:

```css
.small-symbol { --my-home-symbol-size: 40px; }
```

The starter Home and Media navigation bars use the illustrated strip, including the Cameras symbol. The Home control board also uses selected illustrated symbols on smaller controls; Home Assistant's built-in MDI icons remain where there is no corresponding custom artwork. The package deliberately omits the private dashboard's entity-specific CSS mappings, because those mappings contain the owner's entity IDs.

The grid coordinates are stable within the included files. A few final-row positions on a sheet may be empty. Use the gallery to choose a visible symbol before adding a class to your card.
