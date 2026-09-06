"use strict";

//@ts-check

/**
 * @class
 * @file consoleFilter.js
 * @implements {Classes.ConsoleFilterInternal}
 */
class ConsoleFilterInternal
{

	/** @type {Classes.ConsoleFilterInternal['settings']} */
	get settings ()
	{
		return ConsoleFilter.settings;
	}
	set settings ( /** @type {Partial<Types.Settings>} */ newSettings )
	{
		ConsoleFilter.settings = newSettings;
	}

	/**
	 * @template T
	 * @param {...T} customArgs
	 * @returns {T}
	 * @type {Classes.ConsoleFilterInternal.deepAssign}
	 */
	static deepAssign ( /** @type {Array.<any>} */ ...customArgs )
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
						value = ConsoleFilterInternal.deepAssign( currentLevel[ key ], value );
					}
					currentLevel = /** @type {T & Object<string, any>} */ ( { ...currentLevel, [ key ]: value } );
				} );
			}
		} );

		return /** @type {T} */ ( currentLevel );
	}

	/** @type {Partial<Record<Types.ConsoleStaticMethods, Function>>} */
	static nativeConsoleMethods = {};

	static consoleIsSetup = false;

	/** @type {Array.<string>} */
	openedGroups = [];

	/** @type {Array<{commands: Array<{method: Types.ConsoleStaticMethods, proxy: Function, args: Array<*>}>, visible: boolean}>} */
	asyncGroups = [];

	/** @type {Partial<Record<Types.ConsoleStaticMethods, Function>>} */
	nativeMethods = {};

	/** @type {HTMLElement[]} */
	bodyConsoleGroups = [];

	useAsyncLogger = false;

	/** @type { Classes.ConsoleFilterInternal[ 'constructor' ] } */
	constructor ( settingsElementId = 'console-filter-settings' )
	{
		this.readSettings( settingsElementId );
		this.setupConsole();
	}

	/** @type {Classes.ConsoleFilterInternal['readSettings']} */
	readSettings ( settingsElementId = 'console-filter-settings' )
	{
		ConsoleFilter.methods.readSettings.call( this, settingsElementId );
	}

	/** @type {Classes.ConsoleFilterInternal['setupConsole']} */
	setupConsole ()
	{
		if ( typeof window !== 'undefined' && !( 'console' in window ) ) {
			/** @type {{ console: Console }} */ ( window ).console = /** @type {Console} */ ( {} );
		}
		if ( typeof console === 'undefined' ) {
			return;
		}
		if ( ConsoleFilterInternal.consoleIsSetup ) {
			this.nativeMethods = ConsoleFilterInternal.nativeConsoleMethods;
			return;
		}

		/** @type {Types.ConsoleStaticMethods[]} */
		const methods = /** @type {Types.ConsoleStaticMethods[]} */ ( Object.keys( ConsoleFilter.methods ) );

		methods.forEach( method =>
		{
			const proxy = /** @type {Record<string, unknown>} */ ( /** @type {unknown} */ ( console ) )[ method ];
			const nativeMethod = typeof proxy === 'function' ? proxy : () => { };
			this.nativeMethods[ method ] = nativeMethod;
			ConsoleFilterInternal.nativeConsoleMethods[ method ] = nativeMethod;
			if ( this.settings.autoAppendConsole ) {
				( /** @type {Record<string, unknown>} */ ( /** @type {unknown} */ ( console ) ) )[ method ] = /** @param {...*} args */ ( ...args ) => this.handleConsoleMethod( method, nativeMethod, args );
			}
		} );
		ConsoleFilterInternal.consoleIsSetup = true;
	}

	/** @type {Classes.ConsoleFilterInternal['purgeConsoleCommand']} */
	purgeConsoleCommand ( importantPart )
	{
		const isSelectedAll = /** @param {string[]} list */ ( list ) => list[ 0 ] === ConsoleFilter.SYMBOLS_FOR_ALL.asterisk || list[ 0 ] === ConsoleFilter.SYMBOLS_FOR_ALL.text;
		const allowlist = this.settings.allowlist;
		const blocklist = this.settings.blocklist;
		const purge = Boolean( Array.isArray( allowlist ) && allowlist.length && isSelectedAll( allowlist ) && !allowlist.includes( importantPart ) );

		if ( Array.isArray( blocklist ) && blocklist.length ) {
			if ( blocklist.includes( importantPart ) ) {
				return true;
			}
			if ( !isSelectedAll( blocklist ) ) {
				return false;
			}
		}
		return purge;
	}

	/** @type {Classes.ConsoleFilterInternal['getImportantPart']} */
	getImportantPart ( args )
	{
		return typeof args[ 0 ] === 'string' ? args[ 0 ].replace( /%c/g, ' ' ).trim().split( ' ' )[ 0 ] : '';
	}

	/** @type {Classes.ConsoleFilterInternal['callNativeMethod']} */
	callNativeMethod ( method, args = [] )
	{
		const argumentsList = Array.isArray( args ) ? args : [ args ];
		const stringIndexes = argumentsList.reduce( ( indexes, argument, index ) =>
		{
			if ( typeof argument === 'string' ) {
				indexes.push( index );
			}
			return indexes;
		}, [] );
		const outputArguments = argumentsList.slice();
		if ( stringIndexes.length ) {
			const firstStringIndex = stringIndexes[ 0 ];
			const lastStringIndex = stringIndexes[ stringIndexes.length - 1 ];
			outputArguments[ firstStringIndex ] = this.settings.texts.prefix + outputArguments[ firstStringIndex ];
			outputArguments[ lastStringIndex ] += this.settings.texts.suffix;
		}
		const convertedMethod = this.settings.forceConvertFunctions[ method ] ?? method;
		const nativeMethod = this.nativeMethods[ convertedMethod ];
		if ( typeof nativeMethod === 'function' ) {
			Reflect.apply( nativeMethod, console, outputArguments );
		}
		this.appendConsoleMessage( convertedMethod, outputArguments );
	}

	/** @type {Classes.ConsoleFilterInternal['appendConsoleMessage']} */
	appendConsoleMessage ( method, args )
	{
		if ( !this.settings.appendConsoleIntoBody || typeof document === 'undefined' || !document.body ) {
			return;
		}
		const outputId = 'console-filter-output';
		let output = document.getElementById( outputId );
		if ( !output ) {
			output = document.createElement( 'div' );
			output.id = outputId;
			document.body.appendChild( output );
		}
		if ( method === 'clear' ) {
			output.textContent = '';
			this.bodyConsoleGroups = [];
			return;
		}
		const message = args.map( argument =>
		{
			if ( typeof argument === 'string' ) {
				return argument;
			}
			try {
				return JSON.stringify( argument );
			} catch {
				return String( argument );
			}
		} ).join( this.settings.texts.divider );
		if ( method === ConsoleFilter.GROUP_OPENERS.group || method === ConsoleFilter.GROUP_OPENERS.groupCollapsed ) {
			const details = document.createElement( 'details' );
			details.open = method === ConsoleFilter.GROUP_OPENERS.group;
			const summary = document.createElement( 'summary' );
			summary.textContent = `${ method }: ${ message }`;
			details.appendChild( summary );
			const parent = this.bodyConsoleGroups[ this.bodyConsoleGroups.length - 1 ] ?? output;
			parent.appendChild( details );
			this.bodyConsoleGroups.push( details );
			return;
		}
		if ( method === 'groupEnd' ) {
			this.bodyConsoleGroups.pop();
			return;
		}
		const line = document.createElement( 'div' );
		line.textContent = `${ method }: ${ message }`;
		const parent = this.bodyConsoleGroups[ this.bodyConsoleGroups.length - 1 ] ?? output;
		parent.appendChild( line );
	}

	/** @type {Classes.ConsoleFilterInternal['handleAsyncConsoleMethod']} */
	handleAsyncConsoleMethod ( method, proxy, args )
	{
		if ( !this.useAsyncLogger || !this.asyncGroups.length ) {
			return false;
		}
		if ( method === 'groupEnd' ) {
			const group = this.asyncGroups.pop();
			if ( !group ) {
				return true;
			}
			const groupEnd = { method, proxy, args };
			if ( this.asyncGroups.length ) {
				if ( group.visible ) {
					this.asyncGroups[ this.asyncGroups.length - 1 ].commands.push( ...group.commands, groupEnd );
				}
			} else if ( group.visible ) {
				group.commands.forEach( command => this.callNativeMethod( command.method, command.args ) );
				this.callNativeMethod( method, args );
			}
			return true;
		}
		if ( typeof args[ 0 ] !== 'string' ) {
			this.asyncGroups[ this.asyncGroups.length - 1 ].commands.push( { method, proxy, args } );
			return true;
		}
		return false;
	}

	/** @type {Classes.ConsoleFilterInternal['handleNonStringConsoleMethod']} */
	handleNonStringConsoleMethod ( method, proxy, args )
	{
		if ( method === 'groupEnd' && !args.length ) {
			this.openedGroups.pop();
			this.callNativeMethod( method );
			return true;
		}
		if ( this.useAsyncLogger && ( method === ConsoleFilter.GROUP_OPENERS.group || method === ConsoleFilter.GROUP_OPENERS.groupCollapsed ) && typeof args[ 0 ] !== 'string' ) {
			this.asyncGroups.push( { commands: [ { method, proxy, args } ], visible: true } );
			return true;
		}
		return false;
	}

	/** @type {Classes.ConsoleFilterInternal['handleStringConsoleMethod']} */
	handleStringConsoleMethod ( method, proxy, args )
	{
		const importantPart = this.getImportantPart( args );
		if ( method === 'groupEnd' ) {
			this.openedGroups = this.openedGroups.filter( item => item !== importantPart );
			this.callNativeMethod( method );
			return;
		}
		const isGroupOpener = method === ConsoleFilter.GROUP_OPENERS.group || method === ConsoleFilter.GROUP_OPENERS.groupCollapsed;
		if ( typeof this.settings.allowlist === 'string' ) {
			this.settings.allowlist = [ this.settings.allowlist ];
		}
		if ( typeof this.settings.blocklist === 'string' ) {
			this.settings.blocklist = [ this.settings.blocklist ];
		}
		const purgeCurrent = this.purgeConsoleCommand( importantPart );
		if ( isGroupOpener && this.useAsyncLogger ) {

			/** @type {{commands: Array<{method: Types.ConsoleStaticMethods, proxy: Function, args: unknown[]}>, visible: boolean}} */
			const asyncGroup = { commands: [], visible: !purgeCurrent };

			this.asyncGroups.push( asyncGroup );
			if ( asyncGroup.visible ) {
				asyncGroup.commands.push( { method, proxy, args } );
			}
			return;
		}
		if ( isGroupOpener && purgeCurrent && importantPart ) {
			this.openedGroups.push( importantPart );
		}
		if ( purgeCurrent ) {
			return;
		}
		if ( this.useAsyncLogger && this.asyncGroups.length ) {
			this.asyncGroups[ this.asyncGroups.length - 1 ].commands.push( { method, proxy, args } );
			return;
		}
		this.callNativeMethod( method, args );
	}

	/** @type {Classes.ConsoleFilterInternal['handleConsoleMethod']} */
	handleConsoleMethod ( method, proxy, args )
	{
		if ( this.handleAsyncConsoleMethod( method, proxy, args ) || this.handleNonStringConsoleMethod( method, proxy, args ) ) {
			return;
		}
		if ( typeof args[ 0 ] === 'string' ) {
			this.handleStringConsoleMethod( method, proxy, args );
			return;
		}
		this.callNativeMethod( method, args );
	}
}

/**
 * @class
 * @extends ConsoleFilterInternal
 * @implements {Classes.ConsoleFilter}
 * @version 1.0
 * @since Q3 2026
 * @file consoleFilter.js
 * @description Make native `console.log()` (and other console methods) proxied and filtered by text string
 * @license https://creativecommons.org/licenses/by-sa/4.0/legalcode.cs CC BY-SA 4.0
 * @author ic<ic.czech+console-filter@gmail.com>
 * @see {@link https://github.com/iiic/consoleFilter.js|GitHub}
 * @see {@link https://iiic.dev/console-filter#github|homepage}
 */
class ConsoleFilter extends ConsoleFilterInternal
{

	/** @type {Types.Settings | null} */
	static #staticSettings = null;

	/** @type { Classes.ConsoleFilter.SYMBOLS_FOR_ALL } */
	static get SYMBOLS_FOR_ALL ()
	{
		return {
			asterisk: /** @type {'*'} */ '*',
			text: /** @type {'all'} */ 'all'
		};
	}

	/** @type { Classes.ConsoleFilter.GROUP_OPENERS } */
	static get GROUP_OPENERS ()
	{
		return {
			group: /** @type {'group'} */ 'group',
			groupCollapsed: /** @type {'groupCollapsed'} */ 'groupCollapsed'
		};
	}

	/** @type {Classes.ConsoleFilter.SETTINGS_URL_PARAMETER } */
	static get SETTINGS_URL_PARAMETER ()
	{
		return 'settings';
	}

	/** @type {Types.Settings} */
	static get settings ()
	{
		if ( ConsoleFilter.#staticSettings === null ) {
			ConsoleFilter.#staticSettings = /** @type {Types.Settings} */ ( ConsoleFilterInternal.deepAssign( {}, ConsoleFilter.DEFAULT_SETTINGS ) );
		}
		return ConsoleFilter.#staticSettings;
	}
	static set settings ( /** @type {Partial<Types.Settings>} */ newSettings )
	{
		if ( ConsoleFilter.#staticSettings === null ) {
			ConsoleFilter.#staticSettings = /** @type {Types.Settings} */ ( ConsoleFilterInternal.deepAssign( {}, ConsoleFilter.DEFAULT_SETTINGS ) );
		}
		ConsoleFilter.#staticSettings = /** @type {Types.Settings} */ ( ConsoleFilterInternal.deepAssign( ConsoleFilter.#staticSettings, newSettings ) );
	}

	/** @type { Classes.ConsoleFilter.methods } */
	static methods = {
		readSettings: function ( /** @type {string} */ settingsElementId = 'console-filter-settings' )
		{
			const settingsTarget = this instanceof ConsoleFilterInternal ? this : ConsoleFilter;
			const searchParams = new URL( import.meta.url ).searchParams;
			if ( searchParams.has( ConsoleFilter.SETTINGS_URL_PARAMETER ) ) {
				const jsonInString = searchParams.get( ConsoleFilter.SETTINGS_URL_PARAMETER );
				if ( jsonInString ) {
					settingsTarget.settings = JSON.parse( jsonInString );
				}
			}
			const settingsElement = document.getElementById( settingsElementId );
			if ( settingsElement && settingsElement instanceof HTMLScriptElement ) {
				const jsonInElement = settingsElement;
				settingsTarget.settings = JSON.parse( jsonInElement.text );
			}
		},
		assert: function ( /** @type {boolean} */ condition, /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'assert', [ condition, ...data ] ); },
		clear: function () { callConsoleMethod( this, 'clear', [] ); },
		count: function ( /** @type {string | undefined} */ label ) { callConsoleMethod( this, 'count', Array.from( arguments ) ); },
		countReset: function ( /** @type {string | undefined} */ label ) { callConsoleMethod( this, 'countReset', Array.from( arguments ) ); },
		debug: function ( /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'debug', data ); },
		dir: function ( /** @type {any} */ item, /** @type {any} */ options ) { callConsoleMethod( this, 'dir', Array.from( arguments ) ); },
		dirxml: function ( /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'dirxml', data ); },
		error: function ( /** @type {any[]} */...data ) { callConsoleMethod( this, 'error', data ); },
		group: function ( /** @type {string | undefined} */ label ) { callConsoleMethod( this, 'group', Array.from( arguments ) ); },
		groupCollapsed: function ( /** @type {string | undefined} */ label ) { callConsoleMethod( this, 'groupCollapsed', Array.from( arguments ) ); },
		groupEnd: function () { callConsoleMethod( this, 'groupEnd', [] ); },
		info: function ( /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'info', data ); },
		log: function ( /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'log', data ); },
		table: function ( /** @type {any} */ tabularData, /** @type {any} */ properties ) { callConsoleMethod( this, 'table', Array.from( arguments ) ); },
		time: function ( /** @type {string | undefined} */ label ) { callConsoleMethod( this, 'time', Array.from( arguments ) ); },
		timeEnd: function ( /** @type {string | undefined} */ label ) { callConsoleMethod( this, 'timeEnd', Array.from( arguments ) ); },
		timeLog: function ( /** @type {string | undefined} */ label, /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'timeLog', [ label, ...data ] ); },
		trace: function ( /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'trace', data ); },
		warn: function ( /** @type {any[]} */ ...data ) { callConsoleMethod( this, 'warn', data ); }
	};

	/** @type {Classes.ConsoleFilter['constructor']} */
	constructor ( settingsElementId = 'console-filter-settings' )
	{
		super( ...arguments );
		this.useAsyncLogger = true;
	}

	/** @type {Classes.ConsoleFilter['createAsyncLogger']} */
	createAsyncLogger ()
	{
		const logger = Object.create( console );

		/** @type {Types.ConsoleMethodNames[]} */
		const methods = /** @type {Types.ConsoleMethodNames[]} */ ( Object.keys( ConsoleFilter.methods ) );

		methods.forEach( method =>
		{
			const methodFunc = ConsoleFilter.methods[ method ];
			if ( typeof methodFunc === 'function' ) {
				logger[ method ] = methodFunc.bind( this );
			}
		} );

		return logger;
	}
}

/** @type {Classes.ConsoleFilter.DEFAULT_SETTINGS} */
Object.defineProperty( ConsoleFilter, 'DEFAULT_SETTINGS', {
	get: function ()
	{
		return {
			allowlist: [],
			blocklist: [],
			autoAppendConsole: true,
			appendConsoleIntoBody: false,
			forceConvertFunctions: { // Possible to change some console function to another. Null means not convert
				log: null,
				warn: null,
				error: null,
				info: null,
			},
			texts: {
				prefix: '',
				suffix: '',
				divider: ' ',
			}
		};
	},
	configurable: false,
	enumerable: true,
} );

/** @param {ConsoleFilterInternal|typeof ConsoleFilter.methods} context @param {Types.ConsoleStaticMethods} method @param {unknown[]} args */
function callConsoleMethod ( context, method, args )
{
	const instance = context instanceof ConsoleFilter ? context : ( defaultConsoleFilter ??= new ConsoleFilter() );
	instance.handleConsoleMethod( method, instance.nativeMethods[ method ], args );
}

class AsyncLogger
{
	constructor ( settingsElementId = 'console-filter-settings' )
	{
		const cf = new ConsoleFilter( settingsElementId );

		/** @type {Types.Settings | null} */
		let instanceSettings = null;

		// Přepišeme getter/setter settings na instanci cf, aby měla vlastní nastavení
		Object.defineProperty( cf, 'settings', {
			get: () =>
			{
				if ( instanceSettings === null ) {
					instanceSettings = /** @type {Types.Settings} */ ( ConsoleFilterInternal.deepAssign( {}, ConsoleFilter.DEFAULT_SETTINGS ) );
				}
				return instanceSettings;
			},
			set: ( newSettings ) =>
			{
				if ( instanceSettings === null ) {
					instanceSettings = /** @type {Types.Settings} */ ( ConsoleFilterInternal.deepAssign( {}, ConsoleFilter.DEFAULT_SETTINGS ) );
				}
				instanceSettings = /** @type {Types.Settings} */ ( ConsoleFilterInternal.deepAssign( instanceSettings, newSettings ) );
			},
			enumerable: true,
			configurable: true
		} );

		/** @type {Types.ConsoleMethodNames[]} */
		const methods = /** @type {Types.ConsoleMethodNames[]} */ ( Object.keys( ConsoleFilter.methods ) );

		/** @type {Object<string, any>} */
		const logger = {};

		methods.forEach( method =>
		{
			const methodFunc = ConsoleFilter.methods[ method ];
			if ( typeof methodFunc === 'function' ) {
				logger[ method ] = methodFunc.bind( cf );
			}
		} );

		Object.defineProperty( logger, 'settings', {
			get: () => cf.settings,
			set: ( newSettings ) => { cf.settings = newSettings; },
			enumerable: true,
			configurable: true
		} );

		return logger;
	}
}

let defaultConsoleFilter;

// Initialize ConsoleFilter with settings loaded during module import
defaultConsoleFilter = new ConsoleFilter();

const { methods } = ConsoleFilter;

export { ConsoleFilter, methods, AsyncLogger };
