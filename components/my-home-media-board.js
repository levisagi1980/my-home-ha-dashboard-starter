/* My Home media board: a reusable layout inspired by a private dashboard.
 * Configure it with your own Music Assistant entry and Home Assistant players.
 * The default mode shows fictional examples and does not call services. */

(() => {
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const SAMPLE_LIBRARY = [
  { name: "Evening Mix", type: "playlist", color: "#7b4e34", motif: "♫" },
  { name: "Desert Drive", type: "playlist", color: "#95613d", motif: "✦" },
  { name: "Quiet Focus", type: "playlist", color: "#403f50", motif: "◈" },
  { name: "Sunday Kitchen", type: "playlist", color: "#a57b4e", motif: "☀" },
  { name: "After Hours", type: "album", color: "#634b61", motif: "✧" },
  { name: "Poolside", type: "playlist", color: "#39646d", motif: "≈" },
  { name: "Slow Morning", type: "playlist", color: "#697254", motif: "☕" },
  { name: "Weekend Favorites", type: "playlist", color: "#8f604e", motif: "♥" },
];

const SAMPLE_ACTIONS = [
  ["Whole Home", "mdi:speaker-multiple"], ["Movie Night", "mdi:movie-open"],
  ["Good Morning", "mdi:weather-sunny"], ["Good Night", "mdi:weather-night"],
  ["Pool Party", "mdi:creation"], ["Manage Groups", "mdi:speaker-multiple"],
];

class MyHomeMediaBoard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.category = "recent";
    this.items = SAMPLE_LIBRARY;
    this.loading = false;
    this.message = "";
    this.lastLibraryKey = "";
  }

  setConfig(config) {
    this.config = { ...config };
    this.demo = !Boolean(config.config_entry_id);
    this.render();
  }

  set hass(value) {
    this.hassRef = value;
    if (this.config) {
      this.render();
      if (!this.demo && !this.lastLibraryKey) this.loadLibrary();
    }
  }

  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  async loadLibrary(search = "") {
    if (this.demo || this.loading || !this.hassRef) return;
    const key = `${this.category}:${search}`;
    if (key === this.lastLibraryKey) return;
    this.loading = true;
    this.message = "";
    this.render();
    try {
      const mediaType = { recent: "playlist", playlists: "playlist", liked: "track", albums: "album", artists: "artist", search: "track" }[this.category];
      const response = await this.hassRef.callService("music_assistant", "get_library", {
        config_entry_id: this.config.config_entry_id,
        media_type: mediaType,
        limit: 32,
        offset: 0,
        order_by: this.category === "recent" ? "last_played_desc" : "name",
        ...(this.category === "liked" ? { favorite: true } : {}),
        ...(search ? { search } : {}),
      }, {}, false, true);
      this.items = (response?.response?.items || []).map((item) => ({
        name: item.name || "Untitled",
        type: item.media_type || mediaType,
        uri: item.uri || "",
        image: item.image || "",
        subtitle: (item.artists || []).map((artist) => artist.name).filter(Boolean).join(", "),
      }));
      this.lastLibraryKey = key;
      if (!this.items.length) this.message = "No items found. Check your Music Assistant library and account connection.";
    } catch (error) {
      this.items = [];
      this.message = "The library is unavailable. Check the Music Assistant entry ID and integration.";
      console.warn("My Home media library request failed", error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async play(index) {
    if (this.demo || !this.hassRef || !this.config.player) return;
    const item = this.items[index];
    if (!item?.uri) return;
    try {
      await this.hassRef.callService("music_assistant", "play_media", {
        media_id: item.uri, media_type: item.type, enqueue: "replace",
      }, { entity_id: this.config.player });
      this.message = `Playing ${item.name}`;
    } catch (error) {
      this.message = "Playback failed. Check the selected Music Assistant player.";
      console.warn("My Home media playback failed", error);
    }
    this.render();
  }

  async control(service) {
    if (!this.config.player || !this.hassRef) return;
    await this.hassRef.callService("media_player", service, {}, { entity_id: this.config.player });
  }

  async runAction(index) {
    const action = this.config.quick_actions?.[index];
    if (!action?.domain || !action?.service || !action?.entity_id || !this.hassRef) return;
    await this.hassRef.callService(action.domain, action.service, {}, { entity_id: action.entity_id });
  }

  css() {
    return `<style>
      :host{display:block;color:#f5efe8;font:14px/1.35 system-ui,-apple-system,sans-serif}
      *{box-sizing:border-box} .board{display:grid;gap:22px;padding:14px 24px 28px;max-width:2000px;margin:auto}
      .nav{display:flex;gap:7px;overflow-x:auto;padding:8px;border-radius:23px;border:1px solid rgba(254,224,186,.29);background:rgba(102,64,39,.54);backdrop-filter:blur(16px);scrollbar-width:thin}
      .nav button{flex:1 0 85px;min-width:85px;max-width:130px;height:98px;color:#fff;background:linear-gradient(140deg,rgba(255,235,210,.15),rgba(31,26,25,.18));border:1px solid rgba(252,227,201,.22);border-radius:17px;display:grid;justify-items:center;align-content:center;gap:3px;font:11px system-ui,-apple-system,sans-serif}
      .nav .icon{width:60px;height:60px;background-image:url("${escapeHtml(this.config.assets_root || "/local/vie_sauvage_share/assets")}/icons/luxury-nav-icons-normalized-20260930.png");background-repeat:no-repeat;background-size:1300% 100%}
      .glass{border:1px solid rgba(255,234,209,.25);border-radius:22px;background:linear-gradient(115deg,rgba(35,31,29,.83),rgba(121,77,45,.59));box-shadow:0 14px 32px rgba(0,0,0,.22);backdrop-filter:blur(18px)}
      .label{display:flex;align-items:center;gap:8px;color:#eed4b1;font-size:13px;margin:0 0 10px 4px}
      .label ha-icon{--mdc-icon-size:17px}
      .now{min-height:143px;padding:22px 26px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px}
      .now .eyebrow{font-size:13px;color:#e5d5c3;display:flex;align-items:center;gap:7px;margin-bottom:18px}
      .now h2{font-size:22px;font-weight:500;margin:0 0 4px}.now p{font-size:12px;color:#d3c8bf;margin:0}
      .now .art{height:70px;width:70px;border-radius:12px;object-fit:cover;float:left;margin-right:16px}
      button{font:inherit;color:inherit;cursor:pointer;border:1px solid rgba(250,227,203,.3);background:rgba(255,230,205,.12);border-radius:13px}
      button:hover:not(:disabled){background:rgba(255,230,205,.25)}button:disabled{cursor:default;opacity:.68}
      .controls{display:flex;gap:7px}.controls button{width:40px;height:40px;display:grid;place-items:center}
      .controls ha-icon{--mdc-icon-size:21px}.source{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .source strong{font-size:16px;font-weight:500;display:flex;gap:9px;align-items:center}.spotify-mark{color:#1ed760;font-size:25px;line-height:1}
      .source .hint{font-size:12px;color:#dac3a7}.library{padding:14px 15px 13px;overflow:hidden}
      .tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}.tabs button{padding:9px 13px;font-size:12px}
      .tabs .selected{background:rgba(225,149,84,.52)}.search{width:220px;max-width:100%;border:1px solid rgba(250,227,203,.35);border-radius:11px;background:rgba(15,15,15,.35);color:#fff;padding:8px 10px}
      .carousel{display:flex;gap:10px;overflow-x:auto;padding:0 0 7px;scrollbar-color:#9c7455 transparent}
      .item{min-width:145px;width:145px;padding:7px;flex:none;border:1px solid rgba(255,229,200,.28);border-radius:15px;background:rgba(24,22,21,.28)}
      .cover{height:134px;width:100%;border-radius:11px;display:grid;place-items:center;overflow:hidden;position:relative;background:radial-gradient(circle at 25% 20%,rgba(255,224,169,.46),transparent 46%),linear-gradient(140deg,var(--cover),#241c22)}
      .cover img{width:100%;height:100%;object-fit:cover}.cover .motif{font-size:53px;color:rgba(255,244,224,.9);text-shadow:0 8px 15px rgba(0,0,0,.3)}
      .cover button{position:absolute;bottom:7px;right:7px;border-radius:50%;background:rgba(21,21,21,.8);height:29px;width:29px;padding:4px;display:grid;place-items:center}
      .item .name{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:7px 1px 2px}.item .sub{font-size:10px;color:#d1c2b2;margin:0 1px}
      .actions{display:flex;gap:8px;overflow-x:auto}.actions button{display:flex;gap:9px;align-items:center;min-width:142px;max-width:190px;padding:12px;text-align:left;background:rgba(45,39,36,.65)}
      .actions button ha-icon{--mdc-icon-size:25px;color:#e9c394}.actions small{display:block;font-size:10px;color:#d6c4b3;margin-top:2px}
      .zones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zone{padding:12px 15px;display:flex;gap:10px;align-items:center;min-height:59px}
      .zone ha-icon{--mdc-icon-size:24px;color:#e9c394}.zone small{display:block;color:#d4c3af;font-size:10px;margin-top:2px}
      .note{font-size:11px;color:#ead6be;margin:8px 3px 0}
      @media(max-width:720px){.now{grid-template-columns:1fr;padding:18px}.zones{grid-template-columns:1fr}.board{gap:16px;padding:8px}.item{min-width:123px;width:123px}.cover{height:113px}}
    </style>`;
  }

  render() {
    if (!this.config) return;
    const state = this.hassRef?.states?.[this.config.player];
    const active = state && ["playing", "paused", "buffering"].includes(state.state);
    const title = active ? (state.attributes.media_title || "Now Playing") : "Nothing Playing";
    const subtitle = active ? (state.attributes.media_artist || state.attributes.friendly_name || "") : "Choose music, select a speaker, or open a device below.";
    const art = active && state.attributes.entity_picture ? `<img class="art" src="${escapeHtml(state.attributes.entity_picture)}" alt="">` : "";
    const tabNames = [["recent", "Recently Played"], ["playlists", "Playlists"], ["liked", "Liked"], ["albums", "Albums"], ["artists", "Artists"], ["search", "Search"]];
    const library = this.items.map((item, index) => `<article class="item"><div class="cover" style="--cover:${escapeHtml(item.color || "#665041")}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : `<span class="motif">${escapeHtml(item.motif || "♫")}</span>`}<button data-play="${index}" title="Play ${escapeHtml(item.name)}" ${this.demo || !this.config.player ? "disabled" : ""}>▶</button></div><div class="name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div><div class="sub">${escapeHtml(item.subtitle || (this.demo ? "Example playlist" : item.type))}</div></article>`).join("");
    const actions = (this.config.quick_actions?.length ? this.config.quick_actions.map((action) => [action.label, action.icon || "mdi:play"]) : SAMPLE_ACTIONS).map(([label, icon], index) => `<button data-action="${index}" ${!this.config.quick_actions?.[index]?.entity_id ? "disabled" : ""}><ha-icon icon="${escapeHtml(icon)}"></ha-icon><span>${escapeHtml(label)}<small>${this.config.quick_actions?.[index]?.entity_id ? "Run action" : "Example action"}</small></span></button>`).join("");
    const zones = (this.config.players?.length ? this.config.players : ["Living Room", "Dining Room", "Portable", "Whole Home"]).map((player) => {
      const id = typeof player === "string" ? "" : player.entity_id;
      const name = typeof player === "string" ? player : (player.name || this.hassRef?.states?.[id]?.attributes?.friendly_name || "Speaker");
      const status = id ? (this.hassRef?.states?.[id]?.state || "Unavailable") : "Example zone";
      return `<div class="zone glass"><ha-icon icon="mdi:speaker"></ha-icon><span>${escapeHtml(name)}<small>${escapeHtml(status)}</small></span></div>`;
    }).join("");
    const menu = [["Home","home",0],["Lighting","lighting",1],["Rooms","rooms",2],["Scenes","scenes",3],["Cameras","cameras",4],["Security","security",5],["Climate","climate",6],["Media","media",7],["Energy","energy",8],["Pool","pool",9],["Pets","pets",10],["Cleaning","cleaning",11],["More","appliances",12]];
    const nav = `<nav class="nav">${menu.map(([label, route, index]) => `<button data-go="${route}"><span class="icon" style="background-position:${index * 100 / 12}% 50%"></span>${label}</button>`).join("")}</nav>`;
    this.shadowRoot.innerHTML = `${this.css()}<div class="board">${nav}
      <section class="now glass"><div>${art}<div class="eyebrow"><ha-icon icon="mdi:chart-bar"></ha-icon> Now Playing</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><div class="controls"><button data-control="media_previous_track" title="Previous" ${!this.config.player ? "disabled" : ""}><ha-icon icon="mdi:skip-previous"></ha-icon></button><button data-control="media_play_pause" title="Play or pause" ${!this.config.player ? "disabled" : ""}><ha-icon icon="mdi:play-pause"></ha-icon></button><button data-control="media_next_track" title="Next" ${!this.config.player ? "disabled" : ""}><ha-icon icon="mdi:skip-next"></ha-icon></button></div></section>
      <div class="source"><strong><span class="spotify-mark">●</span> Spotify Library</strong><span class="hint">${this.demo ? "Example content — connect Music Assistant to browse your own library" : "Music Assistant library"}</span></div>
      <section class="library glass"><div class="tabs">${tabNames.map(([id, label]) => `<button data-tab="${id}" class="${this.category === id ? "selected" : ""}">${label}</button>`).join("")}${this.category === "search" ? '<input class="search" type="search" placeholder="Search your library" aria-label="Search music library">' : ""}</div><div class="carousel">${library || `<p>${this.loading ? "Loading your library…" : escapeHtml(this.message || "No library items")}</p>`}</div>${this.message && library ? `<p class="note">${escapeHtml(this.message)}</p>` : ""}</section>
      <div><div class="label"><ha-icon icon="mdi:lightning-bolt"></ha-icon> Quick Media Actions</div><div class="actions">${actions}</div></div>
      <div><div class="label"><ha-icon icon="mdi:speaker-multiple"></ha-icon> Speaker Mixer · Audio Zones</div><div class="zones">${zones}</div></div>
    </div>`;
    this.shadowRoot.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
      this.category = button.dataset.tab;
      if (this.demo) {
        this.items = this.category === "liked" ? SAMPLE_LIBRARY.slice(0, 4) : SAMPLE_LIBRARY;
        this.render();
      } else {
        this.lastLibraryKey = "";
        this.items = [];
        this.loadLibrary();
      }
    }));
    this.shadowRoot.querySelector(".search")?.addEventListener("change", (event) => {
      if (!this.demo) { this.lastLibraryKey = ""; this.loadLibrary(event.target.value.trim()); }
    });
    this.shadowRoot.querySelectorAll("[data-play]").forEach((button) => button.addEventListener("click", () => this.play(Number(button.dataset.play))));
    this.shadowRoot.querySelectorAll("[data-control]").forEach((button) => button.addEventListener("click", () => this.control(button.dataset.control)));
    this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => this.runAction(Number(button.dataset.action))));
    this.shadowRoot.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => window.location.assign(`${this.config.base_path || "/vie-sauvage-starter"}/${button.dataset.go}`)));
  }
}

if (!customElements.get("my-home-media-board")) customElements.define("my-home-media-board", MyHomeMediaBoard);
})();
