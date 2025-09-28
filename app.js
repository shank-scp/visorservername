const $ = q => document.querySelector(q);

/* Elements */
const input = $("#input");
const preview = $("#preview");
const previewWrap = $("#previewWrap");

const langSelect = $("#langSelect");
const langBtn = $("#langBtn");
const langMenu = $("#langMenu");
const langFlag = $("#langFlag");
const langText = $("#langText");

const varMinutes = $("#var_minutes");
const varSeconds = $("#var_seconds");
const teamInputs = [$("#team_0"), $("#team_1"), $("#team_2"), $("#team_3"), $("#team_4")];

/* i18n texts */
const texts = {
  en: {
    title: "SCP:SL Title Preview (Server List)",
    input: "Server Name",
    minutes: "round_duration_minutes",
    seconds: "round_duration_seconds",
    t0: "alive_team,0 (SCPs)",
    t1: "alive_team,1 (NTF)",
    t2: "alive_team,2 (Chaos)",
    t3: "alive_team,3 (Scientists)",
    t4: "alive_team,4 (Class D)",
    preview: "Preview",
    hint: "Render matches the in-game server list column.",
    note: "",
    flag: "",
    name: "English",
    placeholder:
      "Your server name"
  },
  es: {
    title: "Vista previa de títulos SCP:SL (Lista de Servidores)",
    input: "Titulo del Servidor",
    minutes: "round_duration_minutes (minutos)",
    seconds: "round_duration_seconds (segundos)",
    t0: "alive_team,0 (SCPs)",
    t1: "alive_team,1 (NTF)",
    t2: "alive_team,2 (Caos)",
    t3: "alive_team,3 (Científicos)",
    t4: "alive_team,4 (Clase D)",
    preview: "Vista previa",
    hint: "El render coincide con la columna de la lista del juego.",
    note: "",
    flag: "",
    name: "Spanish",
    placeholder:
      "El titulo de tu servidor"
  }
};

let lang = localStorage.getItem("lang") || "en";

/* Apply language to UI */
function applyLang(){
  const t = texts[lang];
  document.documentElement.setAttribute("lang", lang);
  $("#title").textContent = t.title;
  $("#lblInput").textContent = t.input;
  $("#lblMinutes").childNodes[0].nodeValue = t.minutes + " ";
  $("#lblSeconds").childNodes[0].nodeValue = t.seconds + " ";
  $("#lblTeam0").childNodes[0].nodeValue = t.t0 + " ";
  $("#lblTeam1").childNodes[0].nodeValue = t.t1 + " ";
  $("#lblTeam2").childNodes[0].nodeValue = t.t2 + " ";
  $("#lblTeam3").childNodes[0].nodeValue = t.t3 + " ";
  $("#lblTeam4").childNodes[0].nodeValue = t.t4 + " ";
  $("#previewTitle").textContent = t.preview;
  $("#hint").textContent = t.hint;
  $("#note").textContent = t.note;

  langFlag.textContent = t.flag;
  langText.textContent = t.name;
  input.setAttribute("placeholder", t.placeholder);

  // marcar opción activa en el menú
  [...langMenu.querySelectorAll(".lang-option")].forEach(li=>{
    const selected = li.getAttribute("data-lang") === lang;
    li.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

/* Menu open/close (robusto) */
function openMenu(){
  langMenu.classList.add("open");
  langBtn.setAttribute("aria-expanded", "true");
  langMenu.focus();
}
function closeMenu(){
  langMenu.classList.remove("open");
  langBtn.setAttribute("aria-expanded", "false");
}

langBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  const isOpen = langMenu.classList.contains("open");
  isOpen ? closeMenu() : openMenu();
});
langMenu.addEventListener("click", e=> e.stopPropagation());
document.addEventListener("click", ()=> closeMenu());
document.addEventListener("keydown", (e)=>{
  if (e.key === "Escape") closeMenu();
});

/* Keyboard nav inside menu */
langMenu.addEventListener("keydown", (e)=>{
  const items = [...langMenu.querySelectorAll(".lang-option")];
  let idx = items.findIndex(el => el === document.activeElement);
  if (e.key === "ArrowDown"){
    e.preventDefault();
    (items[idx+1] || items[0]).focus();
  } else if (e.key === "ArrowUp"){
    e.preventDefault();
    (items[idx-1] || items[items.length-1]).focus();
  } else if (e.key === "Enter"){
    document.activeElement.click();
  }
});

/* Select language */
[...langMenu.querySelectorAll(".lang-option")].forEach(li=>{
  li.setAttribute("tabindex","0");
  li.addEventListener("click", ()=>{
    const chosen = li.getAttribute("data-lang");
    if (chosen && chosen !== lang){
      lang = chosen;
      localStorage.setItem("lang", lang);
      applyLang();
      render();
    }
    closeMenu();
  });
});

/* TMP-like mapping (fixed profile) */
const SIZE_FACTOR = 0.265;  // Unity <size=N> → px ≈ N * factor
const SIZE_MIN_PX = 11;
const SIZE_MAX_PX = 21;     // cap main line

/* Re-render on input */
[input, varMinutes, varSeconds, ...teamInputs].forEach(el => el.addEventListener("input", render));

function render(){
  let raw = input.value ?? "";

  // Replace placeholders
  const mins = pad2(clampInt(+varMinutes.value, 0, 999));
  const secs = pad2(clampInt(+varSeconds.value, 0, 59));
  const teams = teamInputs.map(i => clampInt(+i.value, 0, 999));

  raw = raw
    .replaceAll("{round_duration_minutes}", mins)
    .replaceAll("{round_duration_seconds}", secs)
    .replace(/\{alive_team\s*,\s*([0-4])\}/g, (_, idx) => String(teams[+idx]));

  // Convert "\n" to real newlines; preserve spaces exactly
  raw = raw.replaceAll("\\n", "\n");

  // Parse Unity tags safely to HTML
  let s = raw;
  s = s.replace(/<\s*b\s*>/gi, "__B_OPEN__")
       .replace(/<\s*\/\s*b\s*>/gi, "__B_CLOSE__")
       .replace(/<\s*i\s*>/gi, "__I_OPEN__")
       .replace(/<\s*\/\s*i\s*>/gi, "__I_CLOSE__");

  s = s.replace(/<\s*size\s*=\s*(\d+)\s*>/gi, (_, n)=>{
    const px = clampInt(Math.round(+n * SIZE_FACTOR), SIZE_MIN_PX, SIZE_MAX_PX);
    return `__SIZE_OPEN__${px}__`;
  });
  s = s.replace(/<\s*\/\s*size\s*>/gi, "__SIZE_CLOSE__");

  s = s.replace(/<\s*color\s*=\s*#([0-9a-fA-F]{3,8})\s*>/g, (_, hex)=>`__COLOR_OPEN__#${hex}__`)
       .replace(/<\s*color\s*=\s*(white|black|red|green|blue|yellow|cyan|magenta)\s*>/gi,
         (_, named)=>`__COLOR_OPEN__${named.toLowerCase()}__`)
       .replace(/<\s*\/\s*color\s*>/gi, "__COLOR_CLOSE__");

  s = escapeHtml(s)
        .replaceAll("__B_OPEN__","<b>").replaceAll("__B_CLOSE__","</b>")
        .replaceAll("__I_OPEN__","<i>").replaceAll("__I_CLOSE__","</i>")
        .replace(/__SIZE_OPEN__(\d+)__/g, (_,px)=>`<span style="font-size:${+px}px;">`)
        .replaceAll("__SIZE_CLOSE__","</span>")
        .replace(/__COLOR_OPEN__([^_]+)__/g, (_,c)=>`<span style="color:${cssColor(c)};">`)
        .replaceAll("__COLOR_CLOSE__","</span>");

  // Render lines; autoscale each to container width (612px desktop; 100% mobile)
  const lines = s.split("\n").map(l => l==="" ? "&nbsp;" : l);
  preview.innerHTML = lines.map(l=>`<div class="line">${l}</div>`).join("");

  const target = Math.max(10, $("#previewWrap").clientWidth - 2);
  [...preview.querySelectorAll(".line")].forEach(el=>{
    el.style.transform = "none";
    const w = el.scrollWidth;
    const scale = w > target ? (target / w) : 1;
    el.style.transform = `scale(${scale})`;
  });
}

/* Utils */
function pad2(n){return n.toString().padStart(2,"0")}
function clampInt(n,min,max){ if(Number.isNaN(n)) return min; return Math.max(min, Math.min(max,n)); }
function escapeHtml(str){ return str.replaceAll(/&/g,"&amp;").replaceAll(/</g,"&lt;").replaceAll(/>/g,"&gt;"); }
function cssColor(c){
  if(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(c)) return c;
  const named = new Set(["white","black","red","green","blue","yellow","cyan","magenta"]);
  return named.has(c) ? c : "#ffffff";
}

/* Init */
applyLang();
render();
