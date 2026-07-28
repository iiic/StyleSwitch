/** @returns {Promise<void>} */
async function resetCssStyleSheets (
	/** @type {CookieListItem|null} */ cookie = null,
	/** @type {'changed' | 'deleted'} */ actionType = 'changed'
)
{

	/** @type {Boolean} */
	let useNakedStyle = false;

	if ( !cookie ) {

		/** @type {CookieListItem} */
		cookie = await cookieStore.get( 'stylesheets' );

	}

	if ( cookie && actionType === 'deleted' ) {

		/** @type {NodeListOf<HTMLLinkElement>} */
		const allStyleLinkElements = document.querySelectorAll( 'link[rel~=stylesheet]' );

		if ( allStyleLinkElements ) {

			allStyleLinkElements.forEach( function ( /** @type {HTMLLinkElement} */ link )
			{
				if ( link.hasAttribute( 'data-alternate' ) ) {
					link.rel = 'alternate stylesheet';
					link.removeAttribute( 'data-alternate' );
				}
				if ( link.hasAttribute( 'data-title' ) ) {
					link.title = link.getAttribute( 'data-title' ) ?? '';
					link.removeAttribute( 'data-title' );
				}
				if ( link.hasAttribute( 'data-media' ) ) {
					link.media = link.getAttribute( 'data-media' ) ?? '';
					link.removeAttribute( 'data-media' );
				}
				link.disabled = link.rel.match( 'alternate' ) ? true : false; // strange behavior, alternate stylesheets remains enabled, so we need to disable them manually
			} );
		}
		return;
	} else if ( !cookie || !cookie.value ) {
		return;
	}

	/** @type {Object.<string, {disabled: Boolean}>} */
	const styles = JSON.parse( cookie.value );

	Object.keys( styles ).forEach( function ( /** @type {String} */ path )
	{
		if ( path === '' && styles[ path ].disabled === false ) {
			useNakedStyle = true;
		}

		/** @type {HTMLLinkElement|null} */
		const link = document.querySelector( `link[rel~=stylesheet][href*="${ path }"]` );

		if ( link ) {

			/** @type {Boolean} */
			const isAlternate = link.rel.includes( 'alternate' );

			link.disabled = styles[ path ].disabled;
			if ( link.disabled ) {
				if ( link.hasAttribute( 'data-alternate' ) ) {
					link.rel = 'alternate stylesheet';
					link.removeAttribute( 'data-alternate' );
				}
				if ( link.hasAttribute( 'data-title' ) ) {
					link.title = link.getAttribute( 'data-title' ) ?? '';
					link.removeAttribute( 'data-title' );
				}
				if ( link.hasAttribute( 'data-media' ) ) {
					link.media = link.getAttribute( 'data-media' ) ?? '';
					link.removeAttribute( 'data-media' );
				}
			} else { // enabled
				if ( isAlternate ) {
					link.setAttribute( 'data-alternate', '' );
					link.rel = 'stylesheet';
				}
				if ( link.title ) {
					link.setAttribute( 'data-title', link.title );
					link.removeAttribute( 'title' );
				}
				if ( link.media ) {
					if ( window.matchMedia( link.media ).matches ) {
						if ( link.hasAttribute( 'data-title' ) ) {
							link.title = link.getAttribute( 'data-title' ) ?? '';
							link.removeAttribute( 'data-title' );
						}
					} else {
						link.setAttribute( 'data-media', link.media );
						link.removeAttribute( 'media' );
					}
				}
			}
		}
	} );

	/** @type {NodeListOf<HTMLLinkElement>|null} */
	const persistentStyleSheets = document.querySelectorAll( 'link[rel=stylesheet]:not([title])' );

	if ( !persistentStyleSheets ) {
		return;
	}
	persistentStyleSheets.forEach( function ( /** @type {HTMLLinkElement} */ link )
	{
		link.disabled = useNakedStyle;
	} );
}
resetCssStyleSheets();

cookieStore.addEventListener( 'change', function ( /** @type {CookieChangeEvent} */ event )
{

	/** @type {CookieListItem|undefined} */
	const possibleChangedCookie = event.changed.find( cookie => cookie.name === 'stylesheets' );

	/** @type {CookieListItem|true|undefined} */
	let possibleDeletedCookie = event.deleted.find( cookie => cookie.name === 'stylesheets' );

	if ( possibleChangedCookie ) {
		if ( possibleChangedCookie.value === '' ) { // empty value means same behavior like deleted cookie
			possibleDeletedCookie = true;
		} else if ( possibleChangedCookie.value ) {
			return resetCssStyleSheets( possibleChangedCookie, 'changed' );
		}
	}

	if ( possibleDeletedCookie ) {
		return resetCssStyleSheets( /** @type {CookieListItem} */( possibleDeletedCookie ), 'deleted' );
	}
} );
