"use strict";

//@ts-check

/**
 * @class
 * @file style-switch.mjs
 * @implements {Classes.StyleSwitchInternal}
 */
class StyleSwitchInternal
{

	/** @type {Types.Settings} */
	#settings = StyleSwitch.DEFAULT_SETTINGS;

	/** @type {Classes.StyleSwitchInternal['settings']} */
	get settings ()
	{
		return this.#settings;
	}
	set settings ( /** @type {Partial<Types.Settings>} */ newSettings )
	{
		this.#settings = /** @type {Types.Settings} */ ( StyleSwitchInternal.#deepAssign( this.#settings, newSettings ) );
	}

	/** @type {HTMLElement} */
	#rootElement = HTMLElement.prototype;

	/** @type {Classes.StyleSwitchInternal['rootElement']} */
	get rootElement ()
	{
		return this.#rootElement;
	}
	/** @type {Classes.StyleSwitchInternal['rootElement']} */
	set rootElement ( /** @type {HTMLElement} */ rootElement )
	{
		if ( rootElement && rootElement instanceof HTMLElement ) {
			this.#rootElement = rootElement;
		} else {
			throw new Error( 'Not a valid HTMLElement' );
		}
	}

	/**
	 * @template T
	 * @param {...T} customArgs
	 * @returns {T}
	 */
	static #deepAssign ( /** @type {Array.<any>} */ ...customArgs )
	{

		/** @type {T & Object<string, any>} */
		let currentLevel = /** @type {T & Object<string, any>} */ ( {} );

		loopThroughAllCustomArgs:
		customArgs.forEach( ( /** @type {Object} */ source ) =>
		{
			if ( source instanceof Array ) {
				currentLevel = /** @type {T & Object<string, any>} */ ( source );
			} else if ( source !== null ) {
				loopThroughKeyValPairsObject:
				Object.entries( source ).forEach( ( [ key, value ] ) =>
				{
					if ( value instanceof Object && key in currentLevel ) {
						value = StyleSwitchInternal.#deepAssign( currentLevel[ key ], value );
					}
					currentLevel = /** @type {T & Object<string, any>} */ ( { ...currentLevel, [ key ]: value } );
				} );
			}
		} );

		return /** @type {T} */ ( currentLevel );
	}

	/** @type {Classes.StyleSwitchInternal.getRoleFrom} */
	static getRoleFrom ( styleLink )
	{
		const rel = styleLink.rel.split( ' ' );
		const hasAlternate = rel.includes( StyleSwitch.ROLE.ALTERNATE ) || styleLink.hasAttribute( 'data-' + StyleSwitch.ROLE.ALTERNATE );
		const hasTitle = ( ( 'title' in styleLink ) && styleLink.title !== '' ) || ( styleLink.hasAttribute( 'data-title' ) && styleLink.getAttribute( 'data-title' ) !== '' );

		if ( hasAlternate && hasTitle ) {
			const possibleCloneOfPersistent = document.querySelector( `link[rel=stylesheet][href*="${ StyleSwitch.getOriginalHrefAttribute( styleLink ) }"]:not([title])` );
			return possibleCloneOfPersistent ? StyleSwitch.ROLE.ALTERNATE_CLONE : StyleSwitch.ROLE.ALTERNATE;
		} else if ( !hasAlternate && hasTitle ) {
			return StyleSwitch.ROLE.PREFERRED;
		}
		return StyleSwitch.ROLE.PERSISTENT;
	}

	/** @type {Classes.StyleSwitchInternal.getOriginalHrefAttribute} */
	static getOriginalHrefAttribute ( possibleElement )
	{
		if ( possibleElement ) {
			if ( possibleElement instanceof HTMLLinkElement ) {
				const attributes = possibleElement.attributes;
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

	/** @type {Classes.StyleSwitchInternal.getSelectedPath} */
	static getSelectedPath ( interestStyleSheets, transferredEvent )
	{
		const eventTarget = /** @type {Types.PossibleOutputElement} */ ( transferredEvent.target );

		if ( !eventTarget ) {
			return null;
		}

		if ( 'type' in eventTarget && eventTarget.type === 'checkbox' && interestStyleSheets.length === 2 ) {
			if ( eventTarget.checked ) {
				return StyleSwitch.getOriginalHrefAttribute( interestStyleSheets[ 1 ].reference );
			} else {
				return StyleSwitch.getOriginalHrefAttribute( interestStyleSheets[ 0 ].reference );
			}
		} else { // select or radioList
			return eventTarget.value;
		}
	}

	/** @type {Classes.StyleSwitchInternal.switchStyleEvent} */
	static async switchStyleEvent ( interestStyleSheets, cookieSettings, event )
	{
		if ( !( event.target && 'value' in event.target ) ) {
			return;
		}

		/** @type {Types.ResultCookieObject} */
		const cookieObject = {};

		const selectedPath = StyleSwitch.getSelectedPath( interestStyleSheets, event );

		loopThroughLinkElements:
		interestStyleSheets.forEach( function ( { reference } )
		{

			/** @type {{disabled: boolean, byNakedDay?: boolean}} */
			const currentObject = {};

			const currentPath = StyleSwitch.getOriginalHrefAttribute( reference );

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

	/** @type {Classes.StyleSwitchInternal.setValueOnResultElementBy} */
	static setValueOnResultElementBy ( cookieObject, outputFormat, rootElement )
	{
		const paths = Object.keys( cookieObject );
		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) {
			let checkedSideStyleSheet = paths[ 0 ];
			if ( checkedSideStyleSheet ) {

				/** @type {?HTMLInputElement} */
				const possibleCheckboxElement = rootElement.querySelector( 'input[type=checkbox]' );

				const isChecked = cookieObject[ checkedSideStyleSheet ].disabled;
				if ( possibleCheckboxElement ) {
					possibleCheckboxElement.checked = isChecked;
				}
			}
			return;
		}
		loopThroughStyleSheetsPaths:
		for ( const path of paths ) {
			const isDisabled = cookieObject[ path ].disabled;
			if ( isDisabled === false ) {

				/** @type { Types.PossibleOutputElement } */
				const possibleElement = rootElement.querySelector( `[value*="${ path }"]` );

				StyleSwitch.setCurrentSelection( possibleElement );
			}
		}
	}

	/** @type {Classes.StyleSwitchInternal.setCurrentChecked} */
	static setCurrentChecked ( rootElement, interestStyleSheets, currentlyActivatedPath = null )
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
		let positionOfDefaultStyleSheet = 0; // default 0 means input.checked = false
		if ( currentlyActivatedPath === null ) { // use autodetect therefore
			positionOfDefaultStyleSheet = StyleSwitch.findCurrentSelectionPosition( interestStyleSheets ); // in this case returns 0 or 1 only (because switch = only 2 possible styles)
		} else {
			positionOfDefaultStyleSheet = StyleSwitch.findCurrentSelectionByPath( interestStyleSheets, currentlyActivatedPath ); // in this case returns 0 or 1 only (because switch = only 2 possible styles)
		}
		inputCheckboxElement.checked = positionOfDefaultStyleSheet ? true : false;
	}

	/** @type {Classes.StyleSwitchInternal.setCurrentSelection} */
	static setCurrentSelection ( possibleElement )
	{
		if ( possibleElement ) {
			if ( possibleElement instanceof HTMLOptionElement ) { // StyleSwitch.OUTPUT_FORMATS.SELECT
				possibleElement.selected = true;
			} else if ( possibleElement instanceof HTMLInputElement ) { // StyleSwitch.OUTPUT_FORMATS.RADIOS
				possibleElement.checked = true;
			}
		}
	}

	/** @type { Classes.StyleSwitchInternal.findDefaultSelection } */
	static findDefaultSelection ( rootElement )
	{

		/** @type { Types.PossibleOutputElement } */
		let lastMediaPath = null;

		/** @type { Types.PossibleOutputElement } */
		let lastAlternateCloneOfPersistent = null;

		/** @type { NodeListOf<HTMLOptionElement | HTMLInputElement> } */
		const allPossibleChoices = rootElement.querySelectorAll( '[value]' );

		loopThroughCreatedFormElements:
		allPossibleChoices.forEach( ( element ) =>
		{

			/** @type { ?HTMLLinkElement } */
			const possibleLinkElement = document.querySelector( `link[rel~=stylesheet][href*="${ StyleSwitch.getOriginalHrefAttribute( element ) }"][title]` );

			if ( possibleLinkElement ) {
				if ( possibleLinkElement.media && window.matchMedia( possibleLinkElement.media ).matches ) {
					lastMediaPath = element;
				} else {
					const role = StyleSwitch.getRoleFrom( possibleLinkElement );
					if ( role === StyleSwitch.ROLE.ALTERNATE_CLONE ) {
						lastAlternateCloneOfPersistent = element;
					}
				}
			}
		} );

		return lastMediaPath ? lastMediaPath : lastAlternateCloneOfPersistent;
	}

	/** @type {Classes.StyleSwitchInternal.findCurrentSelectionPosition} */
	static findCurrentSelectionPosition ( interestStyleSheets )
	{

		/** @type { ?Number } */
		let lastMediaPathPosition = null;

		let lastAlternateCloneOfPersistentPosition = 0;
		const interestStyleSheetsLength = interestStyleSheets.length;

		loopThroughStyleSheetsWithRoles:
		for ( let i = 0; i < interestStyleSheetsLength; i++ ) {
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

	/** @type {Classes.StyleSwitchInternal.findCurrentSelectionByPath} */
	static findCurrentSelectionByPath ( interestStyleSheets, currentlyActivatedPath )
	{
		const interestStyleSheetsLength = interestStyleSheets.length;
		loopThroughStyleSheetsWithRoles:
		for ( let i = 0; i < interestStyleSheetsLength; i++ ) {
			const currentValue = StyleSwitch.getOriginalHrefAttribute( interestStyleSheets[ i ].reference );
			if ( currentValue === currentlyActivatedPath ) {
				return i;
			}
		}
		return 0;
	}

	/** @type {Classes.StyleSwitchInternal.setDefaultOnResultElement} */
	static setDefaultOnResultElement ( outputFormat, rootElement, interestStyleSheets )
	{
		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) {
			StyleSwitch.setCurrentChecked( rootElement, interestStyleSheets, null );
		} else { // StyleSwitch.OUTPUT_FORMATS.SELECT and StyleSwitch.OUTPUT_FORMATS.RADIOS
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( rootElement );
			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
	}

	/** @type {Classes.StyleSwitchInternal.preferredColorSchemeChangeListener} */
	static preferredColorSchemeChangeListener ( outputFormat, cookieName, rootElement, interestStyleSheets, /* event */ )
	{
		cookieStore.delete( {
			name: cookieName,
		} );

		if ( outputFormat === StyleSwitch.OUTPUT_FORMATS.SWITCH ) {
			StyleSwitch.setCurrentChecked( rootElement, interestStyleSheets, null );
		} else { // StyleSwitch.OUTPUT_FORMATS.SELECT and StyleSwitch.OUTPUT_FORMATS.RADIOS
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( rootElement );
			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
	}

	/** @type {Classes.StyleSwitchInternal.cookieChangeListener} */
	static cookieChangeListener ( outputFormat, cookieName, rootElement, interestStyleSheets, event )
	{

		/** @type {CookieListItem|true|undefined} */
		let possibleDeletedCookie = event.deleted.find( cookie => cookie.name === cookieName );

		const possibleChangedCookie = event.changed.find( cookie => cookie.name === cookieName );
		if ( possibleChangedCookie ) {
			if ( possibleChangedCookie.value === '' ) { // empty value means same behavior like deleted cookie
				possibleDeletedCookie = true;
			} else if ( possibleChangedCookie.value ) {

				/** @type {Object.<string, {disabled: boolean, byNakedDay?: boolean}>} */
				const cookieObject = JSON.parse( possibleChangedCookie.value );

				StyleSwitch.setValueOnResultElementBy( cookieObject, outputFormat, rootElement );
			}
		}
		if ( possibleDeletedCookie ) {
			StyleSwitch.setDefaultOnResultElement( outputFormat, rootElement, interestStyleSheets );
		}
	}

	/** @type {Classes.StyleSwitchInternal['constructor']} */
	constructor ( settingsElementId = 'style-switch-settings' )
	{
		const searchParams = new URL( import.meta.url ).searchParams;
		if ( searchParams.has( StyleSwitch.SETTINGS_URL_PARAMETER ) ) {
			const jsonInString = searchParams.get( StyleSwitch.SETTINGS_URL_PARAMETER );
			if ( jsonInString ) {
				this.settings = JSON.parse( jsonInString );
			}
		}
		const settingsElement = document.getElementById( settingsElementId );
		if ( settingsElement && settingsElement instanceof HTMLScriptElement ) {
			const jsonInElement = settingsElement;
			this.settings = JSON.parse( jsonInElement.text );
		}
	}

	/** @type {Classes.StyleSwitchInternal['getCaptionAndTitleForSwitch']} */
	getCaptionAndTitleForSwitch ( interestStyleSheets )
	{

		/** @type {Array.<String>} */
		const caption = [];

		/** @type {Array.<String>} */
		const title = [];

		const divider = this.settings.texts.switch.versusDividerForRadio;
		loopThroughStyleSheetsWithRoles:
		interestStyleSheets.forEach( ( { role, reference } ) =>
		{
			title.push( role );
			if ( reference ) {
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

	/** @type {Classes.StyleSwitchInternal['getCaptionForStyleSheet']} */
	getCaptionForStyleSheet ( possibleLinkElement )
	{
		if ( !possibleLinkElement ) {
			return this.settings.texts.nakedStyleCaption;
		}
		const linkElement = possibleLinkElement;
		if ( linkElement.title && linkElement.title !== '' ) {
			return linkElement.title;
		}
		const possibleDataTitle = linkElement.getAttribute( 'data-title' );
		if ( possibleDataTitle ) {
			return possibleDataTitle;
		}
		return '';
	}

	/** @type {Classes.StyleSwitchInternal['getTitleForStyleSheet']} */
	getTitleForStyleSheet ( role )
	{
		if ( this.settings.resultSnippetAppearance.select.useRoleAsOptionTitle ) {
			return role;
		}
		return null;
	}

}

/**
 * @class
 * @extends StyleSwitchInternal
 * @implements {Classes.StyleSwitch}
 * @version 1.3
 * @file style-switch.mjs
 * @license CC-BY-SA-4.0
 * @author ic<ic.czech+style-switch@gmail.com>
 * @see {@link https://github.com/iiic/StyleSwitch|GitHub}
 * @see {@link https://iiic.dev/style-switch#github|homepage}
 * @returns {Function}
 */
class StyleSwitch extends StyleSwitchInternal
{

	/** @type { Classes.StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR } */
	static get PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR ()
	{
		return {
			NEVER: /** @type {Enums.PreferredColorSchemeChangeBehavior} */ ( 'never' ),
			ALWAYS: /** @type {Enums.PreferredColorSchemeChangeBehavior} */ ( 'always' ),
			ONLY_WITHOUT_COOKIE: /** @type {Enums.PreferredColorSchemeChangeBehavior} */ ( 'onlyWithoutCookie' ),
		};
	}

	/** @type { Classes.StyleSwitch.OUTPUT_FORMATS } */
	static get OUTPUT_FORMATS ()
	{
		return {
			SWITCH: /** @type {Enums.OutputFormats} */ ( 'switch' ),
			SELECT: /** @type {Enums.OutputFormats} */ ( 'select' ),
			RADIOS: /** @type {Enums.OutputFormats} */ ( 'radioList' ),
		};
	}

	/** @type { Classes.StyleSwitch.ROLE } */
	static get ROLE ()
	{
		return {
			PERSISTENT: /** @type {Enums.Roles} */ ( 'persistent' ),
			PREFERRED: /** @type {Enums.Roles} */ ( 'preferred' ),
			ALTERNATE: /** @type {Enums.Roles} */ ( 'alternate' ),
			ALTERNATE_CLONE: /** @type {Enums.Roles} */ ( 'alternate (clone of persistent)' ),
		};
	}

	/** @type {Classes.StyleSwitch.SETTINGS_URL_PARAMETER } */
	static get SETTINGS_URL_PARAMETER ()
	{
		return 'settings';
	}

	/** @type { Classes.StyleSwitch[ 'constructor' ] } */
	constructor ( settingsElementId = 'style-switch-settings' )
	{
		super( ...arguments );
		if ( this.settings.autoRun ) {
			this.run();
		}
	}

	/** @type { Classes.StyleSwitch[ 'checkRequirements' ] } */
	checkRequirements ()
	{
		if ( !( 'cookieStore' in window ) ) {
			throw new Error( 'Your browser not support cookieStore API ( https://developer.mozilla.org/en-US/docs/Web/API/CookieStore ) StyleSwitch cannot continue :(' );
		}
		if ( !this.settings ) {
			throw new Error( 'Settings object is missing' );
		}
	}

	/** @type { Classes.StyleSwitch[ 'prepareRootElement' ] } */
	prepareRootElement ()
	{

		/** @type {?HTMLElement} */
		const possibleRootElement = document.querySelector( this.settings.rootElementQS );

		if ( possibleRootElement ) {
			this.rootElement = possibleRootElement;
		} else {
			this.rootElement = document.createElement( this.settings.resultSnippetAppearance.defaultResultSnippetElement );
		}
	}

	/** @type { Classes.StyleSwitch[ 'getCurrentlyActivatedStyleSheetsPath' ] } */
	async getCurrentlyActivatedStyleSheetsPath ()
	{

		/** @type {?String} */
		let foundPath = null;

		let byNakedDay = false;
		const cookie = await cookieStore.get( this.settings.cookie.name );
		if ( cookie && cookie.value ) {

			/** @type {Types.ResultCookieObject} */
			const styles = JSON.parse( cookie.value );

			const paths = Object.keys( styles );
			loopThroughStyleSheetsPaths:
			for ( const path of paths ) {
				const isDisabled = styles[ path ].disabled;
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

	/** @type {Classes.StyleSwitch['getCleanedStyleSheetsObject']} */
	getCleanedStyleSheetsObject ()
	{

		/** @type {NodeListOf<HTMLLinkElement>|null} */
		const styleLinks = document.querySelectorAll( this.settings.styleLinksQSA ); // cannot use document.styleSheets here!, some alternate styles may not be loaded yet

		/** @type {Set.<String>} */
		const styleSheetPaths = new Set();

		/** @type {Types.ResultArray} */
		const result = [];

		if ( styleLinks ) {
			loopThroughLinkElements:
			styleLinks.forEach( function ( styleLink )
			{
				const role = StyleSwitch.getRoleFrom( styleLink );
				if ( role !== StyleSwitch.ROLE.PERSISTENT && !styleSheetPaths.has( styleLink.href ) ) {
					styleSheetPaths.add( styleLink.href ); // just to prevent duplicates
					result.push( {
						role: role,
						reference: styleLink
					} );
				}
			} );
		}
		if ( this.settings.nakedStyle.use && this.settings.texts.nakedStyleCaption ) {
			result.push( {
				role: StyleSwitch.ROLE.ALTERNATE,
				reference: null // reference null means naked style document
			} );
		}
		if ( this.settings.resultSnippetAppearance.reverseOrder ) {
			result.reverse();
		}
		return result;
	}

	/** @type {Classes.StyleSwitch['determineTypeOfOutputElement']} */
	determineTypeOfOutputElement ( interestStyleSheets )
	{
		if ( interestStyleSheets.length <= 1 ) {
			return null;
		}

		if ( StyleSwitch.OUTPUT_FORMATS.SWITCH === this.settings.resultSnippetAppearance.outputFormat && interestStyleSheets.length === 2 ) {
			return StyleSwitch.OUTPUT_FORMATS.SWITCH;
		} else if ( StyleSwitch.OUTPUT_FORMATS.RADIOS === this.settings.resultSnippetAppearance.outputFormat ) {
			return StyleSwitch.OUTPUT_FORMATS.RADIOS;
		} else { // StyleSwitch.OUTPUT_FORMATS.SELECT as default
			return StyleSwitch.OUTPUT_FORMATS.SELECT;
		}
	}

	/** @type {Classes.StyleSwitch['createSwitch']} */
	createSwitch ( interestStyleSheets, currentlyActivatedPath = null )
	{
		const id = this.settings.resultSnippetAppearance.idPrefix + Math.random().toString( 36 );
		const labelElement = document.createElement( 'label' );
		const captionElement = document.createElement( this.settings.resultSnippetAppearance.switch.captionElementName );
		const inputElement = document.createElement( 'input' );
		const visualSwitchElement = document.createElement( 'span' );
		const stateElement = document.createElement( 'span' );
		const statusOnElement = document.createElement( this.settings.resultSnippetAppearance.switch.statusElementName );
		const statusOffElement = document.createElement( this.settings.resultSnippetAppearance.switch.statusElementName );
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

	/** @type {Classes.StyleSwitch['createRadioList']} */
	createRadioList ( interestStyleSheets, currentlyActivatedPath = null )
	{
		const id = this.settings.resultSnippetAppearance.idPrefix + Math.random().toString( 36 );
		const captionElement = document.createElement( this.settings.resultSnippetAppearance.radioList.captionElementName );
		const ulElement = document.createElement( 'ul' );
		const groupCaption = this.settings.texts.radioList.caption ? this.settings.texts.radioList.caption : this.settings.texts.caption;
		captionElement.id = id;
		captionElement.appendChild( document.createTextNode( groupCaption ) );
		ulElement.role = 'radiogroup';
		ulElement.setAttribute( 'aria-labelledby', id );
		ulElement.tabIndex = 0;
		loopThroughStyleSheetsWithRoles:
		interestStyleSheets.forEach( ( { role, reference } ) =>
		{
			const liElement = document.createElement( 'li' );
			const labelElement = document.createElement( 'label' );
			const radioElement = document.createElement( 'input' );
			const currentCaption = this.getCaptionForStyleSheet( reference );
			const currentTitle = this.getTitleForStyleSheet( role );
			const currentValue = StyleSwitch.getOriginalHrefAttribute( reference );
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
			liElement.title = currentTitle ?? '';
			ulElement.appendChild( liElement );
		} );
		this.rootElement.appendChild( captionElement );
		if ( currentlyActivatedPath === null ) { // in case no cookie exists
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( ulElement );
			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
		this.rootElement.appendChild( ulElement );
	}

	/** @type {Classes.StyleSwitch['createSelect']} */
	createSelect ( interestStyleSheets, currentlyActivatedPath = null )
	{

		/** @type {HTMLOptGroupElement|null} */
		let possibleOptGroupForStyles = null;

		/** @type {HTMLOptGroupElement|null} */
		let possibleOptGroupForNaked = null;

		const id = this.settings.resultSnippetAppearance.idPrefix + Math.random().toString( 36 );
		const labelElement = document.createElement( 'label' );
		const captionElement = document.createElement( this.settings.resultSnippetAppearance.select.captionElementName );
		const selectElement = document.createElement( 'select' );
		const selectCaption = this.settings.texts.select.caption ? this.settings.texts.select.caption : this.settings.texts.caption;
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
		loopThroughStyleSheetsWithRoles:
		interestStyleSheets.forEach( ( { role, reference } ) =>
		{
			const optionElement = document.createElement( 'option' );
			const currentCaption = this.getCaptionForStyleSheet( reference );
			const currentTitle = this.getTitleForStyleSheet( role );
			const currentValue = StyleSwitch.getOriginalHrefAttribute( reference );
			const currentIsSelected = currentlyActivatedPath === currentValue ? true : false;
			optionElement.selected = currentIsSelected;
			optionElement.title = currentTitle ?? '';
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
			const defaultSelectionElement = StyleSwitch.findDefaultSelection( labelElement );
			StyleSwitch.setCurrentSelection( defaultSelectionElement );
		}
		this.rootElement.appendChild( labelElement );
	}

	/** @type {Classes.StyleSwitch['celebrateNakedDay']} */
	celebrateNakedDay ( interestStyleSheets )
	{
		const today = new Date();
		const currentMonth = today.getMonth();
		const currentDay = today.getDate();
		if (
			this.settings.nakedStyle.use &&
			this.settings.nakedStyle.celebrateNakedDay.switchAutomatically &&
			currentMonth === this.settings.nakedStyle.celebrateNakedDay.monthNumber &&
			currentDay === this.settings.nakedStyle.celebrateNakedDay.dayNumber
		) {
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

	/** @type {Classes.StyleSwitch['cancelNakedDay']} */
	cancelNakedDay ( byNakedDay )
	{
		if ( byNakedDay ) {
			const today = new Date();
			const currentMonth = today.getMonth();
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

	/** @type {Classes.StyleSwitch['swapSelectionOnCookieChange']} */
	swapSelectionOnCookieChange ( outputFormat, interestStyleSheets )
	{
		if ( !this.rootElement ) {
			return;
		}
		const cookieName = this.settings.cookie.name;
		const rootElement = this.rootElement;
		cookieStore.addEventListener( 'change', StyleSwitch.cookieChangeListener.bind( null, outputFormat, cookieName, rootElement, interestStyleSheets ), {
			capture: false,
			once: false,
			passive: true
		} );
	}

	/** @type {Classes.StyleSwitch['swapSelectionOnPreferredColorSchemeChange']} */
	swapSelectionOnPreferredColorSchemeChange ( outputFormat, currentlyActivatedPath, interestStyleSheets )
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
		const cookieName = this.settings.cookie.name;
		const rootElement = this.rootElement;
		window.matchMedia( '(prefers-color-scheme: dark)' ).addEventListener( 'change', StyleSwitch.preferredColorSchemeChangeListener.bind( null, outputFormat, cookieName, rootElement, interestStyleSheets ), {
			capture: false,
			once: false,
			passive: true
		} );
	}

	/** @type {Classes.StyleSwitch['run']} */
	async run ()
	{
		this.checkRequirements();
		this.prepareRootElement();
		const { currentlyActivatedPath, byNakedDay } = await this.getCurrentlyActivatedStyleSheetsPath();
		const interestStyleSheets = this.getCleanedStyleSheetsObject(); // without duplicates and persistent styleSheets
		this.celebrateNakedDay( interestStyleSheets );
		this.cancelNakedDay( byNakedDay );
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

/** @type {Classes.StyleSwitch.DEFAULT_SETTINGS} */
Object.defineProperty( StyleSwitch, 'DEFAULT_SETTINGS', {
	get: function ()
	{
		return {
			styleLinksQSA: 'link[rel~=stylesheet]', // match rel="stylesheet" and also rel="alternate stylesheet"
			rootElementQS: '#style-switch',
			cookie: {
				name: 'stylesheets',
				timeBeforeExpire: 365 * 24 * 60 * 60 * 1000, // year
				partitioned: true,
				path: '/',
				sameSite: /** @type {'strict'} */ ( 'strict' ),
			},
			texts: {
				caption: 'Style switch',
				nakedStyleCaption: 'Without style (naked HTML)',
				switch: {
					caption: '',
					title: '',
					versusDividerForRadio: ' / ',
					stateOnCaption: 'on',
					stateOffCaption: 'off',
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
					useRolesAsTitle: true,
					labelClassName: 'switch',
					captionElementName: /** @type {'strong'} */ ( 'strong' ), // only line elements supported, no block elements here
					visualSwitchClassName: 'visual',
					stateClassName: 'state',
					statusElementName: /** @type {'small'} */ ( 'small' ), // only line elements supported, no block elements here
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
	},
	configurable: false,
	enumerable: true,
} );

/** @type {StyleSwitch.prototype} */
const ss = new StyleSwitch();

/** @returns {?HTMLElement} */
const result = ss.settings.autoRun ? await ss.rootElement : null;

export { StyleSwitch, result };
