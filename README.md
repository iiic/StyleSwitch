# StyleSwitch

Přepínač různých CSS stylů na webových stránkách.

Použité technologie: ( **@todo : tohle dát asi na konec** )
Alternative style sheets ( https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/alternate_stylesheet ) ( https://html.spec.whatwg.org/multipage/links.html#rel-alternate )
Cookie Store API https://developer.mozilla.org/en-US/docs/Web/API/CookieChangeEvent
Prefers color scheme (https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme)

Přepínačů stylů stránky typu "světlý / tmavý vzhled" je plno, proč dělat další?

No tak začněme chronologicky, první přišel *Alternative style sheets* ( https://html.spec.whatwg.org/multipage/links.html#rel-alternate ) který je podporován všemi prohlížeči, ovšem pouze Firefox má na tohle přepínač, kdy přímo v prohlížeči mám možnost styl přepnout (pokud máte Firefox, jde to pomocí <kbd>ALT</kbd> > `Zobrazit` > `Styl stránky` (poud máte anglické rozhraní tak <kbd>ALT</kbd> > `View` > `Page Style`)). Zápis v html pak vypadá například takto:

```html
<link rel="stylesheet" href="./css/light.css" fetchpriority="high"><!-- persistent -->
<link rel="stylesheet" href="./css/dark.css" title="tmavý styl"><!-- preferred -->
<link rel="alternate stylesheet" href="./css/alternate.css" title="alternativní styl" fetchpriority="low"><!-- alternate -->
```

Příklad je doplněn o moderní `fetchpriority` atributy, ale dost tu pomůžou, protože "persistent" styly se načítají vždy a vždy jsou potřeba, naopak "alternate" se vůbec nepoužijí (pokud nemáte Firefox a nepoužijete integrovaný přepínač, nebo pokud neuděláte nějakou magii v javascriptu, k tomu se dostaneme později), takže stačí `fetchpriority="low"`. Stahují se všechny styly, dokonce i ty, které se nepoužijí "alternate" a tak. Je tedy lepší mít 1 soubor "persistent" a v ostatních ho upravovat. Než více samostatných souborů ve kterých budou veškeré styly. Čistě z důvodu úspory dat… není nutné aby uživatel stahoval zbytečně data i dnes v době rychlého internetu a neomezených dat, i tak je lepší šetřit.

A tohle jednoduché řešení je dostatečné na přepínání stylů ve Firefoxu, podpora jednoho jediného prohlížeče ale není poslední problém na který narazíte. Další nevýhodou je že při přechodu na jinou stránku se nějak neukládá jaký styl byl zvolený a znovu se načte ten výchozí. Ve zkratce, tohle řešení je samo o sobě prakticky nepoužitelné, bude potřeba pokračovat.

Druhá možnost jak přepínat styly přišla s *Media Queries Level 5*, *Prefers color scheme*  ( https://drafts.csswg.org/mediaqueries-5/#prefers-color-scheme ). A velice příjemná a snadná možnost. V zásadě bere hodnotu z operačního systému, jestli je použit tmavý nebo světlý režim, tuhle hodnotu předává prohlížeči a ten na základě toho použije tmavý nebo světlý režim a nakonec prohlížeč tuhle hodnotu předá stránce a ta podle ní udělá nějakou magii. Pozor ale na to, že v prohlížeči se dá změnit styl rozdílně od operačního systému. Změna stylu v OS pak není poděděná prohlížečem a ten nepředá změnu stránce. Nicméně výchozí nastavení je podědění barevného stylu z OS.
Potenciálních využití je více, ale v příkladu uvedu jednoduchou a celkem snadno spravovatelnou možnost:
federace

```html
<link rel="stylesheet" href="./css/light.css" fetchpriority="high"><!-- persistent -->
<link rel="stylesheet" href="./css/dark.css" title="tmavý styl" media="(prefers-color-scheme: dark)"><!-- preferred -->
```

Příklad v praxi funguje takto, styl `./css/light.css` se stáhne a použije vždy, druhý styl `./css/dark.css` se pak použije pouze v případě splněné podmínky uvedené v media, tedy nastavený tmavý styl. A v jednotlivých souborech ideálně využijete proměnné. Soubor `light.css`:

```css
:root {
 --color-accent: #118bee15;
 --color-secondary-accent: #920de90b;
 /* … a další  */
}

article aside {
 background: var(--color-secondary-accent);
 /* … a další  */
}

/* … a tak dále, veškeré css pravidla zde */
```

a soubor dark.css:

```css
:root {
 --color-accent: #0097fc4f;
 --color-secondary-accent: #e20de94f;
 /* … a další  */
}
/* konec souboru, nic více než root tu není potřeba */
```

V tomto případě budou mít proměnné z root druhého souboru (`./css/dark.css`) přednost před proměnnými z prvního souboru a tak jednoduše jste dosáhli jiných barev pro tmavý režim stránek. Jak jsme již zmiňoval, je mnoho způsobů, jak `prefers-color-scheme` použít. Já si oblíbil tento, je velice jednoduchý, nemá tolik redundantních dat, a hodnoty pro tmavý styl jsou uložené ve vlastním souboru. V mém příkladu je výchozí styl světlý a volitelný tmavý, pochopitelně to jde i opačně. Není potřeba nikam ukládat zvolenou hodnotu, uživatel se rozhodne o tom, jestli chce světlý, nebo tmavý styl už svým nastavením operačního systému. No a s tím přichází i ten spojený problém.

### Co v hypotetickém scénáři, kdy uživatel chce mít nastavenou jinou barvu ve svém OS a jinou na webu?

Pak už je potřeba uživatelovu volbu uložit a tato uložená volba musí mít přednost před vyhodnocením výrazu `media="(prefers-color-scheme: …)"`. Typicky se používá cookie, dokonce je možné takovouto provozní cookie uložit i když nemáte souhlas uživatele s ukládáním marketingových a analytických cookie, protože taková cookie nemůže sloužit ke sledování uživatele. Samozřejmě když všechno uděláte dobře, není možné použít session, není možné použít žádné náhodné data v názvu ani obsahu, všechno transparentně aby bylo zřejmé že není možné obsah použít ke sledování uživatele.

A v případě že je pak nějaká cookie aktivní, třeba je v ní uvedené že uživatel chce tmavý styl, je potřeba tmavý styl povolit a nebrat přitom ohled na hodnotu `media="(prefers-color-scheme: …)"`, tedy tento atribut musí pryč. Stejně tak ale i atribut title, to je důležité, tím se "preferred" styl změní na "persistent" a stahuje se vždy, tím že je v kódu umístěn po stylu light, bude mít vždy přednost a vždy bude výsledkem tmavý vzhled stránek.
Nebylo by potřeba odebírat naprosto nic, pokud by se vyhodnocením výrazu vyhodnotil `media="(prefers-color-scheme: …)"` jako splněný, jenže to bych už musel detekovat jestli se tak stane nebo ne. Na úrovni serverové to nejde a na úrovni klienta už může být pozdě, respektive dá se udělat javascriptem, ale rychlejší a snazší je nic nezjišťovat a atributy media a title odebrat vždy.

### Tak a teď to zkombinovat… použití *Alternative style sheets* a *Prefers color scheme* dohromady, dá se to?

Ano dá se to, jen to chce jeden drobný přídavek. Ukážu na kódu:

```html
<link rel="stylesheet" href="./css/light.css" fetchpriority="high"><!-- persistent -->
<link rel="stylesheet" href="./css/dark.css" title="tmavý styl" media="(prefers-color-scheme: dark)"><!-- preferred -->
<link rel="alternate stylesheet" href="./css/alternate.css" title="alternativní styl" fetchpriority="low"><!-- alternate -->
<link rel="alternate stylesheet" href="./css/light.css" title="hlavní světlý styl"><!-- alternate -->
```

Můžete si povšimnout že takto vznikla duplicita, světlý styl `./css/light.css` je zapsán 2x. Jednou jako "persistent", podruhé jako "alternate" s atributem `title` ve kterém je uvedeno to, co bude ve Firefoxu v dropdown menu pod `Zobrazit` > `Styl stránky` (postup popsán výše). Tohle existuje **pouze** kvůli přepínači stylů v kontextové nabídce Firefoxu, a tím že se jedná o možnost která je pouze pro uživatele Firefoxu a pouze pro ty kteří o ní vědí a používají ji … jde tedy o funkci pro zlomky [‰](## "Znak promile: tedy tisícina celku"), proč je vůbec řešíme? No mimo Firefox je tohle chování součástí standardu, a přeci jen nejde o příliš velké obtíže které si touto duplicitou způsobíte. Soubor se znovu nestahuje, nebo něco takového, jde tedy jen o několik desítek [bajt](## "text")ů přenášených dat. Pokud navíc používáte kompresi na úrovni http (`content-encoding: gzip`) snížíte množství duplicitně přenášených dat na úroveň jednotek [bajt](## "text")ů. Vlastně jen ten obsah atributu `title`. Není to nic hrozného a těm 6 uživatelům na světě co to používají to rád dopřeji :) .

Ale to hlavní… teď máme **funkční** kombinaci *Alternative style sheets* a *Prefers color scheme*, bez žádných složitých javascript polyfillů či pluginů do prohlížeče. Tmavý a světlý styl se přepínají automaticky podle nastavení operačního systému a současně je ve Firefoxu možné styly přepínat ručně z kontextové nabídky prohlížeče.

### A nakonec… přepínač.

Firefox umí styly přepnout, ale neumí uchovat zvolenou hodnotu při přechodu mezi různými stránkami. Operační systém umí volbu přepnout, ale podporuje jen 2 volby, světlý a tmavý styl. Taktéž pomocí OS není možné mít jiný barevný styl pro stránku a jiný pro OS samotný. Tohle už chce přepínač jako nějaký prvek webové stránky. Dá se udělat přepínač jako formulář co zašle hodnotu do backendu kde serverový script změní styl stránky, ale vyžaduje to reload stránky. Proto raději volím javascript řešení, které umožní přebarvit stránku bez nutnosti reloadu (přenačtení) stránky.

## Proto vznikl **StyleSwitch**

Script schopný:
1. Načíst si automaticky styly v dokumentu
2. Sestavit z nich formulářový prvek sloužící k přepínání různých stylů.
3. Nastavit výchozí hodnotu podle zvoleného stylu včetně listeneru měnícího živě zvolenou volbu ve formulářovém prvku podle nastavení OS i podle cookie i její hodnoty
4. Při zvolení formulářovým prvkem nastaví hodnotu v cookie.
5. Volitelný listener na příslušnou cookie umožňující živě přepnout styl na zvolený. (Je v samostatném javascriptu, není nutné to použít, pokud preferujete řešení pomocí backend strany a nějakého serverového scriptu)

Zmiňuji cookie, tak si ji popišme:
Výchozí jméno cookie je `stylesheets` a je ukládána na rok (tohle všechno se dá změnit v nastavení, jak jméno cookie, tak doba po kterou je uchovávána). Uvnitř cookie je json, který má takovouto jsDoc anotaci:

```javascript
/** @type {Object.<string, {disabled: boolean, byNakedDay?: boolean}>} */
```

kde se následně Object převede na JSON text objekt, ten s konkrétními hodnotami může vypadat například takto:

```json
{
	"./example-css/dark.css": { "disabled": false },
	"./example-css/light.css": { "disabled": true },
	"./example-css/alternate.css": { "disabled": true }
}
```

Tedy jsou tam cesty k souboru, zapsané přesně tak jak jsou uvedeny v html dokumentu (tedy script nepřevádí cesty na absolutní, relativní, či jakkoliv, zůstanou tak, jak jsou v `href` atributu elementu `link`).
A co to znamená je celkem zřejmé, `disabled` je tu použito stejně jako kdyby šlo o atribut `disabled` na elementu `link`. Tedy true znamená disabled a styl se **ne**aplikuje a opačně `disabled: false` znamená že styl je aktivní a použije se.

případně:
```json
{
	"": { "disabled": false, "byNakedDay": true },
	"./example-css/dark.css": { "disabled": true }
}
```

Což je speciální případ cookie říkající že jsou všechny styly stránky vypnuté a stránka se zobrazuje bez CSS. A automaticky se tohle vypne po skončení eventu [Css Naked Day](https://css-naked-day.org/), tedy 9. dubna každého roku. Tohle je ve StyleSwitch ve výchozím stavu vypnuté, pokud to ručně nezapnete, nemusíte tuhle část vůbec řešit. Pokud to ale chcete zapnout a nechat si automaticky vypínat všechny CSS soubory a 9. dubna předvést svůj web nahý, dá se to zapnout pomocí volby:

```javascript
nakedStyle: {
	use: true,
	celebrateNakedDay: {
		switchAutomatically: true
	}
},
```

pojďme se nyní podívat na to, jak takové nastavení knihovny StyleSwitch udělat konkrétně:

### Jak nastavit StyleSwitch?

Existují 2 možnosti, pro obě platí to shodné, že vyplňujete jen ty části nastavení, které chcete změnit, pokud je nezmíníte použijí se ty z výchozího nastavení. Jaké je výchozí nastavení zjistíte ze statické read-only metody `StyleSwitch.DEFAULT_SETTINGS`. Pro jistotu ještě zdůrazním že v této proměnné je výchozí nastavení, ne aktuální nastavení pro instanci.

#### 1. Nastavení přes json element.

Co jaký json element? To je zjednodušené označení pro `script type="application/json"`, případně `script type="text/json"` (přestože tento zápis je označen jako zastaralý (deprecated), zatím stále funguje). Důležité je vědět že `script type="application/json"` je prohlížečem vyhodnocován jako běžný text, ne jako `script`! To znamená že se nezastavuje vykreslování stránky dokud se script neprovede, naopak na vykreslování stránky to nemá žádný vliv.

Důležitý je tady atribut `id` s hodnotou "style-switch-settings". Element s tímto `id` je hledaný scriptem. Tím že script samotný je modul (atribut `type="module"`) je jedno, kde ve stránce bude json element umístěn, tedy jestli třeba v hlavičce stránky, na konci html body, úplně jedno.

příklad:
```html
<script type="application/json" id="style-switch-settings">
{
	"nakedStyle": {
		"use": true
	},
	"texts": {
		"caption": "Chose a style for website"
	}
}
</script>
<script src="./style-switch.mjs?v=1.0" type="module" crossorigin="anonymous" integrity="sha256-n06EtXgbhG4A71ozlM7XoNLcHk08TfttEMDpmLjiEM8="></script>
```
(V tomto případu umožňuji stránku bez css jako jeden z možných stylů, a přepisuji nadpis widgetu, ostatní nastavení zůstane v defaultu, tak jak je patrné z `StyleSwitch.DEFAULT_SETTINGS`)

#### 2. Inject nastavení skrz http GET parametr.

Druhou možností je vložení do http GET parametru jménem `settings`. (Zjistit název použitého parametru je možné ze statické read-only metody `StyleSwitch.SETTINGS_URL_PARAMETER`). Hodnota musí být `escape`ovaná pomocí `json`u. Například javascriptovou metodou `JSON.stringify()`.

Důležitá je návratová hodnota v proměnné `result`. V této proměnné je buďto `null` (pokud se nevytvořil widget… například když stránka neobsahuje žádné styly), nebo `HTMLElement`, ten je pak možné vložit do libovolné části stránky, jak ukazuje příklad níže. Funkce je asynchronní, takže si na result musíte počkat, buďto `await` ( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await ) nebo `Promise` ( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise )

příklad:
```html
<script type="module">
	const { StyleSwitch, result } = await import( './style-switch.mjs?v=1.0&settings=' + JSON.stringify( {
		nakedStyle: {
			use: true,
		},
		texts: {
			caption: 'StyleSwitch caption',
		},
		resultSnippetAppearance: {
			outputFormat: 'select',
			reverseOrder: true,
			switch: {
				useSwitchIfPossible: true,
			}
		}
	} ) );

	/** @type {HTMLElement|null} */
	const customStyleSwitchElement = document.getElementById( 'custom-style-switch' );

	if ( customStyleSwitchElement && result && result instanceof HTMLElement )
	{
		customStyleSwitchElement.appendChild( result );
	}
</script>
```
(Nastavení podobné jako v předchozím případě, navíc nějaké změny ve zobrazení vzhledu widgetu… konkrétně, že se použije swap (`input type="checkbox"`) pokud jsou jen 2 styly mezi kterými je možné přepínat, jinak select.)

Možnost 1 je o něco málo méně náročná na systémové prostředky, ale rozdíl je minimální. Obě možnosti nastavení scriptu není možné vzájemně kombinovat, zvolte si jednu, nebo druhou.

### Podrobně možná nastavení:

#### `styleLinksQSA`
(`string`) Hodnota pro `document.querySelectorAll()` pomocí které se načtou styly. Pravděpodobně nebudete potřebovat jakkoliv měnit výchozí nastavení.

#### `rootElementQS`
(`string`) Hodnota pro `document.querySelector()`, element do kterého se nakonec vloží výsledný widget vytvořený tímto scriptem.

#### `cookie`
(`object`) Nastavení cookie, která se použije pro uložení uživatelem zvoleného stylu stránek.

#### `texts`
(`object`) Veškeré textové popisky widgetu.

#### `nakedStyle`
(`object`) Kterým je možné přidat jako jeden z použitelných stylů vzhledu stránky i styl bez css, takzvaný naked. Podrobnosti objektu jsou tyto:
- (`bool`) `use` použít / nepoužít naked style.
- (`object`) `celebrateNakedDay`:
  - (`bool`) `switchAutomatically` automaticky zapínat a pak vypínat naked style v konkrétní datum zadané následujícími čísly
  - (`number`) `monthNumber` číslo měsíce ve kterém je naked day (měsíce začínají číslem 0, tedy měsíc leden je 0)
  - (`number`) `dayNumber` číslo dne v měsíci.

#### `resultSnippetAppearance`
(`object`) Veškeré nastavení vzhledu i chování výsledného widgetu který tento script vytvoří a vrátí v proměnné (`object`) `return`. Podrobnosti objektu jsou tyto:
- (`string`) `idPrefix` prefix `id` výsledného widgetu. Bude doplněn náhodným řetězcem, aby bylo vytvořeno unikátní id a widget mohl být případně v dokumentu vícekrát, pokud by bylo potřeba.
- (`string`) `defaultResultSnippetElement` typ elementu který bude obalovat výsledný widget.
- (`string`) `outputFormat` Seznam možných formulářových prvků, které script vytvoří jako výsledek. Tento seznam můžete získat ze statické read-only metody `StyleSwitch.OUTPUT_FORMATS`, možnosti jsou:
  - `switch` (input type checkbox), možný pouze pokud máte přesně 2 možné vzhledy. Například tmavý a světlý.
  - `select` (výchozí nastavení)
  - `radioList` … seznam input type radio položek
- (`string`) `preferredColorSchemeChangeBehavior` výchozí chování widgetu při změně barevného schématu operačního systému. Widget může dynamicky měnit styl stránky okamžitě při změně této hodnoty v OS, ovšem pokud je tohle žádoucí. Například když už si uživatel svůj styl stránky zvolil, nejspíše by o změnu jím zvolené hodnoty nestál. Proto výchozí chování je měnit dynamicky pouze pokud není cookie a tedy uživatel si styl stránky nezvolil. Všechny možnosti lze získat ze statické read-only metody `StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR`. Jsou to:
  -
  -
