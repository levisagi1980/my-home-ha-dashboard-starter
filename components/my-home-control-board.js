/* A privacy-safe, configurable version of the My Home control dashboard.
 * Every example value is marked as preview data until mapped to an HA entity. */
(() => {
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
  const SCENES = ["good-morning", "good-night", "entertain", "movie", "backyard", "away", "pool-party", "all-off", "coffee"];
  const NAV = [
    ["Home", "home", 0], ["Lighting", "lighting", 1], ["Rooms", "rooms", 2],
    ["Scenes", "scenes", 3], ["Cameras", "cameras", 4], ["Security", "security", 5], ["Climate", "climate", 6],
    ["Media", "media", 7], ["Energy", "energy", 8], ["Pool", "pool", 9],
    ["Pets", "pets", 10], ["Cleaning", "cleaning", 11], ["More", "appliances", 12],
  ];
  const LIGHTS = [
    ["Living Room", "living_room", "mdi:sofa"], ["Kitchen", "kitchen", "mdi:silverware-fork-knife"],
    ["Dining Room", "dining_room", "mdi:table-furniture"], ["Bedroom", "bedroom", "mdi:bed-king"],
    ["Exterior", "exterior", "mdi:home-outline"], ["Pool Lights", "pool_lights", "mdi:waves"],
    ["Spa Lights", "spa_lights", "mdi:hot-tub"], ["Office", "office", "mdi:desk"],
  ];
  const UTILITIES = [
    ["Garage Door", "garage_door", "mdi:garage"], ["Irrigation", "irrigation", "mdi:sprinkler"],
    ["Vacuum", "vacuum", "mdi:robot-vacuum"], ["Cooling", "cooling", "mdi:snowflake"],
    ["Internet", "internet", "mdi:router-wireless"], ["Home Assistant", "home_assistant", "mdi:home-assistant"],
    ["Backups", "backups", "mdi:database"],
  ];
  const ROOMS = ["Living Room", "Kitchen", "Dining Room", "Bedroom", "Bathroom", "Office", "Patio", "Laundry Room"];
  const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ART = {
    weather: ["921145967837",3,4],
    header_security: ["921145967837",1,1], header_vehicle: ["921145967837",2,2],
    header_indoor: ["921145967837",2,4], header_energy_distribution: ["921145967837",4,2],
    header_pool: ["a07cc8d67a7e",1,1], header_cameras: ["921145967837",2,1],
    header_lighting_groups: ["044d23918370",1,2], header_systems_utilities: ["a07cc8d67a7e",2,2],
    header_rooms: ["6d0edd1c7a96",1,3],
    front_door: ["921145967837",1,2], garage_door: ["921145967837",1,3],
    windows: ["921145967837",1,4], camera_count: ["921145967837",2,1],
    climate_main: ["921145967837",3,1], climate_guest: ["921145967837",3,1],
    pool_heat: ["a07cc8d67a7e",1,3], pool_pump: ["a07cc8d67a7e",1,4],
    pool_lights: ["a07cc8d67a7e",2,1],
    light_living_room: ["044d23918370",1,2], light_kitchen: ["044d23918370",1,2],
    light_dining_room: ["044d23918370",1,1], light_bedroom: ["a07cc8d67a7e",4,1],
    light_exterior: ["044d23918370",1,3], light_pool_lights: ["a07cc8d67a7e",2,1],
    light_spa_lights: ["a07cc8d67a7e",1,1], light_office: ["a07cc8d67a7e",4,3],
    utility_garage_door: ["921145967837",1,3], utility_irrigation: ["a07cc8d67a7e",2,3],
    utility_vacuum: ["a07cc8d67a7e",2,4], utility_cooling: ["921145967837",3,3],
    utility_internet: ["a07cc8d67a7e",3,1], utility_home_assistant: ["044d23918370",2,3],
    utility_backups: ["a07cc8d67a7e",3,3],
  };

  class MyHomeControlBoard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); }
    setConfig(config) { this.config = config; this.render(); }
    set hass(value) { this.hassRef = value; if (this.config) this.render(); }
    getCardSize() { return 20; }
    getGridOptions() { return { columns: "full", rows: "auto" }; }
    get entities() { return this.config?.home_entities || {}; }
    get root() { return this.config?.assets_root || "/local/vie_sauvage_share/assets"; }
    get base() { return this.config?.base_path || "/vie-sauvage-starter"; }
    id(key) { return this.entities[key] || ""; }
    state(key) { return this.hassRef?.states?.[this.id(key)]; }
    display(key, attribute, preview) {
      const state = this.state(key);
      const raw = attribute ? state?.attributes?.[attribute] : state?.state;
      return raw !== undefined && raw !== null && raw !== "unknown" && raw !== "unavailable" ? String(raw) : preview;
    }
    status(key, preview = "Preview") {
      if (!this.id(key)) return `${preview} · preview`;
      return this.display(key, null, "Unavailable");
    }
    nav(label, route, index) {
      return `<button data-go="${route}" class="nav-tile"><span class="nav-symbol" style="background-position:${index * 100 / 12}% 50%"></span><strong>${label}</strong></button>`;
    }
    symbol(key, fallbackIcon) {
      const art = ART[key];
      if (!art) return `<ha-icon icon="${safe(fallbackIcon)}"></ha-icon>`;
      const [sheet,row,column] = art;
      return `<span class="illustrated" role="img" aria-label="${safe(key.replaceAll("_"," "))}" style="background-image:url('${safe(this.root)}/icons/tile-sprite-${sheet}.png');background-position:${(column-1)*100/3}% ${(row-1)*100/3}%"></span>`;
    }
    scene(name) {
      const label = name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const mapped = this.id(`scene_${name.replace(/-/g, "_")}`);
      return `<button class="scene" data-scene="${name}" ${mapped ? "" : "disabled"} style="background-image:linear-gradient(0deg,rgba(12,12,12,.72),transparent 65%),url('${safe(this.root)}/scenes/scene-${name}.jpg')"><span>${safe(label)}</span></button>`;
    }
    info(key, label, icon, preview) {
      return `<button class="mini" data-more="${key}" ${this.id(key) ? "" : "disabled"}>${this.symbol(key,icon)}<span><strong>${safe(label)}</strong><small>${safe(this.status(key, preview))}</small></span></button>`;
    }
    light([label, name, icon]) {
      const key = `light_${name}`;
      return `<button class="mini light" data-toggle="${key}" ${this.id(key) ? "" : "disabled"}>${this.symbol(key,icon)}<span><strong>${safe(label)}</strong><small>${safe(this.status(key, "Off"))}</small></span></button>`;
    }
    utility([label, key, icon]) { return this.info(`utility_${key}`, label, icon, "Ready"); }
    card(title, icon, body, extra = "") {
      return `<section class="panel ${extra}"><h2>${this.symbol("header_"+title.toLowerCase().replace(/[^a-z]+/g,"_").replace(/_$/,""),icon)}${title}</h2>${body}</section>`;
    }
    css() {
      return `<style>
        :host{display:block;width:100%;font:14px/1.3 system-ui,-apple-system,sans-serif;color:#fbf6ee}
        *{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}button:disabled{cursor:default}
        .board{display:grid;grid-template-columns:130px minmax(0,1fr);gap:12px;padding:8px;max-width:2000px;margin:auto}
        .nav{grid-row:1 / span 4;display:grid;gap:9px;align-content:start;position:sticky;top:8px;max-height:calc(100vh - 16px);overflow:auto;scrollbar-width:none}
        .nav-tile{height:120px;border-radius:22px;border:1px solid rgba(255,221,183,.33);background:rgba(54,41,34,.75);display:grid;place-items:center;align-content:center;gap:4px;backdrop-filter:blur(12px)}
        .nav-tile:hover{background:rgba(123,83,53,.85)}.nav-tile strong{font-size:15px}.nav-symbol{width:77px;height:77px;background:url('${safe(this.root)}/icons/luxury-nav-icons-normalized-20260930.png') no-repeat;background-size:1300% 100%}
        .illustrated{display:inline-block;width:30px;height:30px;flex:none;background-size:400% 400%;background-repeat:no-repeat;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
        .top{display:grid;grid-template-columns:1.45fr 1fr;gap:12px;min-width:0}.hero{min-height:305px;border-radius:23px;border:1px solid rgba(255,230,199,.4);background:linear-gradient(90deg,rgba(15,13,12,.8),rgba(15,13,12,.18)),url('${safe(this.root)}/backgrounds/home-exterior-generic.png') center/cover;padding:31px 38px}
        .hero h1{font-size:clamp(34px,4vw,58px);font-weight:300;line-height:1;margin:0 0 38px}.hero h2{font-size:24px;margin:0 0 12px}.hero p{margin:0;color:#e9dbcc}.preview{font-size:11px;color:#f2d5ab;margin-top:24px}
        .right-top{display:grid;grid-template-rows:auto 1fr;gap:9px;min-width:0}.weather{padding:18px;border-radius:23px;background:rgba(52,72,115,.8);border:1px solid rgba(220,231,255,.28);display:flex;gap:13px;align-items:center}.weather ha-icon{--mdc-icon-size:31px}.weather strong{font-size:23px}.weather small{display:block;color:#e0e8f9}
        .scenes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.scene{min-height:96px;border:1px solid rgba(255,228,198,.25);border-radius:18px;background-size:cover;background-position:center;display:flex;align-items:end;justify-content:center;padding:7px 2px;font-weight:650;font-size:11px;text-align:center}.scene:hover:not(:disabled){filter:brightness(1.17)}
        .summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;min-width:0}.panel{min-width:0;border:1px solid rgba(255,232,203,.34);border-radius:22px;padding:13px;background:linear-gradient(145deg,rgba(75,58,45,.85),rgba(38,32,29,.8));backdrop-filter:blur(12px)}
        .panel h2{font-size:18px;font-weight:550;display:flex;gap:8px;align-items:center;margin:0 0 14px}.panel h2 ha-icon{--mdc-icon-size:25px;color:#e6c59a}.panel h2 .illustrated{width:26px;height:26px}
        .main-value{border-radius:20px;background:rgba(232,199,159,.20);padding:17px;margin-bottom:8px;min-height:88px}.main-value b{font-size:27px}.main-value small{display:block;color:#dfcdb8;margin-top:4px}.mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
        .mini{display:flex;align-items:center;gap:8px;text-align:left;border-radius:16px;border:1px solid rgba(255,231,202,.2);background:rgba(241,216,184,.16);min-height:68px;padding:8px}.mini:hover:not(:disabled){background:rgba(247,219,182,.3)}.mini ha-icon{--mdc-icon-size:28px;color:#ebc394;flex:none}.mini strong{display:block;font-size:11px}.mini small{display:block;font-size:10px;color:#ddd0bf;margin-top:2px}.mini:disabled{opacity:1}
        .footer-link{display:block;width:100%;text-align:center;padding:10px;border:1px solid rgba(255,221,184,.31);background:rgba(255,239,213,.12);border-radius:16px;margin-top:9px}.footer-link:hover{background:rgba(255,239,213,.25)}
        .vehicle{background:linear-gradient(0deg,rgba(38,29,27,.92),rgba(91,67,54,.65)),url('${safe(this.root)}/backgrounds/vehicle-card.jpg') center/cover}.energy{background:linear-gradient(0deg,rgba(26,22,19,.86),rgba(85,56,29,.56)),url('${safe(this.root)}/backgrounds/solar-card.jpg') center/cover}.pool{background:linear-gradient(0deg,rgba(13,33,37,.82),rgba(17,55,68,.43)),url('${safe(this.root)}/backgrounds/pool-page.jpg') center/cover}
        .vehicle-art{width:100%;max-height:142px;object-fit:contain;filter:drop-shadow(0 9px 10px rgba(0,0,0,.6))}
        .climate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.climate-block{padding:9px 5px;border-radius:16px;border:1px solid rgba(255,229,196,.24);background:rgba(255,238,212,.13);text-align:center}.climate-block b{display:block;font-size:25px;margin:6px}.climate-block small{display:block;color:#e3cbb0}
        .power{display:flex;align-items:center;justify-content:space-around;gap:5px;text-align:center;margin:23px 0 12px}.power div{border:1px solid rgba(255,201,114,.5);background:rgba(25,21,18,.47);border-radius:50%;width:80px;height:80px;display:grid;align-content:center;font-size:11px}.power b{font-size:18px}
        .lower{display:grid;grid-template-columns:2.1fr 1fr 1fr;gap:10px;min-width:0}.camera-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.camera{height:140px;border:1px solid rgba(255,230,198,.21);border-radius:13px;background:linear-gradient(135deg,rgba(50,43,40,.9),rgba(101,83,72,.74));display:grid;place-items:center;color:#d3b99f}.camera>div{text-align:center}.camera .illustrated{width:45px;height:45px}.camera ha-icon{--mdc-icon-size:45px}.camera span{font-size:11px;display:block;text-align:center}.lights .mini-grid,.utilities .mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .rooms{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.room{min-height:132px;border:1px solid rgba(255,232,203,.4);border-radius:18px;background-size:cover;background-position:center;display:flex;align-items:end;padding:12px;font-weight:600;text-shadow:0 2px 6px #000}.room:hover{filter:brightness(1.15)}
        @media(max-width:1250px){.board{grid-template-columns:95px minmax(0,1fr)}.nav-tile{height:95px}.nav-symbol{width:56px;height:56px}.summary{grid-template-columns:repeat(3,minmax(0,1fr))}.lower{grid-template-columns:1.5fr 1fr}.utilities{grid-column:1 / -1}.scenes{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:750px){.board{display:block}.nav{position:relative;display:flex;overflow-x:auto;max-height:none;margin-bottom:9px}.nav-tile{flex:0 0 76px;height:76px;border-radius:15px}.nav-symbol{width:43px;height:43px}.nav-tile strong{font-size:10px}.top,.lower{grid-template-columns:1fr}.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.rooms{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{min-height:220px}.scenes{grid-template-columns:repeat(3,minmax(0,1fr))}}
      </style>`;
    }
    render() {
      if (!this.config) return;
      const weather = this.state("weather");
      const temperature = this.display("weather", "temperature", "72");
      const condition = weather ? weather.state : "Sunny · preview";
      const security = this.status("security_alarm", "Disarmed");
      const battery = this.display("vehicle_battery", null, "68");
      const poolTemp = this.display("pool_temperature", null, "78");
      const now = new Date();
      const rooms = ROOMS.map((name) => `<button class="room" data-go="${slug(name)}" style="background-image:linear-gradient(0deg,rgba(0,0,0,.7),transparent 60%),url('${safe(this.root)}/rooms/${slug(name)}.jpg')">${safe(name)}</button>`).join("");
      this.shadowRoot.innerHTML = `${this.css()}<div class="board">
        <nav class="nav">${NAV.map(([label, route, index]) => this.nav(label, route, index)).join("")}</nav>
        <div class="top"><div class="hero"><h1>My Home</h1><h2>Home</h2><p>${safe(now.toLocaleDateString(undefined, {weekday:"long",month:"short",day:"numeric"}))}<br>${safe(now.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}))}</p><div class="preview">Unmapped values are preview examples. Map your own devices to activate controls.</div></div>
        <div class="right-top"><div class="weather">${this.symbol("weather","mdi:weather-partly-cloudy")}<div><strong>${safe(temperature)}°</strong><small>${safe(condition)}</small></div></div><div class="scenes">${SCENES.map((name) => this.scene(name)).join("")}</div></div></div>
        <div class="summary">
          ${this.card("Security","mdi:shield-home",`<div class="main-value"><b>${safe(security)}</b><small>Home security</small></div><div class="mini-grid">${this.info("front_door", "Front Door", "mdi:door", "Locked")}${this.info("garage_door", "Garage", "mdi:garage", "Closed")}${this.info("windows", "Windows", "mdi:window-closed", "Secure")}${this.info("camera_count", "Cameras", "mdi:cctv", "Ready")}</div><button class="footer-link" data-go="security">View Security →</button>`)}
          ${this.card("Vehicle","mdi:car-electric",`<div class="main-value"><b>${safe(battery)}%</b><small>Battery · ${this.id("vehicle_battery") ? "live" : "preview"}</small></div><div style="min-height:142px;display:grid;place-items:center"><img class="vehicle-art" src="${safe(this.root)}/vehicles/white-electric-suv-generic.png" alt="Generic electric SUV"></div><button class="footer-link" data-go="vehicles">Vehicle Controls →</button>`,"vehicle")}
          ${this.card("Indoor","mdi:home-outline",`<div class="climate-grid"><div class="climate-block">Main Floor<b>${safe(this.display("climate_main","current_temperature","74"))}°</b><small>${safe(this.status("climate_main","Heat / Cool"))}</small></div><div class="climate-block">Guest Suite<b>${safe(this.display("climate_guest","current_temperature","73"))}°</b><small>${safe(this.status("climate_guest","Heat / Cool"))}</small></div></div><div class="mini-grid" style="margin-top:9px">${this.info("climate_main","Main thermostat","mdi:thermostat","Set climate")}${this.info("climate_guest","Guest thermostat","mdi:thermostat","Set climate")}</div><button class="footer-link" data-go="climate">Climate →</button>`)}
          ${this.card("Energy Distribution","mdi:leaf",`<small>Live power between solar, home and grid</small><div class="power"><div>Solar<b>${safe(this.display("solar_power",null,"4.2"))}</b>kW</div><div>Grid<b>${safe(this.display("grid_power",null,"0.8"))}</b>kW</div><div>Home<b>${safe(this.display("home_power",null,"3.4"))}</b>kW</div></div><button class="footer-link" data-go="energy">View Energy →</button>`,"energy")}
          ${this.card("Pool","mdi:waves",`<div class="main-value"><b>${safe(poolTemp)}°</b><small>Water temperature</small></div><div class="mini-grid">${this.info("pool_heat","Heat","mdi:fire","Off")}${this.info("pool_pump","Pump","mdi:pump","On")}${this.info("pool_lights","Lights","mdi:lightbulb","Off")}</div><button class="footer-link" data-go="pool">Pool Controls →</button>`,"pool")}
        </div>
        <div class="lower">
          ${this.card("Cameras","mdi:cctv",`<div class="camera-grid">${["Front Door","Driveway","Backyard","Pool"].map((name) => `<div class="camera"><div>${this.symbol("header_cameras","mdi:cctv")}<span>${name} · add your camera</span></div></div>`).join("")}</div><button class="footer-link" data-go="cameras">Camera dashboard →</button>`,"cameras")}
          ${this.card("Lighting Groups","mdi:lightbulb-group",`<small>Quick controls</small><div class="mini-grid" style="margin-top:10px">${LIGHTS.map((entry) => this.light(entry)).join("")}</div>`,"lights")}
          ${this.card("Systems & Utilities","mdi:cog",`<small>Quick access</small><div class="mini-grid" style="margin-top:10px">${UTILITIES.map((entry) => this.utility(entry)).join("")}</div>`,"utilities")}
        </div>
        <div>${this.card("Rooms","mdi:sofa",`<div class="rooms">${rooms}</div>`)}</div>
      </div>`;
      this.shadowRoot.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => window.location.assign(`${this.base}/${button.dataset.go}`)));
      this.shadowRoot.querySelectorAll("[data-more]").forEach((button) => button.addEventListener("click", () => this.more(button.dataset.more)));
      this.shadowRoot.querySelectorAll("[data-toggle]").forEach((button) => button.addEventListener("click", () => this.toggle(button.dataset.toggle)));
      this.shadowRoot.querySelectorAll("[data-scene]").forEach((button) => button.addEventListener("click", () => this.activateScene(button.dataset.scene)));
    }
    more(key) {
      const entityId = this.id(key);
      if (entityId) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles:true, composed:true, detail:{ entityId } }));
    }
    async toggle(key) {
      const entityId = this.id(key);
      if (!entityId || !this.hassRef || !entityId.startsWith("light.")) return;
      await this.hassRef.callService("light", "toggle", {}, { entity_id:entityId });
    }
    async activateScene(name) {
      const entityId = this.id(`scene_${name.replace(/-/g, "_")}`);
      if (!entityId || !this.hassRef) return;
      const domain = entityId.split(".")[0];
      if (domain !== "scene" && domain !== "script") return;
      await this.hassRef.callService(domain, "turn_on", {}, { entity_id:entityId });
    }
  }
  if (!customElements.get("my-home-control-board")) customElements.define("my-home-control-board", MyHomeControlBoard);
})();
