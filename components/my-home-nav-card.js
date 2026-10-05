/* Optional visual navigation using the included 13-symbol illustrated sprite. */
(() => {
class MyHomeNavCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.render();
  }
  set hass(value) { this.hassRef = value; }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
  render() {
    if (!this.config) return;
    const menu = [
      ["Home", "home", 0], ["Lighting", "lighting", 1], ["Rooms", "rooms", 2],
      ["Scenes", "scenes", 3], ["Cameras", "cameras", 4], ["Security", "security", 5], ["Climate", "climate", 6],
      ["Media", "media", 7], ["Energy", "energy", 8], ["Pool", "pool", 9],
      ["Pets", "pets", 10], ["Cleaning", "cleaning", 11], ["More", "appliances", 12],
    ];
    const sprite = String(this.config.sprite || "").replace(/["<>]/g, "");
    this.innerHTML = `<style>
      my-home-nav-card{display:block;width:100%}
      my-home-nav-card .nav{display:flex;gap:7px;overflow-x:auto;padding:8px;border-radius:23px;border:1px solid rgba(254,224,186,.29);background:rgba(102,64,39,.54);backdrop-filter:blur(16px);scrollbar-width:thin}
      my-home-nav-card button{flex:1 0 75px;min-width:75px;max-width:120px;height:91px;color:#fff;background:linear-gradient(140deg,rgba(255,235,210,.15),rgba(31,26,25,.18));border:1px solid rgba(252,227,201,.22);border-radius:17px;display:grid;justify-items:center;align-content:center;gap:3px;font:11px system-ui,-apple-system,sans-serif;cursor:pointer}
      my-home-nav-card button:hover{background:rgba(255,219,177,.28)}
      my-home-nav-card .icon{width:57px;height:57px;background-image:url("${sprite}");background-repeat:no-repeat;background-size:1300% 100%}
    </style><div class="nav" aria-label="Dashboard navigation">${menu.map(([label, route, index]) => `<button type="button" data-route="${route}" aria-label="${label}"><span class="icon" style="background-position:${index * 100 / 12}% 50%"></span>${label}</button>`).join("")}</div>`;
    this.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => {
      const path = `${this.config.base_path}/${button.dataset.route}`;
      window.location.assign(path);
    }));
  }
}
if (!customElements.get("my-home-nav-card")) customElements.define("my-home-nav-card", MyHomeNavCard);
})();
