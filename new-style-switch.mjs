"use strict";

//@ts-check

/// @todo : zkontrolovat použití "let", po mazání result by let mělo být využito na některých místech zbytečně, tak refaktorovat.

/**
 * @class
 * @description internal class, not accessible from outside the script
 */
const StyleSwitchInternal = class
{

	/**
	 * @type {Object}
	 */
	#settings = {
		styleLinksQSA: 'link[rel~=stylesheet]', // match rel="stylesheet" and also rel="alternate stylesheet"
		rootElementQS: '#style-switch',
		cookie: {
			name: 'stylesheets',
			timeBeforeExpire: 365 * 24 * 60 * 60 * 1000, // year
			partitioned: true,
			path: '/',
			sameSite: 'strict', // CookieSameSite (means one of 'strict' | 'lax' | 'none')
		},
		texts: {
			caption: '', // @todo : defaultní hodnota má být: Style switch
			nakedStyleCaption: 'Without style (naked HTML)',
			switch: {
				caption: '', // if empty string, script will try to fill by style's title attributes
				title: '',
				versusDividerForRadio: ' / ',
				stateOnCaption: 'zapnuto',
				stateOffCaption: 'vypnuto',
			},
			select: {
				caption: '',
				optGroupLabelForStyles: '',
				otpGroupLabelForNaked: '',
			},
			radioList: {
				caption: '',
			}
		},
		nakedStyle: {
			use: false,
			celebrateNakedDay: {
				switchAutomatically: false, // if true naked style is set and unset automatically at event
				monthNumber: 3, // month numbers starts with 0, so April is number 3
				dayNumber: 9
			}
		},
		resultSnippetAppearance: {
			idPrefix: 'style-switch-result-', // will be appended by random string
			defaultResultSnippetElement: 'div',
			outputFormat: StyleSwitch.OUTPUT_FORMATS.SELECT,
			preferredColorSchemeChangeBehavior: StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR.ONLY_WITHOUT_COOKIE,
			reverseOrder: false, // order of style sheets, should be reversed?
			switch: {
				useSwitchIfPossible: false, // if there are only 2 possible css styleSheets create input type=checkbox styled as switch
				useRolesAsTitle: true,
				labelClassName: 'switch',
				captionElementName: 'strong', // only line elements supported, no block elements here
				visualSwitchClassName: 'visual',
				stateClassName: 'state',
				statusElementName: 'small', // only line elements supported, no block elements here
			},
			select: {
				useRoleAsOptionTitle: true,
				captionElementName: 'strong',
			},
			radioList: {
				captionElementName: 'h3',
				useRoleAsItemTitle: true,
			},
		},
		autoRun: true,
	};

	/**
	 * @returns {Object}
	 */
	getSettings ()
	{
		return this.#settings;
	}
	setSettings ( /** @type {Object} */ newSettings )
	{
		this.#settings = StyleSwitchInternal.#deepAssign( this.#settings, newSettings );
	}

	/**
	 * @type {HTMLElement|null}
	 */
	#rootElement = null;

	/**
	 * @returns {HTMLElement|null}
	 */
	getRootElement ()
	{
		return this.#rootElement;
	}
	setRootElement ( /** @type {HTMLElement} */ rootElement )
	{
		if ( rootElement && 'nodeType' in rootElement && rootElement.nodeType === Node.ELEMENT_NODE ) {
			this.#rootElement = rootElement;
		} else {
			throw new Error( 'Not a valid HTMLElement' );
		}
	}

	constructor ( /** @type {String} */ settingsElementId = 'style-switch-settings' )
	{

		/**
		 * @property {HTMLElement|null} rootElement
		 * @name StyleSwitch#rootElement
		 * @default null
		 * @readonly
		 */
		Object.defineProperty( this, 'rootElement', {
			get: this.getRootElement,
			set: this.setRootElement,
			configurable: false,
			enumerable: true,
		} );

		/**
		 * @property {Object} settings
		 * @name StyleSwitch#settings
		 * @readonly
		 */
		Object.defineProperty( this, 'settings', {
			get: this.getSettings,
			set: this.setSettings,
			configurable: true,
			enumerable: true,
		} );

		/** @type {URLSearchParams} */
		const searchParams = new URL( import.meta.url ).searchParams;

		if ( searchParams.has( StyleSwitch.SETTINGS_URL_PARAMETER ) ) {
			const jsonInString = /** @type {String} */ ( searchParams.get( StyleSwitch.SETTINGS_URL_PARAMETER ) );
			this.settings = JSON.parse( jsonInString );
		}

		/** @type {HTMLElement | null} */
		const settingsElement = document.getElementById( settingsElementId );

		if ( settingsElement && settingsElement instanceof HTMLScriptElement ) {
			const jsonInElement = /** @type {HTMLScriptElement} */ ( settingsElement );
			this.settings = JSON.parse( jsonInElement.text );
		}
	}

	static #deepAssign ( /** @type {Array.<any>} */ ...customArgs )
	{

		/** @type {Object<string, any>} */
		let currentLevel = {};

		loopThroughAllCustomArgs:
		customArgs.forEach( ( /** @type {Object} */ source ) =>
		{
			if ( source instanceof Array ) {
				currentLevel = source;
			} else if ( source !== null ) {
				loopThroughKeyValPairsObject:
				Object.entries( source ).forEach( ( [ /** @type {String} */ key, /** @type {any} */ value ] ) =>
				{
					if ( value instanceof Object && key in currentLevel ) {
						value = StyleSwitchInternal.#deepAssign( currentLevel[ key ], value );
					}
					currentLevel = { ...currentLevel, [ key ]: value };
				} );
			}
		} );

		return currentLevel;
	}

	/** @returns { 'persistent' | 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */
	static getRoleFrom ( /** @type {HTMLLinkElement} */ styleLink )
	{

		/** @type {Array.<String>} */
		const rel = styleLink.rel.split( ' ' );

		/** @type {Boolean} */
		const hasAlternate = rel.includes( StyleSwitch.ROLE.ALTERNATE ) || styleLink.hasAttribute( 'data-' + StyleSwitch.ROLE.ALTERNATE );

		/** @type {Boolean} */
		const hasTitle = ( ( 'title' in styleLink ) && styleLink.title !== '' ) || ( styleLink.hasAttribute( 'data-title' ) && styleLink.getAttribute( 'data-title' ) !== '' );

		/** @type { 'persistent' | 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */
		let role = /** @type { 'persistent' } */ ( StyleSwitch.ROLE.PERSISTENT );

		if ( hasAlternate && hasTitle ) {

			/** @type {HTMLLinkElement|null} */
			const possibleCloneOfPersistent = document.querySelector( `link[rel=stylesheet][href*="${ StyleSwitch.getOriginalHrefAttribute( styleLink ) }"]:not([title])` );

			role = possibleCloneOfPersistent ? /** @type { 'alternate (clone of persistent)'} */ ( StyleSwitch.ROLE.ALTERNATE_CLONE ) : /** @type { 'alternate' } */ ( StyleSwitch.ROLE.ALTERNATE );
		} else if ( !hasAlternate && hasTitle ) {
			role = /** @type { 'preferred' } */ ( StyleSwitch.ROLE.PREFERRED );
		}
		return role;
	}

	/** @returns {String} */
	static getOriginalHrefAttribute ( /** @type { HTMLLinkElement | HTMLOptionElement | HTMLInputElement | null } */ possibleElement )
	{
		if ( possibleElement ) {
			if ( possibleElement instanceof HTMLLinkElement ) {

				/** @type {NamedNodeMap} */
				const attributes = possibleElement.attributes;

				/** @type {Attr|null} */
				const possibleHref = attributes.getNamedItem( 'href' );

				if ( possibleHref ) {
					return possibleHref.value;
				}
			} else if ( possibleElement instanceof HTMLOptionElement || possibleElement instanceof HTMLInputElement ) {
				return possibleElement.value;
			}
		}
		return '';
	}

	/** @returns {String|null} */
	static getSelectedPath (
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {Event} */ transferredEvent
	)
	{

		/** @type {String} */
		let selectedPath = '';

		if ( !( transferredEvent.target && 'value' in transferredEvent.target ) ) {
			return null;
		}

		if ( 'type' in transferredEvent.target && transferredEvent.target.type === 'checkbox' && interestStyleSheets.length === 2 ) {
			if ( 'checked' in transferredEvent.target && transferredEvent.target.checked ) {
				selectedPath = StyleSwitch.getOriginalHrefAttribute( interestStyleSheets[ 1 ].reference );
			} else {
				selectedPath = StyleSwitch.getOriginalHrefAttribute( interestStyleSheets[ 0 ].reference );
			}
		} else { // select or radioList
			selectedPath = /** @type {String} */ ( transferredEvent.target.value );
		}
		return selectedPath;
	}

	static async switchStyleEvent (
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {{name: string, timeBeforeExpire: number, partitioned: boolean, path: string, sameSite: CookieSameSite }} */ cookieSettings,
		/** @type {Event} */ event
	)
	{
		if ( !( event.target && 'value' in event.target ) ) {
			return;
		}

		/** @type {Object.<string, {disabled: boolean, byNakedDay?: boolean}>} */
		const cookieObject = {};

		/** @type {String|null} */
		const selectedPath = StyleSwitch.getSelectedPath( interestStyleSheets, event );

		interestStyleSheets.forEach( function ( { /** @type {HTMLLinkElement|null} */ reference } )
		{

			/** @type {String} */
			const currentPath = StyleSwitch.getOriginalHrefAttribute( reference );

			/** @type {{disabled: boolean, byNakedDay?: boolean}} */
			const currentObject = {};

			currentObject.disabled = selectedPath === currentPath ? false : true;
			if (
				!event.isTrusted &&
				selectedPath === currentPath &&
				selectedPath === ''
			) { // set by Css Naked Day
				currentObject.byNakedDay = true;
			}
			cookieObject[ currentPath ] = currentObject;
		} );

		return await cookieStore.set( {
			name: cookieSettings.name,
			value: JSON.stringify( cookieObject ),
			expires: Date.now() + cookieSettings.timeBeforeExpire,
			partitioned: cookieSettings.partitioned,
			path: cookieSettings.path,
			sameSite: cookieSettings.sameSite,
		} );
	}

	/** @returns {{caption: String, title: String}} */
	getCaptionAndTitleForSwitch ( /** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets )
	{

		/** @type {Array.<String>} */
		const caption = [];

		/** @type {Array.<String>} */
		const title = [];

		/** @type {String} */
		const divider = this.settings.texts.switch.versusDividerForRadio;

		interestStyleSheets.forEach( ( { /** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */ role, /** @type {HTMLLinkElement|null} */ reference } ) =>
		{
			title.push( role );
			if ( reference ) {

				/** @type {String|null} */
				const possibleDataTitle = reference.getAttribute( 'data-title' );

				if ( reference.title ) {
					caption.push( reference.title );
				} else if ( possibleDataTitle ) {
					caption.push( possibleDataTitle );
				}
			} else { // not reference element means naked style
				caption.push( this.settings.texts.nakedStyleCaption );
			}
		} );
		if ( this.settings.texts.switch.caption ) {
			caption.length = 0;
			caption.push( this.settings.texts.switch.caption );
		}
		if ( this.settings.texts.switch.title ) {
			caption.length = 0;
			caption.push( this.settings.texts.switch.title );
		} else if ( this.settings.texts.caption ) {
			caption.length = 0;
			caption.push( this.settings.texts.caption );
		}
		return { caption: caption.join( divider ), title: title.join( divider ) };
	}

	/** @returns {String} */
	getCaptionForStyleSheet ( /** @type {HTMLLinkElement|null} */ possibleLinkElement )
	{
		if ( !possibleLinkElement ) {
			return this.settings.texts.nakedStyleCaption;
		}
		const linkElement = /** @type {HTMLLinkElement} */ ( possibleLinkElement );
		if ( linkElement.title && linkElement.title !== '' ) {
			return linkElement.title;
		}

		/** @type {String|null} */
		const possibleDataTitle = linkElement.getAttribute( 'data-title' );

		if ( possibleDataTitle ) {
			return possibleDataTitle;
		}
		return '';
	}

	/** @returns { 'preferred' | 'alternate' | 'alternate (clone of persistent)' | '' } */
	getTitleForStyleSheet ( /** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */ role )
	{
		if ( this.settings.resultSnippetAppearance.select.useRoleAsOptionTitle ) {
			return role;
		}
		return '';
	}

	/** @returns {void} */
	static setValueOnResultElementBy (
		/** @type {Object.<string, {disabled: boolean, byNakedDay?: boolean}>} */ cookieObject,
		/** @type { 'select' | 'radioList' | 'switch' | null } */ outputFormat,
		/** @type {HTMLElement} */ rootElement
	)
	{

		/** @type {Array.<String>} */
		const paths = Object.keys( cookieObject );

		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) {

			/** @type {String} */
			let checkedSideStyleSheet = paths[ 0 ];

			if ( checkedSideStyleSheet ) {

				/** @type {HTMLInputElement|null} */
				const possibleCheckboxElement = rootElement.querySelector( 'input[type=checkbox]' );

				/** @type {Boolean} */
				const isChecked = cookieObject[ checkedSideStyleSheet ].disabled;

				if ( possibleCheckboxElement ) {
					possibleCheckboxElement.checked = isChecked;
				}
			}
			return;
		}
		for ( const /** @type {String} */ path of paths ) {

			/** @type {Boolean} */
			const isDisabled = cookieObject[ path ].disabled;

			if ( isDisabled === false ) {

				/** @type { HTMLOptionElement | HTMLInputElement | null | undefined } */
				const possibleElement = rootElement.querySelector( `[value*="${ path }"]` );

				StyleSwitch.setCurrentSelection( possibleElement );
			}
		}
	}

	/**
	 * @description: Set input[type=checkbox] checked or not checked by currentlyActivatedPath (if presented) or to default style
	 * @returns {void}
	 */
	static setCurrentChecked (
		/** @type {HTMLElement} */ rootElement,
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {String|null} */ currentlyActivatedPath = null
	)
	{

		/** @type {HTMLInputElement|null} */
		const inputCheckboxElement = rootElement.querySelector( 'input[type=checkbox]' );

		if ( inputCheckboxElement === null ) {
			return;
		}

		if ( interestStyleSheets.length === 1 ) { // one stylesheet and naked style
			if ( interestStyleSheets[ 0 ].reference ) {
				inputCheckboxElement.checked === true;
			}
			return;
		}

		/** @type {Number} */
		let positionOfDefaultStyleSheet = 0; // default 0 means input.checked = false

		if ( currentlyActivatedPath === null ) { // use autodetect therefore
			positionOfDefaultStyleSheet = StyleSwitch.findCurrentSelectionPosition( interestStyleSheets ); // in this case returns 0 or 1 only (because switch = only 2 possible styles)
		} else {
			positionOfDefaultStyleSheet = StyleSwitch.findCurrentSelectionByPath( interestStyleSheets, currentlyActivatedPath ); // in this case returns 0 or 1 only (because switch = only 2 possible styles)
		}

		inputCheckboxElement.checked = positionOfDefaultStyleSheet ? true : false;
	}

	/** @returns {void} */
	static setCurrentSelection ( /** @type { HTMLOptionElement | HTMLInputElement | null | undefined } */ possibleElement )
	{
		if ( possibleElement ) {
			if ( possibleElement instanceof HTMLOptionElement ) { // StyleSwitch.OUTPUT_FORMATS.SELECT
				possibleElement.selected = true;
			} else if ( possibleElement instanceof HTMLInputElement ) { // StyleSwitch.OUTPUT_FORMATS.RADIOS
				possibleElement.checked = true;
			}
		}
	}

	/** @returns { HTMLOptionElement | HTMLInputElement | null } */
	static findDefaultSelection ( /** @type {HTMLElement} */ rootElement )
	{

		/** @type { HTMLOptionElement | HTMLInputElement | null } */
		let lastMediaPath = null;

		/** @type { HTMLOptionElement | HTMLInputElement | null } */
		let lastAlternateCloneOfPersistent = null;

		/** @type { NodeListOf<HTMLOptionElement | HTMLInputElement> } */
		const allPossibleChoices = rootElement.querySelectorAll( '[value]' );

		allPossibleChoices.forEach( ( /** @type { HTMLOptionElement | HTMLInputElement } */ element ) =>
		{

			/** @type { HTMLLinkElement | null } */
			const possibleLinkElement = document.querySelector( `link[rel~=stylesheet][href*="${ StyleSwitch.getOriginalHrefAttribute( element ) }"][title]` );

			if ( possibleLinkElement ) {
				if ( possibleLinkElement.media && window.matchMedia( possibleLinkElement.media ).matches ) {
					lastMediaPath = element;
				} else {

					/** @type { 'persistent' | 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */
					const role = StyleSwitch.getRoleFrom( possibleLinkElement );

					if ( role === StyleSwitch.ROLE.ALTERNATE_CLONE ) {
						lastAlternateCloneOfPersistent = element;
					}
				}
			}
		} );

		return lastMediaPath ? lastMediaPath : lastAlternateCloneOfPersistent;
	}

	/**
	 * @description Returns number of current StyleSheet position (array begins with 0)
	 * @returns {Number}
	 */
	static findCurrentSelectionPosition ( /** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets )
	{

		/** @type { Number | null } */
		let lastMediaPathPosition = null;

		/** @type { Number } */
		let lastAlternateCloneOfPersistentPosition = 0;

		/** @type { Number } */
		const interestStyleSheetsLength = interestStyleSheets.length;

		for ( let i = 0; i < interestStyleSheetsLength; i++ ) {

			/** @type { HTMLLinkElement | null } */
			const possibleLinkElement = interestStyleSheets[ i ].reference;

			if ( possibleLinkElement ) {
				if ( possibleLinkElement.media && window.matchMedia( possibleLinkElement.media ).matches ) {
					lastMediaPathPosition = i;
				} else if ( interestStyleSheets[ i ].role === StyleSwitch.ROLE.ALTERNATE_CLONE ) {
					lastAlternateCloneOfPersistentPosition = i;
				}
			}
		}

		return lastMediaPathPosition !== null ? lastMediaPathPosition : lastAlternateCloneOfPersistentPosition;
	}

	/**
	 * @description Returns number of StyleSheet position by assigned path (array begins with 0)
	 * @returns {Number}
	 */
	static findCurrentSelectionByPath (
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {String|null} */ currentlyActivatedPath
	)
	{

		/** @type { Number } */
		const interestStyleSheetsLength = interestStyleSheets.length;

		for ( let i = 0; i < interestStyleSheetsLength; i++ ) {

			/** @type {String} */
			const currentValue = StyleSwitch.getOriginalHrefAttribute( interestStyleSheets[ i ].reference );

			if ( currentValue === currentlyActivatedPath ) {
				return i;
			}
		}
		return 0;
	}

	/** @returns {void} */
	static setDefaultOnResultElement (
		/** @type { 'select' | 'radioList' | 'switch' | null } */ outputFormat,
		/** @type {HTMLElement} */ rootElement,
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets
	)
	{
		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) { /// @todo : otestovat na tmavém i světlém motivu windows
			StyleSwitch.setCurrentChecked( rootElement, interestStyleSheets );
		} else { // StyleSwitch.OUTPUT_FORMATS.SELECT and StyleSwitch.OUTPUT_FORMATS.RADIOS

			/** @type { HTMLOptionElement | HTMLInputElement | null } */
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( rootElement );

			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
	}

	/** @returns {void} */
	static preferredColorSchemeChangeListener (
		/** @type { 'select' | 'radioList' | 'switch' | null } */ outputFormat,
		/** @type {String} */ cookieName,
		/** @type {HTMLElement} */ rootElement,
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets
		/** @type {MediaQueryListEvent} event */
	)
	{
		cookieStore.delete( {
			name: cookieName,
		} );

		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) {
			StyleSwitch.setCurrentChecked( rootElement, interestStyleSheets );
		} else { // StyleSwitch.OUTPUT_FORMATS.SELECT and StyleSwitch.OUTPUT_FORMATS.RADIOS

			/** @type { HTMLOptionElement | HTMLInputElement | null } */
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( rootElement );

			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
	}

	static cookieChangeListener (
		/** @type { 'select' | 'radioList' | 'switch' | null } */ outputFormat,
		/** @type {String} */ cookieName,
		/** @type {HTMLElement} */ rootElement,
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {CookieChangeEvent} */ event
	)
	{

		/** @type {CookieListItem|undefined} */
		const possibleChangedCookie = event.changed.find( cookie => cookie.name === cookieName );

		if ( possibleChangedCookie && possibleChangedCookie.value ) {

			/** @type {Object.<string, {disabled: boolean, byNakedDay?: boolean}>} */
			const cookieObject = JSON.parse( possibleChangedCookie.value );

			StyleSwitch.setValueOnResultElementBy( cookieObject, outputFormat, rootElement );
		}

		/** @type {CookieListItem|undefined} */
		const possibleDeletedCookie = event.deleted.find( cookie => cookie.name === cookieName );

		if ( possibleDeletedCookie ) {
			StyleSwitch.setDefaultOnResultElement( outputFormat, rootElement, interestStyleSheets );
		}
	}
}

/**
 * @class
 * @description public exportable part
 * @extends StyleSwitchInternal
 * @returns {Function}
 */
class StyleSwitch extends StyleSwitchInternal
{
	constructor ( /** @type {String} */ settingsElementId = 'style-switch-settings' )
	{
		super( ...arguments );
		if ( this.settings.autoRun ) {
			this.run();
		}
	}

	/** @returns {void} */
	checkRequirements ()
	{
		if ( !( 'cookieStore' in window ) ) {
			throw new Error( 'Your browser not support cookieStore API ( https://developer.mozilla.org/en-US/docs/Web/API/CookieStore ) StyleSwitch cannot continue :(' );
		}
		if ( !this.settings ) {
			throw new Error( 'Settings object is missing' );
		}
	}

	/** @returns {void} */
	prepareRootElement ()
	{

		/** @type {HTMLDocument|null} */
		const possibleRootElement = document.querySelector( this.settings.rootElementQS );

		if ( possibleRootElement ) {
			this.rootElement = possibleRootElement;
		} else {
			this.rootElement = document.createElement( this.settings.resultSnippetAppearance.defaultResultSnippetElement );
		}
	}

	/** @returns {Promise.<{currentlyActivatedPath: String|null, byNakedDay: Boolean}>} */
	async getCurrentlyActivatedStyleSheetsPath ()
	{

		/** @type {String | null} */
		let foundPath = null;

		/** @type {Boolean} */
		let byNakedDay = false;

		/** @type {CookieListItem | null} */
		const cookie = await cookieStore.get( this.settings.cookie.name );

		if ( cookie && cookie.value ) {

			/** @type {Object.<string, {disabled: boolean, byNakedDay?: boolean}>} */
			const styles = JSON.parse( cookie.value );

			/** @type {Array.<String>} */
			const paths = Object.keys( styles );

			for ( /** @type {String} */ const path of paths ) {

				/** @type {Boolean} */
				const isDisabled = styles[ path ].disabled;

				/** @type {Boolean | undefined} */
				const isSetByNakedDay = styles[ path ].byNakedDay;

				if ( isDisabled === false ) {
					foundPath = path;
					if ( isSetByNakedDay ) {
						byNakedDay = true;
					}
					break;
				}
			}
		}
		return { currentlyActivatedPath: foundPath, byNakedDay: byNakedDay };
	}

	/**
	 * @description count of preferred and alternate styles (not persistent), without duplicates (2 link elements, with same path, but different role)
	 * @returns {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>}
	 */
	getCleanedStyleSheetsObject ()
	{

		/** @type {NodeListOf<HTMLLinkElement>|null} */
		const styleLinks = document.querySelectorAll( this.settings.styleLinksQSA ); // cannot use document.styleSheets here!, some alternate styles may not be loaded yet

		/** @type {Set.<String>} */
		const styleSheetPaths = new Set();

		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */
		const result = [];

		if ( styleLinks ) {
			styleLinks.forEach( function ( /** @type {HTMLLinkElement} */ styleLink )
			{

				/** @type { 'persistent' | 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */
				const role = StyleSwitch.getRoleFrom( styleLink );

				if ( role !== StyleSwitch.ROLE.PERSISTENT && !styleSheetPaths.has( styleLink.href ) ) {
					styleSheetPaths.add( styleLink.href ); // just to prevent duplicates
					result.push( {
						role: /** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */ ( role ),
						reference: styleLink
					} );
				}
			} );
		}
		if ( this.settings.nakedStyle.use && this.settings.texts.nakedStyleCaption ) {
			result.push( {
				role: /** @type { 'alternate' } */ ( StyleSwitch.ROLE.ALTERNATE ),
				reference: null // reference null means naked style document
			} );
		}
		if ( this.settings.resultSnippetAppearance.reverseOrder ) {
			result.reverse();
		}
		return result;
	}

	/** @returns { 'select' | 'radioList' | 'switch' | null } */
	determineTypeOfOutputElement ( /** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets )
	{
		if ( interestStyleSheets.length <= 1 ) {
			return null;
		}

		if ( interestStyleSheets.length === 2 && this.settings.resultSnippetAppearance.switch.useSwitchIfPossible ) {
			return /** @type {'switch'} */ ( StyleSwitch.OUTPUT_FORMATS.SWITCH );
		} else if ( this.settings.resultSnippetAppearance.outputFormat === StyleSwitch.OUTPUT_FORMATS.RADIOS ) {
			return /** @type {'radioList'} */ ( StyleSwitch.OUTPUT_FORMATS.RADIOS );
		} else { // StyleSwitch.OUTPUT_FORMATS.SELECT as default
			return /** @type {'select'} */ ( StyleSwitch.OUTPUT_FORMATS.SELECT );
		}
	}

	/** @returns {void} */
	createSwitch (
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {String|null} */ currentlyActivatedPath = null
	)
	{

		/** @type {String} */
		const id = this.settings.resultSnippetAppearance.idPrefix + Math.random().toString( 36 );

		/** @type {HTMLLabelElement} */
		const labelElement = document.createElement( 'label' );

		/** @type {HTMLElement} */
		const captionElement = document.createElement( this.settings.resultSnippetAppearance.switch.captionElementName );

		/** @type {HTMLInputElement} */
		const inputElement = document.createElement( 'input' );

		/** @type {HTMLSpanElement} */
		const visualSwitchElement = document.createElement( 'span' );

		/** @type {HTMLSpanElement} */
		const stateElement = document.createElement( 'span' );

		/** @type {HTMLElement} */
		const statusOnElement = document.createElement( this.settings.resultSnippetAppearance.switch.statusElementName );

		/** @type {HTMLElement} */
		const statusOffElement = document.createElement( this.settings.resultSnippetAppearance.switch.statusElementName );

		/** @type {{caption: String, title: String}} */
		const { caption, title } = this.getCaptionAndTitleForSwitch( interestStyleSheets );

		labelElement.htmlFor = id;
		labelElement.classList.add( this.settings.resultSnippetAppearance.switch.labelClassName );
		labelElement.title = title;
		captionElement.appendChild( document.createTextNode( caption ) );
		inputElement.type = 'checkbox';
		inputElement.id = id;
		inputElement.role = 'switch';
		inputElement.addEventListener( 'change', StyleSwitch.switchStyleEvent.bind( null, interestStyleSheets, this.settings.cookie ), {
			capture: false,
			once: false,
			passive: true
		} );
		visualSwitchElement.classList.add( this.settings.resultSnippetAppearance.switch.visualSwitchClassName );
		stateElement.classList.add( this.settings.resultSnippetAppearance.switch.stateClassName );
		statusOnElement.classList.add( 'boolean', 'on' );
		statusOnElement.ariaHidden = 'true';
		statusOnElement.appendChild( document.createTextNode( this.settings.texts.switch.stateOnCaption ) );
		statusOffElement.classList.add( 'boolean', 'off' );
		statusOffElement.ariaHidden = 'true';
		statusOffElement.appendChild( document.createTextNode( this.settings.texts.switch.stateOffCaption ) );

		labelElement.appendChild( captionElement );
		labelElement.appendChild( inputElement );
		labelElement.appendChild( visualSwitchElement );
		stateElement.appendChild( statusOnElement );
		stateElement.appendChild( statusOffElement );
		labelElement.appendChild( stateElement );
		this.rootElement.appendChild( labelElement );
		StyleSwitch.setCurrentChecked( this.rootElement, interestStyleSheets, currentlyActivatedPath );
	}

	/** @returns {void} */
	createRadioList (
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {String|null} */ currentlyActivatedPath = null
	)
	{

		/** @type {String} */
		const id = this.settings.resultSnippetAppearance.idPrefix + Math.random().toString( 36 );

		/** @type {HTMLElement} */
		const captionElement = document.createElement( this.settings.resultSnippetAppearance.radioList.captionElementName );

		/** @type {HTMLUListElement} */
		const ulElement = document.createElement( 'ul' );

		/** @type {String} */
		const groupCaption = this.settings.texts.radioList.caption ? this.settings.texts.radioList.caption : this.settings.texts.caption;

		captionElement.id = id;
		captionElement.appendChild( document.createTextNode( groupCaption ) );
		ulElement.role = 'radiogroup';
		ulElement.setAttribute( 'aria-labelledby', id );
		ulElement.tabIndex = 0;
		interestStyleSheets.forEach( ( { /** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */ role, /** @type {HTMLLinkElement|null} */ reference } ) =>
		{

			/** @type {HTMLLIElement} */
			const liElement = document.createElement( 'li' );

			/** @type {HTMLLabelElement} */
			const labelElement = document.createElement( 'label' );

			/** @type {HTMLInputElement} */
			const radioElement = document.createElement( 'input' );

			/** @type {String} */
			const currentCaption = this.getCaptionForStyleSheet( reference );

			/** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' | '' } */
			const currentTitle = this.getTitleForStyleSheet( role );

			/** @type {String} */
			const currentValue = StyleSwitch.getOriginalHrefAttribute( reference );

			/** @type {Boolean} */
			const currentIsChecked = currentlyActivatedPath === currentValue ? true : false;

			radioElement.type = 'radio';
			radioElement.name = id;
			radioElement.value = currentValue;
			radioElement.checked = currentIsChecked;
			radioElement.addEventListener( 'change', StyleSwitch.switchStyleEvent.bind( null, interestStyleSheets, this.settings.cookie ), {
				capture: false,
				once: false,
				passive: true
			} );
			labelElement.appendChild( radioElement );
			labelElement.appendChild( document.createTextNode( currentCaption ) );
			liElement.appendChild( labelElement );
			liElement.title = currentTitle;
			ulElement.appendChild( liElement );
		} );
		this.rootElement.appendChild( captionElement );
		if ( currentlyActivatedPath === null ) { // in case no cookie exists

			/** @type { HTMLOptionElement | HTMLInputElement | null } */
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( ulElement );

			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
		this.rootElement.appendChild( ulElement );
	}

	/** @returns {void} */
	createSelect (
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets,
		/** @type {String|null} */ currentlyActivatedPath = null
	)
	{

		/** @type {String} */
		const id = this.settings.resultSnippetAppearance.idPrefix + Math.random().toString( 36 );

		/** @type {HTMLLabelElement} */
		const labelElement = document.createElement( 'label' );

		/** @type {HTMLElement} */
		const captionElement = document.createElement( this.settings.resultSnippetAppearance.select.captionElementName );

		/** @type {HTMLSelectElement} */
		const selectElement = document.createElement( 'select' );

		/** @type {String} */
		const selectCaption = this.settings.texts.select.caption ? this.settings.texts.select.caption : this.settings.texts.caption;

		/** @type {HTMLOptGroupElement|null} */
		let possibleOptGroupForStyles = null;

		/** @type {HTMLOptGroupElement|null} */
		let possibleOptGroupForNaked = null;

		if ( this.settings.texts.select.optGroupLabelForStyles ) {
			possibleOptGroupForStyles = document.createElement( 'optgroup' );
			possibleOptGroupForStyles.label = this.settings.texts.select.optGroupLabelForStyles;
		}
		if ( this.settings.texts.select.otpGroupLabelForNaked ) {
			possibleOptGroupForNaked = document.createElement( 'optgroup' );
			possibleOptGroupForNaked.label = this.settings.texts.select.otpGroupLabelForNaked;
		}
		labelElement.htmlFor = id;
		captionElement.appendChild( document.createTextNode( selectCaption ) );
		selectElement.id = id;
		selectElement.addEventListener( 'change', StyleSwitch.switchStyleEvent.bind( null, interestStyleSheets, this.settings.cookie ), {
			capture: false,
			once: false,
			passive: true
		} );
		interestStyleSheets.forEach( ( { /** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' } */ role, /** @type {HTMLLinkElement|null} */ reference } ) =>
		{

			/** @type {HTMLOptionElement} */
			const optionElement = document.createElement( 'option' );

			/** @type {String} */
			const currentCaption = this.getCaptionForStyleSheet( reference );

			/** @type { 'preferred' | 'alternate' | 'alternate (clone of persistent)' | '' } */
			const currentTitle = this.getTitleForStyleSheet( role );

			/** @type {String} */
			const currentValue = StyleSwitch.getOriginalHrefAttribute( reference );

			/** @type {Boolean} */
			const currentIsSelected = currentlyActivatedPath === currentValue ? true : false;

			optionElement.selected = currentIsSelected;
			optionElement.title = currentTitle;
			optionElement.value = currentValue;
			optionElement.appendChild( document.createTextNode( currentCaption ) );
			if ( possibleOptGroupForStyles && reference ) {
				possibleOptGroupForStyles.appendChild( optionElement );
			} else if ( possibleOptGroupForNaked && !reference ) {
				possibleOptGroupForNaked.appendChild( optionElement );
			} else {
				selectElement.appendChild( optionElement );
			}
		} );
		if ( possibleOptGroupForStyles ) {
			selectElement.appendChild( possibleOptGroupForStyles );
		}
		if ( possibleOptGroupForNaked ) {
			selectElement.appendChild( possibleOptGroupForNaked );
		}
		labelElement.appendChild( captionElement );
		labelElement.appendChild( selectElement );
		if ( currentlyActivatedPath === null ) { // in case no cookie exists

			/** @type { HTMLOptionElement | HTMLInputElement | null } */
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( labelElement );

			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
		this.rootElement.appendChild( labelElement );
	}

	/**
	 * @description automatically set naked style if it's Css Naked Day
	 * @returns {void}
	 */
	celebrateNakedDay ( /** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets )
	{

		/** @type {Date} */
		const today = new Date();

		/** @type {Number} */
		const currentMonth = today.getMonth();

		/** @type {Number} */
		const currentDay = today.getDate();

		if (
			this.settings.nakedStyle.use &&
			this.settings.nakedStyle.celebrateNakedDay.switchAutomatically &&
			currentMonth === this.settings.nakedStyle.celebrateNakedDay.monthNumber &&
			currentDay === this.settings.nakedStyle.celebrateNakedDay.dayNumber
		) {

			/** @type {Event} */
			const fakeChangeEvent = new Event( 'change' );

			Object.defineProperty( fakeChangeEvent, 'target', {
				value: {
					value: '', // empty string in target.value means naked style
				},
				configurable: true,
				enumerable: false,
				writable: true,
			} );
			StyleSwitch.switchStyleEvent( interestStyleSheets, this.settings.cookie, fakeChangeEvent );
		}
	}

	/** @returns {void} */
	cancelNakedDay ( /** @type {Boolean} */ byNakedDay )
	{
		if ( byNakedDay ) {

			/** @type {Date} */
			const today = new Date();

			/** @type {Number} */
			const currentMonth = today.getMonth();

			/** @type {Number} */
			const currentDay = today.getDate();

			if (
				currentMonth !== this.settings.nakedStyle.celebrateNakedDay.monthNumber ||
				currentDay !== this.settings.nakedStyle.celebrateNakedDay.dayNumber
			) {
				cookieStore.delete( {
					name: this.settings.cookie.name,
				} );
			}
		}
	}

	/**
	 * @description : on change or delete cookie with styles… it changes selected value on root element
	 * @returns {void}
	 */
	swapSelectionOnCookieChange (
		/** @type { 'select' | 'radioList' | 'switch' | null } */ outputFormat,
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets
	)
	{
		if ( !this.rootElement ) {
			return;
		}

		/** @type {String} */
		const cookieName = this.settings.cookie.name;

		/** @type {HTMLElement} */
		const rootElement = this.rootElement;

		cookieStore.addEventListener( 'change', StyleSwitch.cookieChangeListener.bind( null, outputFormat, cookieName, rootElement, interestStyleSheets ), {
			capture: false,
			once: false,
			passive: true
		} );
	}

	/** @returns {void} */
	swapSelectionOnPreferredColorSchemeChange (
		/** @type { 'select' | 'radioList' | 'switch' | null } */ outputFormat,
		/** @type {String|null} */ currentlyActivatedPath,
		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */ interestStyleSheets
	)
	{
		if ( this.settings.resultSnippetAppearance.preferredColorSchemeChangeBehavior === StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR.NEVER ) {
			return;
		}
		if (
			this.settings.resultSnippetAppearance.preferredColorSchemeChangeBehavior === StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR.ONLY_WITHOUT_COOKIE &&
			currentlyActivatedPath
		) {
			return;
		}

		/** @type {String} */
		const cookieName = this.settings.cookie.name;

		/** @type {HTMLElement} */
		const rootElement = this.rootElement;

		window.matchMedia( '(prefers-color-scheme: dark)' ).addEventListener( 'change', StyleSwitch.preferredColorSchemeChangeListener.bind( null, outputFormat, cookieName, rootElement, interestStyleSheets ), {
			capture: false,
			once: false,
			passive: true
		} );
	}

	/** @returns {Promise.<HTMLDivElement|null>} */
	async run ()
	{
		this.checkRequirements();
		this.prepareRootElement();

		/** @type {{currentlyActivatedPath: String|null, byNakedDay: Boolean}} */
		const { currentlyActivatedPath, byNakedDay } = await this.getCurrentlyActivatedStyleSheetsPath();

		/** @type {Array.<{role: 'preferred' | 'alternate' | 'alternate (clone of persistent)', reference: ?HTMLLinkElement}>} */
		const interestStyleSheets = this.getCleanedStyleSheetsObject(); // without duplicates and persistent styleSheets

		this.celebrateNakedDay( interestStyleSheets );
		this.cancelNakedDay( byNakedDay );

		/** @type { 'select' | 'radioList' | 'switch' | null } */
		const outputFormat = this.determineTypeOfOutputElement( interestStyleSheets );

		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) {
			this.createSwitch( interestStyleSheets, currentlyActivatedPath );
		} else if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.RADIOS ) {
			this.createRadioList( interestStyleSheets, currentlyActivatedPath );
		} else if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SELECT ) {
			this.createSelect( interestStyleSheets, currentlyActivatedPath );
		} else {
			return null;
		}
		this.swapSelectionOnCookieChange( outputFormat, interestStyleSheets );
		this.swapSelectionOnPreferredColorSchemeChange( outputFormat, currentlyActivatedPath, interestStyleSheets );
		return this.rootElement;
	}
};

Object.defineProperty( StyleSwitch, 'ROLE', {
	value: {
		PERSISTENT: 'persistent',
		PREFERRED: 'preferred',
		ALTERNATE: 'alternate',
		ALTERNATE_CLONE: 'alternate (clone of persistent)',
	},
	configurable: false,
	enumerable: true,
	writable: false,
} );

Object.defineProperty( StyleSwitch, 'SETTINGS_URL_PARAMETER', {
	value: 'settings',
	configurable: false,
	enumerable: false,
	writable: false,
} );

Object.defineProperty( StyleSwitch, 'OUTPUT_FORMATS', {
	value: {
		SWITCH: 'switch',
		SELECT: 'select',
		RADIOS: 'radioList',
	},
	configurable: false,
	enumerable: true,
	writable: false,
} );

Object.defineProperty( StyleSwitch, 'PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR', {
	value: {
		NEVER: 'never',
		ALWAYS: 'always',
		ONLY_WITHOUT_COOKIE: 'onlyWithoutCookie',
	},
	configurable: false,
	enumerable: true,
	writable: false,
} );

/** @returns {HTMLDocument|null} */
const result = await ( new StyleSwitch() );

export { StyleSwitch, result };
