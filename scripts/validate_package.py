#!/usr/bin/env python3
"""Check the starter package for missing assets and private live-system references."""

import json
import re
from pathlib import Path

from build_dashboard import ASSET_ROOT, build


ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "mappings.example.json").read_text())
dashboard = build(CONFIG)
assert len(dashboard["views"]) == 22
assert CONFIG["title"] == "My Home"
assert CONFIG["home_entities"] == {}
assert CONFIG["entities_by_view"] == {}
assert CONFIG["media"]["player"] == ""
assert CONFIG["media"]["music_assistant_config_entry_id"] == ""

references = set()
entity_fields = []


def walk(value, path="root"):
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"entity", "entities", "entity_id"}:
                entity_fields.append(f"{path}.{key}")
            walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            walk(child, f"{path}[{index}]")
    elif isinstance(value, str):
        references.update(re.findall(re.escape(ASSET_ROOT) + r"/[^\s'\"}]+", value))


walk(dashboard)
assert not entity_fields, f"default dashboard has entity fields: {entity_fields[:5]}"
for reference in references:
    relative = reference.removeprefix("/local/vie_sauvage_share/")
    assert (ROOT / relative).is_file(), f"missing asset: {relative}"

for asset in (ROOT / "assets").rglob("*"):
    assert not asset.is_symlink(), f"unexpected symlink: {asset}"

for name in ("my-home-control-board.js", "my-home-media-board.js", "my-home-nav-card.js"):
    assert (ROOT / "components" / name).is_file(), f"missing card component: {name}"

for name in ("home", "home-full", "media", "scenes", "rooms", "pool", "living-room", "cleaning", "appliances", "symbol-library"):
    shot = ROOT / "screenshots" / f"{name}.jpg"
    assert shot.is_file() and shot.stat().st_size > 100_000, f"missing or incomplete screenshot: {name}"

for room in ("living-room", "kitchen", "dining-room", "bedroom", "bathroom", "office", "patio", "laundry-room"):
    assert (ROOT / "assets" / "rooms" / f"{room}.jpg").is_file(), f"missing room image: {room}"

catalog = json.loads((ROOT / "icons" / "custom-symbols.json").read_text())
assert len(catalog["navigation"]["symbols"]) == 13
assert len(catalog["tile_sheets"]) == 8
assert len(catalog["appliance_control_svgs"]) == 9
for path in [catalog["navigation"]["asset"], catalog["alternate_navigation_svg"]]:
    assert (ROOT / "icons" / path).is_file(), f"missing icon asset: {path}"
for sheet in catalog["tile_sheets"]:
    assert len(sheet["slots"]) == 16
    assert (ROOT / "icons" / sheet["asset"]).is_file(), f"missing tile sheet: {sheet['id']}"
for path in catalog["appliance_control_svgs"]:
    assert (ROOT / "icons" / path).is_file(), f"missing appliance icon: {path}"
css = (ROOT / "icons" / "reusable-symbols.css").read_text()
assert all(f".my-home-nav-{item['name']}" in css for item in catalog["navigation"]["symbols"])
assert all(f".my-home-{sheet['id']}" in css for sheet in catalog["tile_sheets"])
mdi_names = (ROOT / "icons" / "mdi-names-used.txt").read_text().splitlines()
assert len(mdi_names) == 244 and all(name.startswith("mdi:") for name in mdi_names)

for file in ROOT.rglob("*"):
    if file.suffix not in {".py", ".js", ".json", ".yaml", ".md", ".svg", ".html", ".css", ".txt"}:
        continue
    content = file.read_text(errors="replace")
    if file.name == "validate_package.py":
        continue
    for forbidden in ("/api/image/serve/", "/local/vie_sauvage/rooms/", "data:image/",
                      "192.168.", "Bearer ", "access_token", "api_key", "password",
                      "Sagi", "Nick", "0f6e27b62f23f8c3816665d11a6090fe"):
        assert forbidden.lower() not in content.lower(), f"private marker in {file.name}: {forbidden}"

print(f"Package check passed: {len(dashboard['views'])} views, {len(references)} referenced assets, custom icon catalog complete, no live entity IDs")
