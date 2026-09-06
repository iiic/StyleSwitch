const { StyleSwitch, result } = await import( './style-switch.mjs?v=1.3&settings=' + JSON.stringify( {
	autoRun: false,
} ) );
const { applySettings, clearSettings, group, groupClosed, it, assert, beforeEach, afterEach, not, toBeNullOr, equal, toBeDefined, toBeInstanceOf } = await import( './modules/ictest.mjs?v=0.1&settings=' + JSON.stringify( {
	nastaveni: {
		a: true,
	},
} ) );

const JSON_SETTINGS_ID = 'style-switch-settings';

await group( 'Statické testy', async () =>
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
		StyleSwitch[ propertyName ] = propertyName;
		assert( StyleSwitch ).not.hasReadOnlyProperty( propertyName );
		assert( StyleSwitch[ propertyName ] ).equal( propertyName );
	} );

} );

await group( 'Dynamické testy', async () =>
{

	await it( 'bez css stylů v hlavičce, mělo v result by vrátit null', async () =>
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
		ss[ propertyName ] = propertyName;
		assert( ss ).not.hasReadOnlyProperty( propertyName );
		assert( ss[ propertyName ] ).equal( propertyName );
	} );

	await group( 'testy s nějakými css styly… tedy už to bude něco dělat', async () =>
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

		await it( 'result of StyleSwitch should be some HTMLElement or null', async () =>
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

} );
