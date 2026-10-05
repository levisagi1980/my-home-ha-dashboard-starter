#!/usr/bin/env python3
"""Build a privacy-safe Home Assistant dashboard starter from a small entity map."""

import argparse
import json
import re
from pathlib import Path


ASSET_ROOT = "/local/vie_sauvage_share/assets"
THEME = "Vie Sauvage Luxury"
ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
ROOMS = ["Living Room", "Kitchen", "Dining Room", "Bedroom", "Bathroom", "Office", "Patio", "Laundry Room"]
PAGES = [
    ("Home", "home", "home-exterior-generic.png"),
    ("Scenes", "scenes", None),
    ("Rooms", "rooms", None),
    ("Cameras", "cameras", None),
    ("Security", "security", "security-foliage.jpg"),
    ("Climate", "climate", "warm-interior.jpg"),
    ("Energy", "energy", "solar-page.jpg"),
    ("Pool", "pool", "pool-page.jpg"),
    ("Vehicles", "vehicles", "vehicle-page.jpg"),
    ("Pets", "pets", "pets-page.png"),
    ("Lighting", "lighting", "warm-interior.jpg"),
    ("Media", "media", "media-page.png"),
    ("Cleaning", "cleaning", "cleaning-page.png"),
    ("Appliances", "appliances", "warm-interior.jpg"),
]
SCENES = ["good-morning", "good-night", "entertain", "movie", "backyard", "away", "pool-party", "all-off", "coffee"]
APPLIANCES = [
    "kitchen-display-nest-hub-max-transparent-v2.png",
    "lg-dishwasher-v2.jpg", "lg-dryer-v3.jpg",
    "lg-pedestal-washer-standalone-v4.jpg", "lg-washer-v3.jpg",
    "samsung-bespoke-refrigerator-v2.jpg", "samsung-cooktop-v2.jpg",
]
GLASS = """ha-card { background: rgba(24,29,27,.72) !important; color: #F4F1ED !important;
  border: 1px solid rgba(216,204,184,.30) !important; border-radius: 18px !important;
  box-shadow: 0 12px 32px rgba(0,0,0,.24) !important; backdrop-filter: blur(12px); }"""


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def background(file_name):
    if not file_name:
        return "#0B0E0E"
    return {
        "image": f"{ASSET_ROOT}/backgrounds/{file_name}",
        "opacity": 68 if file_name == "warm-interior.jpg" else 75,
        "alignment": "center", "size": "cover", "repeat": "no-repeat", "attachment": "fixed",
    }


def markdown(content):
    return {"type": "markdown", "content": content, "card_mod": {"style": GLASS}}


def picture(image, destination=None):
    card = {"type": "picture", "image": image, "card_mod": {"style": GLASS}}
    if destination:
        card["tap_action"] = {"action": "navigate", "navigation_path": destination}
    return card


def image_tile(image, label, destination=None):
    return {"type": "vertical-stack", "cards": [picture(image, destination), markdown(f"### {label}")]}


def section(*cards):
    return {"type": "grid", "cards": list(cards)}


def nav_card(dashboard_path):
    return {"type": "custom:my-home-nav-card", "grid_options": {"columns": "full"},
            "sprite": f"{ASSET_ROOT}/icons/luxury-nav-icons-normalized-20260930.png",
            "base_path": f"/{dashboard_path}"}


def mapped_tiles(config, page):
    result = []
    for entity in config.get("entities_by_view", {}).get(page, []):
        if not isinstance(entity, str) or not ENTITY.fullmatch(entity):
            raise ValueError(f"invalid Home Assistant entity ID on {page}")
        result.append({"type": "tile", "entity": entity, "card_mod": {"style": GLASS}})
    return result


def build(config):
    dashboard_path = config.get("dashboard_path", "vie-sauvage-starter")
    if not re.fullmatch(r"[a-z0-9-]+", dashboard_path):
        raise ValueError("dashboard_path must contain only lowercase letters, digits, and hyphens")
    route = lambda path: f"/{dashboard_path}/{path}"
    views = []
    for title, path, art in PAGES:
        if title == "Home":
            views.append({"title": title, "path": path, "type": "panel", "theme": THEME,
                          "background": background(art),
                          "cards": [{"type": "custom:my-home-control-board", "assets_root": ASSET_ROOT,
                                     "base_path": f"/{dashboard_path}",
                                     "home_entities": config.get("home_entities", {})}]})
            continue
        if title == "Media":
            media = config.get("media", {})
            views.append({"title": title, "path": path, "type": "panel", "theme": THEME,
                          "background": background(art),
                          "cards": [{"type": "custom:my-home-media-board", "assets_root": ASSET_ROOT,
                                     "base_path": f"/{dashboard_path}",
                                     "player": media.get("player", ""),
                                     "config_entry_id": media.get("music_assistant_config_entry_id", ""),
                                     "players": media.get("players", []),
                                     "quick_actions": media.get("quick_actions", [])}]})
            continue
        cards = [markdown(f"# {title}\nA starting point for your own home. Add your devices in `mappings.json`.")]
        if title == "Scenes":
            cards = [markdown("# Scenes\nReplace these starter tiles with your own Home Assistant scenes or scripts.")]
            cards += [image_tile(f"{ASSET_ROOT}/scenes/scene-{name}.jpg", name.replace("-", " ").title()) for name in SCENES]
        elif title == "Cameras":
            cards = [markdown("# Cameras\nAdd your own camera cards here. The starter contains no feeds, image URLs, or camera entity IDs.")]
        elif title == "Rooms":
            cards = [markdown("# Rooms\nFictional room scenes are included; swap in your own photos whenever you like.")]
            cards += [image_tile(f"{ASSET_ROOT}/rooms/{slug(room)}.jpg", room, route(slug(room))) for room in ROOMS]
            cards.append(image_tile(f"{ASSET_ROOT}/backgrounds/pool-page.jpg", "Pool", route("pool")))
        elif title == "Cleaning":
            cards.append(picture(f"{ASSET_ROOT}/backgrounds/cleaning-card.png"))
        elif title == "Appliances":
            cards = [markdown("# Appliances\nProduct imagery is included. Map your own devices below the gallery.")]
            cards += [image_tile(f"{ASSET_ROOT}/appliances/devices/{name}",
                                 name.rsplit(".", 1)[0].replace("-", " ").title()) for name in APPLIANCES]
        cards += mapped_tiles(config, title)
        cards.insert(0, nav_card(dashboard_path))
        sections = [section(cards[0])]
        sections[0]["column_span"] = 4
        sections.extend(section(card) for card in cards[1:])
        sections[1]["column_span"] = 4
        views.append({"title": title, "path": path, "type": "sections", "theme": THEME,
                      "max_columns": 4, "background": background(art), "sections": sections})

    for room in ROOMS:
        cards = [markdown(f"# {room}\nChoose the lights, climate, and media devices for this room in `mappings.json`.")]
        cards.append(picture(f"{ASSET_ROOT}/rooms/{slug(room)}.jpg"))
        cards += mapped_tiles(config, room)
        cards.insert(0, nav_card(dashboard_path))
        sections = [section(cards[0])]
        sections[0]["column_span"] = 4
        sections.extend(section(card) for card in cards[1:])
        sections[1]["column_span"] = 4
        views.append({"title": room, "path": slug(room), "type": "sections", "theme": THEME,
                      "max_columns": 4, "background": background("warm-interior.jpg"),
                      "sections": sections})
    return {"title": config.get("title", "My Home"), "views": views}


def yaml_scalar(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return json.dumps(value)
    return json.dumps(value, ensure_ascii=False)


def emit_yaml(value, indent=0):
    pad = " " * indent
    if isinstance(value, dict):
        lines = []
        for key, child in value.items():
            if isinstance(child, (dict, list)) and child:
                lines.append(f"{pad}{yaml_scalar(key)}:")
                lines.append(emit_yaml(child, indent + 2))
            else:
                lines.append(f"{pad}{yaml_scalar(key)}: {emit_yaml(child, 0) if isinstance(child, (dict, list)) else yaml_scalar(child)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for child in value:
            if isinstance(child, (dict, list)) and child:
                rendered = emit_yaml(child, indent + 2).splitlines()
                lines.append(f"{pad}- {rendered[0].lstrip()}")
                lines.extend(rendered[1:])
            else:
                lines.append(f"{pad}- {emit_yaml(child, 0) if isinstance(child, (dict, list)) else yaml_scalar(child)}")
        return "\n".join(lines)
    return yaml_scalar(value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=Path(__file__).resolve().parents[1] / "mappings.example.json")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "dashboard.yaml")
    args = parser.parse_args()
    config = json.loads(args.config.read_text())
    result = build(config)
    args.output.write_text("# Generated starter dashboard. Edit mappings.json and rerun the builder.\n" + emit_yaml(result) + "\n")
    print(f"Wrote {len(result['views'])} views to {args.output}")


if __name__ == "__main__":
    main()
