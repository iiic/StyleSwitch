if ( typeof process !== 'undefined' && process.versions?.node ) { // If this is an npm console command
	const { JSDOM } = await import( 'jsdom' );
	const { default: cssEscape } = await import( 'css.escape' );
	const dom = new JSDOM( '<!doctype html><html><head></head><body></body></html>', {
		url: 'http://localhost/'
	} );
	const browserGlobals = [
		'window',
		'document',
		'HTMLElement',
		'HTMLLinkElement',
		'HTMLOptionElement',
		'HTMLInputElement',
		'HTMLSelectElement',
		'HTMLUListElement',
		'HTMLScriptElement',
		'Event',
		'Node'
	];
	const globalObject = /** @type {Record<string, unknown>} */ ( globalThis );
	const windowObject = /** @type {Record<string, unknown>} */ ( dom.window );
	for ( const globalName of browserGlobals ) {
		globalObject[ globalName ] = windowObject[ globalName ];
	}
	globalThis.CSS = /** @type {typeof CSS} */ ( { escape: cssEscape } );
	dom.window.CSS = globalThis.CSS;

	const cookies = new Map();
	const cookieStore = {
		onchange: null,
		async get ( /** @type {string | {name: string}} */ name )
		{
			const value = cookies.get( typeof name === 'string' ? name : name.name );
			return value ? { name: value.name, value: value.value } : null;
		},
		async getAll ()
		{
			return [ ...cookies.values() ];
		},
		async set ( /** @type {{name: string, value: string}} */ cookie )
		{
			cookies.set( cookie.name, cookie );
		},
		async delete ( /** @type {string | {name: string}} */ cookie )
		{
			cookies.delete( typeof cookie === 'string' ? cookie : cookie.name );
		},
		addEventListener () { },
		removeEventListener () { },
		dispatchEvent () { return true; }
	};
	globalThis.cookieStore = /** @type {typeof globalThis.cookieStore} */ ( /** @type {unknown} */ ( cookieStore ) );
	Object.defineProperty( dom.window, 'cookieStore', {
		configurable: true,
		value: cookieStore,
		writable: true,
	} );
	dom.window.matchMedia = ( query ) => ( {
		media: query,
		matches: false,
		onchange: null,
		addListener () { },
		removeListener () { },
		addEventListener () { },
		removeEventListener () { },
		dispatchEvent () { return true; }
	} );
}

const { StyleSwitch, result } = /** @type {typeof import('./style-switch.mjs')} */ ( await import( './style-switch.mjs?v=1.4&settings=' + JSON.stringify( {
	autoRun: false,
} ) ) );
const { applySettings, clearSettings, group, groupClosed, it, assert, beforeEach, afterEach, not, toBeNullOr, equal, toBeDefined, toBeInstanceOf } = /** @type {typeof import('./modules/ictest.mjs')} */ ( await import( './modules/ictest.mjs?v=1.0&settings=' + JSON.stringify( {
	nastaveni: {
		a: true,
	},
} ) ) );

await group( 'Static tests', async () =>
{

	await it( 'StyleSheet should have DEFAULT_SETTINGS defined as Object', async () =>
	{
		assert( StyleSwitch.DEFAULT_SETTINGS ).toBeDefined();
		assert( StyleSwitch.DEFAULT_SETTINGS ).toBeInstanceOf( Object );
	} );

	await groupClosed( 'StyleSwitch.DEFAULT_SETTINGS should be read only', async () =>
	{

		await it( 'Property DEFAULT_SETTINGS should be read only', async () =>
		{
			assert( StyleSwitch ).hasReadOnlyProperty( 'DEFAULT_SETTINGS' );
		} );

		await it( 'Try to set new value and read if it\'s not set', async () =>
		{
			const propertyName = 'bad value should not be saved';
			StyleSwitch.DEFAULT_SETTINGS.rootElementQS = propertyName;
			assert( StyleSwitch.DEFAULT_SETTINGS.rootElementQS ).not.equal( propertyName );
		} );

	} );

	await it( 'It\'s possible to add new static property, and new property should not be readonly', async () =>
	{
		const propertyName = 'nonExistingProperty';

		// @ts-ignore
		StyleSwitch[ propertyName ] = propertyName;

		assert( StyleSwitch ).not.hasReadOnlyProperty( propertyName );

		// @ts-ignore
		assert( StyleSwitch[ propertyName ] ).equal( propertyName );
	} );

} );

await group( 'Dynamic tests', async () =>
{

	await it( 'Without css stylesheet links in document\'s head … result should be null', async () =>
	{
		const ss = new StyleSwitch();
		const result = await ss.run();
		assert( result ).equal( null );
	} );

	await groupClosed( 'StyleSwitch.prototype.settings can be changed', async () =>
	{
		const ss = new StyleSwitch();

		await it( 'settings property should not be read only', async () =>
		{
			assert( ss ).not.hasReadOnlyProperty( 'settings' );
		} );

		await it( 'Try to set new value and read if it\'s set', async () =>
		{
			const propertyName = 'new testing value';
			const originalValue = ss.settings.rootElementQS;
			ss.settings.rootElementQS = propertyName;
			assert( ss.settings.rootElementQS ).equal( propertyName );
			assert( ss.settings.rootElementQS ).not.equal( originalValue );
			ss.settings.rootElementQS = originalValue;
		} );

	} );

	await it( 'It\'s possible to add new dynamic property, and new property should not be readonly', async () =>
	{
		const ss = new StyleSwitch();
		const propertyName = 'nonExistingProperty';

		// @ts-ignore
		ss[ propertyName ] = propertyName;

		assert( ss ).not.hasReadOnlyProperty( propertyName );

		//@ts-ignore
		assert( ss[ propertyName ] ).equal( propertyName );

	} );

	await group( 'Test with some css link StyleSheet elements presented.', async () =>
	{

		beforeEach( () =>
		{
			document.head.insertAdjacentHTML(
				"beforeend",
				`<link data-ictest-style="true" rel="stylesheet" href="./example-css/switch.css" crossorigin="anonymous">
<link data-ictest="true" rel="stylesheet" href="./example-css/light.css" fetchpriority="high" crossorigin="anonymous">
<link data-ictest="true" rel="stylesheet" href="./example-css/dark.css" title="Dark style" media="(prefers-color-scheme: dark)" crossorigin="anonymous">
<link data-ictest="true" rel="alternate stylesheet" href="./example-css/light.css" title="Light style" crossorigin="anonymous">
<link data-ictest="true" rel="alternate stylesheet" href="./example-css/alternate.css" title="Alternate style" fetchpriority="low" crossorigin="anonymous">`
			);
		} );

		afterEach( () =>
		{
			document.head.querySelectorAll( '[data-ictest="true"]' ).forEach( link => link.remove() );
		} );

		await it( 'Result of StyleSwitch should be some HTMLElement or null', async () =>
		{
			const ss = new StyleSwitch();
			const result = await ss.run();
			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
		} );

		await it( 'Create select as result element', async () =>
		{
			const ss = new StyleSwitch();
			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SELECT;
			const result = await ss.run();
			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
			if ( result ) {
				const possibleSelect = result.querySelector( 'select' );
				assert( possibleSelect ).toBeInstanceOf( HTMLSelectElement );
			}
		} );

		await it( 'Request for switch output element, but with more than 2 stylesheets in document… so result should be Select', async () =>
		{
			const ss = new StyleSwitch();
			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SWITCH;
			const result = await ss.run();
			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
			if ( result ) {
				const possibleSelect = result.querySelector( 'select' );
				assert( possibleSelect ).toBeInstanceOf( HTMLSelectElement );
			}
		} );

		await it( 'Create radios list as result element', async () =>
		{
			const ss = new StyleSwitch();
			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.RADIOS;
			const result = await ss.run();
			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
			if ( result ) {
				const possibleSelect = result.querySelector( 'ul[role=radiogroup]' );
				assert( possibleSelect ).toBeInstanceOf( HTMLUListElement );
			}
		} );

	} );

	await group( 'Two possible StyleSheets in document and output element switch', async () =>
	{

		beforeEach( () =>
		{
			document.head.insertAdjacentHTML(
				"beforeend",
				`<link data-ictest-style="true" rel="stylesheet" href="./example-css/switch.css" crossorigin="anonymous">
<link data-ictest="true" rel="stylesheet" href="./example-css/light.css" fetchpriority="high" crossorigin="anonymous">
<link data-ictest="true" rel="stylesheet" href="./example-css/dark.css" title="Dark style" media="(prefers-color-scheme: dark)" crossorigin="anonymous">
<link data-ictest="true" rel="alternate stylesheet" href="./example-css/light.css" title="Light style" crossorigin="anonymous">`
			);
		} );

		afterEach( () =>
		{
			document.head.querySelectorAll( '[data-ictest="true"]' ).forEach( link => link.remove() );
		} );

		await it( 'Request for switch output element', async () =>
		{
			const ss = new StyleSwitch();
			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SWITCH;
			const result = await ss.run();
			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
			if ( result ) {
				const possibleSelect = result.querySelector( 'input[type=checkbox][role=switch]' );
				assert( possibleSelect ).toBeInstanceOf( HTMLInputElement );
			}
		} );

	} );

	await group( 'Regression tests for stylesheet paths and cookies', async () =>
	{
		beforeEach( () =>
		{
			document.head.querySelectorAll( '[data-regression-style="true"]' ).forEach( link => link.remove() );
		} );

		afterEach( async () =>
		{
			document.head.querySelectorAll( '[data-regression-style="true"]' ).forEach( link => link.remove() );
			await cookieStore.delete( { name: 'stylesheets' } );
		} );

		await it( 'Handles stylesheet URLs with special characters', async () =>
		{
			const persistentLink = document.createElement( 'link' );
			persistentLink.setAttribute( 'data-regression-style', 'true' );
			persistentLink.rel = 'stylesheet';
			persistentLink.setAttribute( 'href', './theme[dark]".css' );
			persistentLink.disabled = true;
			const alternateLink = document.createElement( 'link' );
			alternateLink.setAttribute( 'data-regression-style', 'true' );
			alternateLink.rel = 'alternate stylesheet';
			alternateLink.setAttribute( 'href', './theme[dark]".css' );
			alternateLink.title = 'Dark theme';
			alternateLink.disabled = true;
			document.head.append( persistentLink, alternateLink );

			assert( StyleSwitch.getRoleFrom( alternateLink ) ).equal( StyleSwitch.ROLE.ALTERNATE_CLONE );
		} );

		await it( 'Ignores and removes a damaged cookie', async () =>
		{
			await cookieStore.set( {
				name: 'stylesheets',
				value: '{damaged json'
			} );
			const styleLink = document.createElement( 'link' );
			styleLink.setAttribute( 'data-regression-style', 'true' );
			styleLink.rel = 'alternate stylesheet';
			styleLink.href = './regression.css';
			styleLink.title = 'Regression style';
			styleLink.disabled = true;
			document.head.append( styleLink );

			const ss = new StyleSwitch();
			const result = await ss.run();
			const cookie = await cookieStore.get( 'stylesheets' );
			assert( result ).equal( null );
			assert( cookie ).equal( null );
		} );

		await it( 'Creates a switch for one stylesheet and the naked style', async () =>
		{
			const styleLink = document.createElement( 'link' );
			styleLink.setAttribute( 'data-regression-style', 'true' );
			styleLink.rel = 'alternate stylesheet';
			styleLink.href = './regression.css';
			styleLink.title = 'Regression style';
			styleLink.disabled = true;
			document.head.append( styleLink );

			const ss = new StyleSwitch();
			ss.settings.nakedStyle.use = true;
			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SWITCH;
			const result = await ss.run();
			const checkbox = result?.querySelector( 'input[type=checkbox][role=switch]' );
			assert( checkbox ).toBeInstanceOf( HTMLInputElement );
			if ( checkbox && checkbox instanceof HTMLInputElement ) {
				assert( checkbox.checked ).equal( false );
			}
		} );

		await it( 'Selects the exact stylesheet when URLs share a prefix', async () =>
		{
			const shortPath = './styles/theme.css';
			const longPath = './styles/theme.css?dark';
			const shortLink = document.createElement( 'link' );
			shortLink.setAttribute( 'data-regression-style', 'true' );
			shortLink.rel = 'alternate stylesheet';
			shortLink.setAttribute( 'href', shortPath );
			shortLink.title = 'Light theme';
			shortLink.disabled = true;
			const longLink = document.createElement( 'link' );
			longLink.setAttribute( 'data-regression-style', 'true' );
			longLink.rel = 'alternate stylesheet';
			longLink.setAttribute( 'href', longPath );
			longLink.title = 'Dark theme';
			longLink.disabled = true;
			document.head.append( shortLink, longLink );

			const rootElement = document.createElement( 'div' );
			const optionShort = document.createElement( 'option' );
			optionShort.value = shortPath;
			const optionLong = document.createElement( 'option' );
			optionLong.value = longPath;
			rootElement.append( optionShort, optionLong );
			StyleSwitch.setValueOnResultElementBy( {
				[ shortPath ]: { disabled: true },
				[ longPath ]: { disabled: false }
			}, StyleSwitch.OUTPUT_FORMATS.SELECT, rootElement );

			assert( optionShort.selected ).equal( false );
			assert( optionLong.selected ).equal( true );
		} );

	} );

} );
