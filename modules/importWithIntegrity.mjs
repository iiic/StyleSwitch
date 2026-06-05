export function importWithIntegrity ( /** @type {String} */ path, /** @type {String} */ integrity )
{
	const POSSIBLE_HASHES = [ 'sha256', 'sha384', 'sha512' ]; // same length… 6 chars
	const INTEGRITY_DIVIDER = '-';

	if ( !integrity ) {
		integrity = 'is missing!';
	}
	if (
		!POSSIBLE_HASHES.includes( integrity.substring( 0, 6 ).toLowerCase() )
		|| integrity.substring( 6, 7 ) !== INTEGRITY_DIVIDER
	) {
		integrity = POSSIBLE_HASHES[ 0 ] + INTEGRITY_DIVIDER + integrity;
	}

	/** @type {HTMLScriptElement} */
	const element = ( document.createElement( 'SCRIPT' ) ); // link rel="preload" also working, but NOT in Firefox :(

	element.type = 'module';
	element.src = path;
	element.integrity = integrity;
	element.setAttribute( 'crossorigin', 'anonymous' );
	document.head.appendChild( element );
	return new Promise( ( /** @type {Function} */ resolve ) =>
	{
		import( path ).then( ( /** @type {Module} */ module ) =>
		{
			resolve( module );
		} );
	} );
}
