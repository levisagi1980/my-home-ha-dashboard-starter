# Home control mapping

The Home page follows the section and tile arrangement of the owner's dashboard, using neutral example values. Put your own entity IDs in `home_entities` in a local `mappings.json`. The distributed `mappings.example.json` leaves them blank. Rebuild `dashboard.yaml` after changing the map.

```json
{
  "title": "My Home",
  "dashboard_path": "vie-sauvage-starter",
  "entities_by_view": {"Living Room": ["light.example_living_room"]},
  "home_entities": {
    "weather": "weather.example_home",
    "scene_good_morning": "scene.example_good_morning",
    "light_living_room": "light.example_living_room",
    "climate_main": "climate.example_main_floor"
  },
  "media": {"player": "", "music_assistant_config_entry_id": "", "players": [], "quick_actions": []}
}
```

The `example_*` IDs above are placeholders. Mapped values come from Home Assistant's current state. If a mapped entity is unavailable, the card says so; no cached state is used.

| Section | Mapping keys | Expected entity | Tap behavior |
| --- | --- | --- | --- |
| Weather | `weather` | `weather.*` | Read only: temperature attribute and condition. |
| Scenes | `scene_good_morning`, `scene_good_night`, `scene_entertain`, `scene_movie`, `scene_backyard`, `scene_away`, `scene_pool_party`, `scene_all_off`, `scene_coffee` | `scene.*` or `script.*` | Calls that domain's `turn_on` service. Unmapped buttons are disabled. |
| Security | `security_alarm`, `front_door`, `garage_door`, `windows`, `camera_count` | Appropriate alarm, lock, cover, binary sensor, or sensor | Shows state; small tiles open the entity's HA detail dialog. Main status has no action. |
| Vehicle | `vehicle_battery` | Battery sensor | Shows state as percent. The page link opens Vehicles. |
| Indoor | `climate_main`, `climate_guest` | `climate.*` | Shows `current_temperature` and HVAC state. Thermostat tiles open HA's climate dialog. |
| Energy | `solar_power`, `grid_power`, `home_power` | Power sensors reporting kW | Read only; the card appends `kW`, so convert upstream if sensors report watts. |
| Pool | `pool_temperature`, `pool_heat`, `pool_pump`, `pool_lights` | Temperature sensor and appropriate switch, light, or climate entities | Shows state; heat, pump, and light tiles open HA detail dialogs. |
| Lighting Groups | `light_living_room`, `light_kitchen`, `light_dining_room`, `light_bedroom`, `light_exterior`, `light_pool_lights`, `light_spa_lights`, `light_office` | `light.*` | Calls `light.toggle` for the mapped light or group. |
| Systems & Utilities | `utility_garage_door`, `utility_irrigation`, `utility_vacuum`, `utility_cooling`, `utility_internet`, `utility_home_assistant`, `utility_backups` | Appropriate entity | Opens HA detail dialog; no direct service call. |
| Cameras | None yet | None | Four visual placeholders; add your own camera cards separately. |
| Rooms | None | None | Opens a named room view. |

For covers, locks, alarms, pool equipment, and other sensitive devices, this starter opens Home Assistant's own control dialog instead of issuing a one-tap action from Home. The card contains no security confirmation or permission system of its own. Home Assistant user permissions and the device integration govern what a signed-in user can do.

## Media mapping

`media.player` is the HA Music Assistant player for Now Playing, previous, play/pause, next, and library-item playback. `media.music_assistant_config_entry_id` enables library queries. `media.players` lists named audio zones for display, for example `[{"name":"Living Room","entity_id":"media_player.example_living_room"}]`. Zone tiles currently show state and are not playback target selectors.

`media.quick_actions` may contain explicit `{"label","icon","domain","service","entity_id"}` entries. Clicking one calls that Home Assistant service on that entity. Review these entries before enabling them.

The preview uses fictional library items and disabled example actions. Music Assistant library service behavior can vary by installation; verify it with your configured player.
