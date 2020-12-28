/**
* @private
* @module StyleSwitch
* @classdesc @todo … description
* @author ic < ic.czech@gmail.com >
* @see https://iiic.dev/style-switch
* @license https://creativecommons.org/licenses/by-sa/4.0/legalcode.cs CC BY-SA 4.0
* @since Q4 2020
* @version 0.1
* @readonly
*/
const StyleSwitchPrivate = class
{

	static INPUT = 'input';
	static LABEL = 'label';
	static CHANGE_EVENT = 'change';
	static MEDIA_ATTR = 'media';
	static DATA_MEDIA_ATTR = 'data-media';
	static DATA_POSITIONS_ATTR = 'data-positions';
	//static DATA_TITLE_ATTR = 'data-title';
	static SPACE = ' ';
	static REL_ALTERNATE = 'alternate';
	static SUFFIX = {
		A: '-a',
		B: '-b',
	};

	/**
	 * @public
	 * @type {Object}
	 * @description default settings… can be overwritten
	 */
	settings = {
		styles: {},
		rootElementQS: '#style-sheets',
		switchStyleTitle: 'Switch style',
		nakedStyle: {
			use: false,
			id: 'naked',
			title: 'Without style (naked HTML)',
		},
		vsText: null,
		defaultColorScheme: StyleSwitch.COLOR_SCHEME.LIGHT,
		cookieSuffix: 'path=/; domain=generator.localhost; SameSite=Strict; ', // secure
		styleLinksQSA: 'link[rel*="stylesheet"]',
		modulesImportPath: 'https://iiic.dev/js/modules',
		autoRun: true,
	};

	/**
	* @public
	* @type {NodeList}
	*/
	styleLinks;

	/**
	* @public
	* @type {HTMLElement}
	*/
	rootElement;

	/**
	 * @public
	 * @type {Function}
	 */
	importWithIntegrity;


	async initImportWithIntegrity ( /** @type {Object} */ settings = null )
	{

		console.groupCollapsed( '%c' + this.constructor.name + '%c initImportWithIntegrity %c(' + ( settings === null ? 'without settings' : 'with settings' ) + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);
		console.debug( { arguments } );
		console.groupEnd();

		return new Promise( ( /** @type { Function } */ resolve ) =>
		{
			const ip = settings && settings.modulesImportPath ? settings.modulesImportPath : this.settings.modulesImportPath;
			// @ts-ignore
			import( ip + '/importWithIntegrity.mjs' ).then( ( /** @type {Module} */ module ) =>
			{
				/** @type {Function} */
				this.importWithIntegrity = module.importWithIntegrity;
				resolve( true );
			} ).catch( () =>
			{
				const SKIP_SECURITY_URL = '#skip-security-test-only'
				if ( window.location.hash === SKIP_SECURITY_URL ) {
					console.warn( '%c' + this.constructor.name + '%c initImportWithIntegrity %c without security!',
						StyleSwitch.CONSOLE.CLASS_NAME,
						StyleSwitch.CONSOLE.METHOD_NAME,
						StyleSwitch.CONSOLE.WARNING
					);
					this.importWithIntegrity = (/** @type {String} */ path ) =>
					{
						return new Promise( ( /** @type {Function} */ resolve ) =>
						{
							// @ts-ignore
							import( path ).then( ( /** @type {Module} */ module ) =>
							{
								resolve( module );
							} );
						} );
					};
					resolve( true );
				} else {
					throw 'Security Error : Import with integrity module is missing! You can try to skip this error by adding ' + SKIP_SECURITY_URL + ' hash into website URL';
				}
			} );
		} );
	}

	getPathnameBy ( /** @type {String} */ path )
	{
		console.debug( '%c' + this.constructor.name + '%c getPathnameBy %c(' + path + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);

		let url = null;
		if ( path.substring( 0, 4 ) === 'http' ) {
			url = new URL( path );
		} else {
			url = new URL( path, String( document.location ) );
		}
		return url.pathname;
	}

	unsetAllStyles ( /** @type {Boolean} */ naked )
	{
		console.debug( '%c' + this.constructor.name + '%c unsetAllStyles %c(' + ( naked ? 'naked' : 'non-naked' ) + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);

		this.styleLinks.forEach( ( /** @type {HTMLLinkElement} */ link ) =>
		{
			const role = StyleSwitch.getRoleFrom( link );
			// @ts-ignore
			if ( navigator.userAgentData && navigator.userAgentData.isChrome ) {
				const tempMedia = link.getAttribute( StyleSwitchPrivate.DATA_MEDIA_ATTR );
				if ( tempMedia ) {
					link.media = tempMedia;
					link.removeAttribute( StyleSwitchPrivate.DATA_MEDIA_ATTR );
				}
			} else {
				//@ts-ignore
				const possibleCssStyleSheet = this.getCSSStyleSheetBy( link );
				if ( possibleCssStyleSheet ) {
					//@ts-ignore
					link = possibleCssStyleSheet;
				}
			}
			if ( ( role === StyleSwitch.STYLE.PREFERRED || role === StyleSwitch.STYLE.ALTERNATE ) || naked ) {
				link.disabled = true;
			} else if ( role === StyleSwitch.STYLE.PERSISTENT ) {
				link.disabled = false;
			}
		} );
	}

	switchStyle ( /** @type {Event} */ event )
	{
		console.debug( '%c' + this.constructor.name + '%c switchStyle',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		/** @type {HTMLInputElement} */
		const input = ( event.target );

		/** @type {String} */
		const positionsAttr = input.getAttribute( StyleSwitchPrivate.DATA_POSITIONS_ATTR );

		let positions = [];
		if ( positionsAttr ) {
			positions = positionsAttr.split( ',' );
		}
		const naked = positions.length >= 1 ? false : true;
		this.unsetAllStyles( naked );
		this.setStyleBy( naked, positions );
	}

	getPositionsAttrBy ( /** @type {HTMLInputElement} */ input )
	{
		console.debug( '%c' + this.constructor.name + '%c getSuffixBy',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			{ input }
		);

		/** @type {String} */
		const suffix = input.checked ? StyleSwitchPrivate.SUFFIX.B : StyleSwitchPrivate.SUFFIX.A;

		return input.getAttribute( StyleSwitchPrivate.DATA_POSITIONS_ATTR + suffix );
	}

	switchStyleRadio ( /** @type {Event} */ event )
	{
		console.debug( '%c' + this.constructor.name + '%c switchStyleRadio',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		/** @type {HTMLInputElement} */
		const input = ( event.target );

		/** @type {String} */
		const positionsAttr = this.getPositionsAttrBy( input );

		let positions = [];
		if ( positionsAttr ) {
			positions = positionsAttr.split( ',' );
		}
		const naked = positions.length >= 1 ? false : true;
		this.unsetAllStyles( naked );
		this.setStyleBy( naked, positions );
	}

	buildSingleRadioBy (
		/** @type {String} */ path,
		/** @type {String} */ title,
		/** @type {String} */ positions = null,
		/** @type {Number} */ role = null,
		/** @type {String} */ media = null
	)
	{
		console.debug( '%c' + this.constructor.name + '%c buildSingleRadioBy %c(' + path + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);

		if ( role !== StyleSwitch.CONSOLE.PERSISTENT ) {

			/** @type {HTMLLabelElement} */
			const label = ( document.createElement( StyleSwitchPrivate.LABEL ) );

			label.htmlFor = this.rootElement.id + this.getPathnameBy( path );

			/** @type {HTMLInputElement} */
			const input = ( document.createElement( StyleSwitchPrivate.INPUT ) );

			input.type = 'radio';
			input.name = this.rootElement.id;
			input.id = label.htmlFor;
			input.title = title;
			if (
				( role === StyleSwitch.STYLE.PERSISTENT || role === StyleSwitch.STYLE.PREFERRED )
				&& ( media && window.matchMedia( media ).matches )
			) {
				input.checked = true;
			}
			if ( positions ) {
				input.setAttribute( StyleSwitchPrivate.DATA_POSITIONS_ATTR, positions );
			}
			input.addEventListener( StyleSwitchPrivate.CHANGE_EVENT, this.switchStyle.bind( this ), { once: false, capture: false } );

			label.appendChild( input );
			label.appendChild( document.createTextNode( title ) );
			this.rootElement.appendChild( label );
			this.rootElement.appendChild( document.createElement( 'BR' ) );
		}
	}

	buildRadioAsSwitch (
		/** @type {Array<String, String, String, Number, String>} */ arrayA,
		/** @type {Array<String, String, String, Number, String>} */ arrayB
	)
	{
		console.debug( '%c' + this.constructor.name + '%c buildRadioAsSwitch',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
		);

		const keys = {
			title: 0,
			path: 1,
			positions: 2,
			role: 3,
			media: 4,
		};

		if ( arrayA[ keys.media ] === this.settings.defaultColorScheme ) {
			[ arrayA, arrayB ] = [ arrayB, arrayA ];
		}
		let commonTitle = this.settings.switchStyleTitle;
		if ( this.settings.vsText ) {
			commonTitle = arrayA[ keys.title ] + this.settings.vsText + arrayB[ keys.title ];
		} else if ( !commonTitle ) {
			commonTitle = arrayB[ keys.title ];
		}

		/** @type {HTMLLabelElement} */
		const label = ( document.createElement( StyleSwitchPrivate.LABEL ) );

		label.htmlFor = this.rootElement.id + this.getPathnameBy( arrayA[ keys.path ] );
		label.className = 'switch';

		/** @type {HTMLInputElement} */
		const input = ( document.createElement( StyleSwitchPrivate.INPUT ) );
		input.type = 'checkbox';
		input.name = this.rootElement.id;
		input.id = label.htmlFor;
		input.title = commonTitle;
		if (
			// @ts-ignore
			( arrayA[ keys.role ] === StyleSwitch.STYLE.PERSISTENT || arrayA[ keys.role ] === StyleSwitch.STYLE.PREFERRED )
			&& ( arrayA[ keys.media ] && window.matchMedia( arrayA[ keys.media ] ).matches )
		) {
			input.checked = true;
		}
		input.addEventListener( StyleSwitchPrivate.CHANGE_EVENT, this.switchStyleRadio.bind( this ), { once: false, capture: false } );

		if ( arrayA[ keys.positions ] ) {
			input.setAttribute( StyleSwitchPrivate.DATA_POSITIONS_ATTR + StyleSwitchPrivate.SUFFIX.A, arrayA[ keys.positions ] );
		}
		if ( arrayB[ keys.positions ] ) {
			input.setAttribute( StyleSwitchPrivate.DATA_POSITIONS_ATTR + StyleSwitchPrivate.SUFFIX.B, arrayB[ keys.positions ] );
		}

		const strong = ( document.createElement( 'strong' ) );
		strong.appendChild( document.createTextNode( commonTitle ) );

		label.appendChild( input );
		label.appendChild( document.createElement( 'span' ) );
		label.appendChild( strong );
		this.rootElement.appendChild( label );
	}

	setStyleCookieBy ( /** @type {String} */ stylePath )
	{
		console.debug( '%c' + this.constructor.name + '%c setStyleCookieBy %c(' + stylePath + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);

		const fileName = StyleSwitch.getFileNameFrom( stylePath );
		const fileParts = fileName.split( '-' );

		if ( fileParts[ 0 ] && fileParts[ 1 ] ) {
			const cookieDate = new Date;
			cookieDate.setFullYear( cookieDate.getFullYear() + 5 );
			document.cookie = 'style=' + fileParts[ 0 ] + '-' + fileParts[ 1 ] + '; expires=' + cookieDate.toUTCString() + '; ' + this.settings.cookieSuffix;
		}
	}

	setStyleBy ( /** @type {Boolean} */ naked, /** @type {Array} */ positions = [] )
	{
		console.debug( '%c' + this.constructor.name + '%c setStyleBy %c(' + positions + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);

		/** @type {HTMLLinkElement | CSSStyleSheet} */
		let style = ( this.styleLinks[ positions[ 0 ] ] );

		this.setStyleCookieBy( style.href );

		if ( !naked ) {
			positions.forEach( ( /** @type {Number} */ position ) =>
			{

				/** @type {HTMLLinkElement | CSSStyleSheet} */
				style = ( this.styleLinks[ position ] );

				let link = null;
				//@ts-ignore
				if ( navigator.userAgentData && navigator.userAgentData.isChrome ) {
					link = style;
				} else {
					const possibleCssStyleSheet = this.getCSSStyleSheetBy( style );
					if ( possibleCssStyleSheet ) {
						style = possibleCssStyleSheet;
						link = style.ownerNode;
					}
				}

				//@ts-ignore
				if ( link && link.media && !window.matchMedia( link.media ).matches ) {
					//@ts-ignore
					link.setAttribute( StyleSwitchPrivate.DATA_MEDIA_ATTR, link.media );
					//@ts-ignore
					link.removeAttribute( StyleSwitchPrivate.MEDIA_ATTR );
				}
				style.disabled = false;
			} );
		}
	}

	getCSSStyleSheetBy ( /** @type {HTMLLinkElement} */ link )
	{
		console.debug( '%c' + this.constructor.name + '%c getCSSStyleSheetBy',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		styleSheetsLoop:
		for ( const key in Object.keys( document.styleSheets ) ) {
			if ( document.styleSheets[ key ].href === link.href ) {
				return document.styleSheets[ key ];
			}
		}
		return null;
	}

} // StyleSwitchPrivate

/**
* @public
* @module StyleSwitch
* @classdesc @todo … description
* @author ic < ic.czech@gmail.com >
* @see https://iiic.dev/style-switch
* @license https://creativecommons.org/licenses/by-sa/4.0/legalcode.cs CC BY-SA 4.0
* @since Q4 2020
* @version 0.1
*/
export class StyleSwitch
{

	static STYLE = {
		NAKED: 0,
		PERSISTENT: 1,
		PREFERRED: 2,
		ALTERNATE: 3,
	};

	static CONSOLE = {
		CLASS_NAME: 'color: gray',
		METHOD_NAME: 'font-weight: normal; color: green',
		INTEREST_PARAMETER: 'font-weight: normal; font-size: x-small; color: blue',
		EVENT_TEXT: 'color: orange',
		WARNING: 'color: red',
	};

	static COLOR_SCHEME = {
		LIGHT: '(prefers-color-scheme: light)',
		DARK: '(prefers-color-scheme: dark)',
	};

	/**
	 * @private
	 * @description '#private' is not currently supported by Firefox, so that's why '_private'
	 */
	_private;


	constructor (
		/** @type {HTMLScriptElement | null} */ settingsElement = null
	)
	{
		console.groupCollapsed( '%c' + this.constructor.name,
			StyleSwitch.CONSOLE.CLASS_NAME
		);
		console.debug( '%c' + 'constructor',
			StyleSwitch.CONSOLE.METHOD_NAME,
			[ { arguments } ],
		);

		this._private = new StyleSwitchPrivate;
		let settings = {};
		if ( settingsElement ) {
			settings = JSON.parse( settingsElement.text );
		}

		this._private.initImportWithIntegrity( settings ).then( () =>
		{
			if ( settings ) {
				this.setSettings( settings ).then( () =>
				{
					if ( this.settings.autoRun ) {
						// @ts-ignore
						if ( navigator.userAgentData && navigator.userAgentData.isChrome ) {
							setTimeout( function ()
							{
								this.run();
							}, 250 );
						} else {
							this.run();
						}
					}
				} );
			} else if ( this.settings.autoRun ) {
				// @ts-ignore
				if ( navigator.userAgentData && navigator.userAgentData.isChrome ) {
					setTimeout( function ()
					{
						this.run();
					}, 250 );
				} else {
					this.run();
				}
			}
		} );

		console.groupEnd();

	}


	/**
	 * @description : get script settings
	 * @returns {Object} settings of self
	 */
	get settings ()
	{
		return this._private.settings;
	}

	set settings ( /** @type {Object} */ inObject )
	{
		Object.assign( this._private.settings, inObject );
	}

	/**
	 * @description : Get dynamic Import function
	 * @returns {Function}
	 */
	get importWithIntegrity ()
	{
		return this._private.importWithIntegrity;
	}

	/**
	 * @returns {NodeList}
	 */
	get styleLinks ()
	{
		return this._private.styleLinks;
	}

	set styleLinks ( /** @type {NodeList} */ styleLinks )
	{
		this._private.styleLinks = styleLinks;
	}

	/**
	 * @returns {Object}
	 */
	get rootElement ()
	{
		return this._private.rootElement;
	}


	async setSettings ( /** @type {Object} */ inObject )
	{
		console.groupCollapsed( '%c' + this.constructor.name + '%c setSettings',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);
		console.debug( { arguments } );
		console.groupEnd();

		return new Promise( ( /** @type {Function} */ resolve ) =>
		{
			if ( inObject.modulesImportPath ) {
				this.settings.modulesImportPath = inObject.modulesImportPath;
			}
			this.importWithIntegrity(
				this.settings.modulesImportPath + '/object/deepAssign.mjs',
				'sha256-qv6PwXwb5wOy4BdBQVGgGUXAdHKXMtY7HELWvcvag34='
				// @ts-ignore
			).then( ( /** @type {Module} */ deepAssign ) =>
			{
				new deepAssign.append( Object );
				// @ts-ignore
				this._private.settings = Object.deepAssign( this.settings, inObject ); // multi level assign
				resolve( true );
			} ).catch( () =>
			{
				Object.assign( this._private.settings, inObject ); // single level assign
				resolve( true );
			} );
		} );
	}

	static getRoleFrom ( /** @type {HTMLLinkElement} */ link )
	{
		const rel = link.rel.split( StyleSwitchPrivate.SPACE );
		const alternate = rel.includes( StyleSwitchPrivate.REL_ALTERNATE );

		const title = link.title && link.title !== '';

		let role = StyleSwitch.STYLE.PERSISTENT;
		if ( alternate && title ) {
			role = StyleSwitch.STYLE.ALTERNATE;
		} else if ( !alternate && title ) {
			role = StyleSwitch.STYLE.PREFERRED;
		}

		console.debug( '%c' + this.constructor.name + '%c getRoleFrom %c(' + link.href + ' = ' + role + ')',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME,
			StyleSwitch.CONSOLE.INTEREST_PARAMETER
		);

		return role;
	}

	static getFileNameFrom ( /** @type {String} */ path )
	{
		return path.split( '\\' ).pop().split( '/' ).pop();
	}

	getStyleLinks ()
	{
		console.debug( '%c' + this.constructor.name + '%c getStyleLinks',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		this.styleLinks = document.head.querySelectorAll( this.settings.styleLinksQSA );
	}

	getAllPossibleStyles ()
	{
		console.debug( '%c' + this.constructor.name + '%c getAllPossibleStyles',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		const styleLinksLength = this.styleLinks.length;
		const titles = {};

		styleLinksLoop:
		for ( let i = 0; i < styleLinksLength; i++ ) {

			/** @type {HTMLLinkElement} */
			const link = ( this.styleLinks[ i ] );

			safeStylesLoop:
			for ( const key in this.settings.styles ) {
				if ( link.title && this.settings.styles[ key ].title === link.title ) {
					this.settings.styles[ key ].positions.push( i );
					continue styleLinksLoop;
				}
			}

			/** @type {Number} */
			const role = StyleSwitch.getRoleFrom( link );

			// @ts-ignore
			if ( navigator.userAgentData && navigator.userAgentData.isChrome && role === StyleSwitch.STYLE.ALTERNATE ) {
				link.disabled = true;
			}

			const currentTitle = link.title ? link.title : link.getAttribute( 'data-title' );
			this.settings.styles[ link.href ] = {
				title: currentTitle,
				role: role,
				media: link.media,
				positions: [ i ],
			};
			if ( Object.keys( titles ).includes( currentTitle ) ) {
				this.settings.styles[ titles[ currentTitle ] ].positions.push( i );
			} else {
				titles[ currentTitle ] = link.href;
			}
		}
	}

	prepareNakedRadio ()
	{
		console.debug( '%c' + this.constructor.name + '%c buildNakedRadio',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		if ( this.settings.nakedStyle.use ) {

			this.settings.styles = Object.assign(
				{ [ this.settings.nakedStyle.id ]: { title: this.settings.nakedStyle.title } },
				this.settings.styles
			);
		}
	}

	buildAllStyleRadios ()
	{
		console.groupCollapsed( '%c' + this.constructor.name + '%c buildAllStyleRadios',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);
		console.debug( 'this.settings.styles', this.settings.styles );
		console.groupEnd();

		const clearedStyles = [];
		Object.keys( this.settings.styles ).forEach( ( /** @type {String} */ key ) =>
		{
			if ( this.settings.styles[ key ].role !== StyleSwitch.STYLE.PERSISTENT ) {
				clearedStyles.push( this.settings.styles[ key ] );
			}
		} );

		const keys = Object.keys( clearedStyles );

		if ( keys.length === 2 ) { // one checkbox
			const keyA = keys[ 0 ];
			const keyB = keys[ 1 ];
			const a = clearedStyles[ keyA ];
			const b = clearedStyles[ keyB ];
			this._private.buildRadioAsSwitch(
				[ a.title, keyA, a.positions, a.role, a.media ],
				[ b.title, keyB, b.positions, b.role, b.media ]
			);
		} else { // list of radios
			keys.forEach( ( /** @type {String} */ key ) =>
			{
				const current = clearedStyles[ key ];
				this._private.buildSingleRadioBy(
					key,
					current.title,
					current.positions,
					current.role,
					current.media
				);
			} );
		}
	}

	async initIsChrome ()
	{
		console.debug( '%c' + this.constructor.name + '%c initIsChrome',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		return new Promise( ( /** @type {Function} */ resolve ) =>
		{
			this.importWithIntegrity(
				this.settings.modulesImportPath + '/navigatoruadata/isChrome.mjs',
				'sha256-QURHFqjYGhatnn5EvveYDhD/3l6r4+CLtm04tx47/dU='
				// @ts-ignore
			).then( ( /** @type {Module} */ isChrome ) =>
			{
				// @ts-ignore
				if ( navigator.userAgentData ) {
					// @ts-ignore
					new isChrome.append( NavigatorUAData );
				}
				resolve( true );
			} );
		} );
	}

	showRootElement ()
	{
		console.debug( '%c' + this.constructor.name + '%c showRootElement',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);
		this.rootElement.hidden = false;
	}

	/**
	 * @description : Make styles switchable by Firefox native style switching function.
	 */
	linksToStyles ()
	{
		console.debug( '%c' + this.constructor.name + '%c linksToStyles',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		const keys = Object.keys( this.settings.styles );

		if ( keys[ 1 ] ) {
			this.settings.styles[ keys[ 1 ] ].positions.forEach( ( /** @type {Number} */ key ) =>
			{
				if ( !window.matchMedia( this.styleLinks[ key ].media ).matches ) {
					this.styleLinks[ key ].removeAttribute( StyleSwitchPrivate.MEDIA_ATTR );
					// @todo : přesunout na data-atribut protože při přepínání stylů na úrovni OS bych nevěděl který je to media atribut.
				}
			} );
		}
	}

	setRootElement ()
	{
		console.groupCollapsed( '%c' + this.constructor.name + '%c setRootElement',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		this._private.rootElement = document.querySelector( this.settings.rootElementQS );
		if ( !this._private.rootElement ) {
			throw new Error( 'Root element in the document was not found' );
		}
	}

	run ()
	{
		console.groupCollapsed( '%c' + this.constructor.name + '%c run',
			StyleSwitch.CONSOLE.CLASS_NAME,
			StyleSwitch.CONSOLE.METHOD_NAME
		);

		this.setRootElement();
		this.initIsChrome().then( () =>
		{
			this.getStyleLinks();
			this.getAllPossibleStyles();
			this.linksToStyles();
			this.prepareNakedRadio();
			this.buildAllStyleRadios();
			this.showRootElement();
		} );

		console.groupEnd();

		return true;
	}

}

// @ts-ignore
new StyleSwitch( document.getElementById( 'styleswitch-settings' ) );

// @todo : při změně stylu je nutné prohodit pozice link type stylesheet, ten s current prefers-color-scheme musí být na vyšší pozici ! při té příležitosti by šlo i přecvakávat selectory, aby byl změna schématu v OS přepnula selector
