# AGENTS.md

## What this project is
Make native `console.log()` (and other console methods) proxied and filtered by text string.

## Architecture & Key Paths
- `consoleFilter.globals.d.ts`, interface with all types and annotations for script. This will help your editor (or your AI agent) to understand the script, know what each method does, what the input parameters are, what data types the variables have, ... However, it is not needed for the script to function properly. If you delete the file, everything will work as before (just your IDE or AI agent may not work as well as it could).
- `consoleFilter.spec.mjs`, Unit tests for main script. It is not needed for the script's functionality itself. If you delete this file, nothing will happen, everything will work. For programmers or AI agents, however, unit tests will help to find out if their changes broke something.
- `modules/ictest.mjs`, Tests runtime. Used **only** for the above mentioned unit test file. Not needed for the script itself.
- `tests-runner.html` HTML file used for run tests in Browser. It is also not needed for the script itself.
- `package.json` command for NPM ( [npm.js](https://www.npmjs.com/) ) catalog.
- `ADENTS.md` commands for AI agents, description how to work with this repository. Something like Readme for AI.
- `README.md` class description in Markdown.

## Full Offline support:
This project has all files here in repository, and not communicate with any another online servers / files / urls,
there are no ADs in here, not sending data throw analytics or something like that.

## Code style
- Clear Javascript but with TypeScript annotations
- Interface with annotation place as much as possible in .globals.d.ts file
- Always declare parameter and return types. Into corresponding .globals.d.ts file
- Use functional patterns where possible
- Single quotes, no semicolons
- Use discriminated unions for complex state
- **Comment length**: Try to use max 120 characters per line

## Javascript & TypeScript
- Bool returning functions should start with the prefix `is` or `has`
- Try not to use regular expressions if possible, replace them with a combination of several consecutive methods for working with strings or polys. Code clarity in this regard is not so important if it helps to avoid a regular expression.
- If it can be done otherwise, do not nest one function inside another.
- For asynchronicity, prefer `await` over `.then()`, if possible
- Prefer `Object.hasOwn()` over `hasOwnProperty()`
- Do not use the global `isNaN()` function, but only the analogue `Number.isNaN()`.
- When using the `parseInt()` function, always fill in the second parameter.
- Do not use `==` and `!=` for comparison, always use `===` and `!==` instead
- Use `structuredClone(obj)` to create a copy of an object
- Never use the `var` and `arguments.callee` keywords
- Use the "Google TypeScript Style Guide" for naming anything in JavaScript or TypeScript ( https://google.github.io/styleguide/tsguide.html )
- Prefer explicit types over `any`
- **NEVER** convert `.js` files to `.ts` files.
- Always use strict mode (`"use strict";`)
- Never use those functions:
  - `AudioProcessingEvent`
  - `BaseAudioContext: createScriptProcessor()`
  - `Date.prototype.getYear()`
  - `Date.prototype.setYear()`
  - `Date.prototype.toGMTString()`
  - `document.alinkColor`
  - `document.all`
  - `document.anchors`
  - `document.applets`
  - `document.bgColor`
  - `document.cookie`
  - `document.domain`
  - `document.featurePolicy`
  - `document.fgColor`
  - `document.fullscreen`
  - `document.lastStyleSheetSet`
  - `document.linkColor`
  - `document.preferredStyleSheetSet`
  - `document.rootElement`
  - `document.selectedStyleSheetSet`
  - `document.styleSheetSets`
  - `document.vlinkColor`
  - `document.xmlEncoding`
  - `document.xmlVersion`
  - `document.clear()`
  - `document.close()`
  - `document.createEvent()`
  - `document.createNSResolver()`
  - `document.createTouch()`
  - `document.createTouchList()`
  - `document.enableStyleSheetsForSet()`
  - `document.execCommand()`
  - `document.open()`
  - `document.queryCommandEnabled()`
  - `document.queryCommandState()`
  - `document.queryCommandSupported()`
  - `document.requestStorageAccessFor()`
  - `document.write()`
  - `document.writeln()`
  - `.onafterscriptexecute` and `.addEventListener("afterscriptexecute", /*…*/)`
  - `.onbeforescriptexecute` and `.addEventListener("beforescriptexecute", /*…*/)`
  - `.onbeforeunload` and `.addEventListener("onbeforeunload", /*…*/)`
  - `DOMError`
  - `XSLTProcessor`
  - `escape()`
  - `unescape()`
  - `eval()`
  - `uneval()`
  - `InternalError()`
  - `Function.prototype.arguments()`
  - `Function.prototype.caller()`
  - `location.reload()`
  - `RegExp.input()`
  - `RegExp.lastMatch()`
  - `RegExp.lastParen()`
  - `RegExp.leftContext()`
  - `RegExp.rightContext()`
  - `RegExp.prototype.compile()`
  - `String.prototype.anchor()`
  - `String.prototype.big()`
  - `String.prototype.blink()`
  - `String.prototype.bold()`
  - `String.prototype.fixed()`
  - `String.prototype.fontcolor()`
  - `String.prototype.fontsize()`
  - `String.prototype.italics()`
  - `String.prototype.link()`
  - `String.prototype.substr()`
  - `String.prototype.strike()`
  - `String.prototype.small()`
  - `String.prototype.sub()`
  - `String.prototype.sup()`
  - `Object.prototype.__defineGetter__()`
  - `Object.prototype.__defineSetter__()`
  - `Object.prototype.__lookupGetter__()`
  - `Object.prototype.__lookupSetter__()`
  - `Object.prototype.__proto__`
  - `Object.prototype.constructor`
  - `Object.prototype.hasOwnProperty()`
  - `Object.prototype.isPrototypeOf()`
  - `with()`

## HTML
- For individual HTML elements, write the attributes in the following order::
  - Preferred attributes in the order `src`, `href`, `type`, `id` (if any).
  - Required attributes (for the given element) in alphabetical order.
  - Optional attributes in alphabetical order.
- Describe using microformats ( https://microformats.org/ ), only class names, not json. And microdata throw schema.org ( no RDFa, no JSON-LD, only microdata attributes `itemscope`, `itemtype`, `itemprop`, … )
- Try to use as few html elements as possible
- Values in the `class` attribute should never describe appearance or position
- Values in the `id` attribute, in the case of multi-word text, should separate individual words with a hyphen (`-`)
- Each heading of type `h1` - `h4` should have its `id` attribute corresponding to the text content of the heading without diacritics and special characters
- Use new / experimental html elements, such as:
  - `dialog` (only as a WAI-ARIA accessible snippet - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ )
  - `inert`
  - `datalist`
  - `search`
- Images are written as a snippet:
``` html
<figure>
	<picture itemscope itemtype="https://schema.org/ImageObject" class="u-photo">
		<source media="(min-width: 600px)" srcset="image_100x100.jpg">
		<source media="(min-width: 1024px)" srcset="image_300x300.jpg">
		<img itemprop="image thumbnailUrl" src="image.png" alt="short alternative text" width="" crossorigin="anonymous" aria-describedby="graph-details">
	</picture>
	<figcaption id="graph-details">
		long text caption
	</figcaption>
</figure>
```
- Never use these elements (neither in HTML nor in JavaScript):
	- `acronym`
	- `applet`
	- `basefont`
	- `bgsound`
	- `big`
	- `blink`
	- `center`
	- `comment`
	- `content`
	- `dir`
	- `font`
	- `frame`
	- `frameset`
	- `noframes`
	- `hgroup`
	- `image`
	- `isindex`
	- `listing`
	- `marquee`
	- `noindex`
	- `plaintext`
	- `shadow`
	- `strike`
	- `tt`
	- `xmp`
	- `spacer`
	- `nobr`
	- `multicol`
	- `nextid`
	- `noembed`
	- `keygen`
	- `menuitem`
	- `rb`
	- `rtc`

## CSS
- Try to use the asterisk character `*` and the keyword `!important` as little as possible
- Try to keep selectors as short as possible, `#module-id div a` is better than `body main section div a`
