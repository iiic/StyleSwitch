/**
 * @file consoleFilter.globals.d.ts
 * @description TypeScript global declarations for ConsoleFilter.
 * @version 1.0
 * @since Q3 2026
 * @license https://creativecommons.org/licenses/by-sa/4.0/legalcode.cs CC BY-SA 4.0
 * @author ic<ic.czech+console-filter@gmail.com>
 * @see {@link https://github.com/iiic/consoleFilter.js|GitHub}
 * @see {@link https://iiic.dev/console-filter#github|homepage}
 */

declare global {
	namespace Types {

		/** Names of block html elements (element 'a' can be both, block or inline depends on its content) */
		type BlockHTMLElements = 'body' | 'a' | 'address' | 'article' | 'aside' | 'blockquote' | 'dd' | 'div' | 'dl' | 'dt' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'header' | 'hgroup' | 'hr' | 'main' | 'menu' | 'nav' | 'ol' | 'p' | 'pre' | 'search' | 'section' | 'ul' | 'canvas' | 'noscript' | 'details' | 'dialog' | 'table';

		/** Names of inline html elements (element 'a' can be both, block or inline depends on its content) */
		type InlineHTMLElements = 'a' | 'abbr' | 'b' | 'bdi' | 'bdo' | 'br' | 'cite' | 'code' | 'data' | 'dfn' | 'em' | 'i' | 'kbd' | 'mark' | 'q' | 'ruby' | 'rp' | 'rt' | 's' | 'samp' | 'small' | 'span' | 'strong' | 'sub' | 'sup' | 'time' | 'u' | 'var' | 'wbr' | 'area';

		/** Names of special html elements (all other elements that are neither block nor inline) */
		type SpecialHTMLElements = 'html' | 'base' | 'head' | 'link' | 'meta' | 'script' | 'style' | 'title' | 'svg' | 'math' | 'caption' | 'col' | 'colgroup' | 'tbody' | 'td' | 'tfoot' | 'th' | 'thead' | 'tr' | 'datalist' | 'fieldset' | 'legend' | 'optgroup' | 'option' | 'selectedcontent' | 'slot' | 'summary' | 'template' | 'geolocation';

		/** Names of static methods of the regular console object (in window) */
		type ConsoleStaticMethods = 'assert' | 'clear' | 'count' | 'countReset' | 'debug' | 'dir' | 'dirxml' | 'error' | 'group' | 'groupCollapsed' | 'groupEnd' | 'info' | 'log' | 'table' | 'time' | 'timeEnd' | 'timeLog' | 'trace' | 'warn';

		/** All console method names including custom readSettings */
		type ConsoleMethodNames = ConsoleStaticMethods | 'readSettings';

		/** Settings for ConsoleFilter */
		type Settings = {

			/** Messages or patterns that are allowed */
			allowlist?: string | string[],

			/** Messages or patterns that are blocked */
			blocklist?: string | string[],

			/** Automatically appends the console to the document */
			autoAppendConsole: boolean,

			/** Write console logs also into document.body */
			appendConsoleIntoBody: boolean,

			/** Possible to change some console function to another. Null means not convert. */
			forceConvertFunctions: Partial<Record<ConsoleStaticMethods, ConsoleStaticMethods | null>>,

			/** All written text in this class */
			texts: {

				/** Text added before each console message */
				prefix: string,

				/** Text added after each console message */
				suffix: string,

				/** Divide log messages by this string */
				divider: string,

			},
		};

		/** Names and values used to select all console messages */
		type SymbolsForAll = {

			/** Symbol used to select all messages */
			asterisk: '*',

			/** Text value used to select all messages */
			text: 'all',

		};

		/** Base console methods without this context */
		type ConsoleMethodsBase = {

			/** Reads filtering settings from the settings element */
			readSettings: ( settingsElementId?: string ) => void,

			/** Tests a condition and logs data when it is false */
			assert: ( condition: boolean, ...data: any[] ) => void,

			/** Clears the console */
			clear: () => void,

			/** Increments and displays a counter */
			count: ( label?: string ) => void,

			/** Resets a counter */
			countReset: ( label?: string ) => void,

			/** Logs a debug message */
			debug: ( ...data: any[] ) => void,

			/** Displays an interactive object representation */
			dir: ( item: any, options?: any ) => void,

			/** Displays an XML representation of an object */
			dirxml: ( ...data: any[] ) => void,

			/** Logs an error message */
			error: ( ...data: any[] ) => void,

			/** Starts a console group */
			group: ( label?: string ) => void,

			/** Starts a collapsed console group */
			groupCollapsed: ( label?: string ) => void,

			/** Ends the current console group */
			groupEnd: () => void,

			/** Logs an informational message */
			info: ( ...data: any[] ) => void,

			/** Logs a general message */
			log: ( ...data: any[] ) => void,

			/** Displays tabular data */
			table: ( tabularData: any, properties?: any ) => void,

			/** Starts a timer */
			time: ( label?: string ) => void,

			/** Stops a timer and displays its duration */
			timeEnd: ( label?: string ) => void,

			/** Displays a timer value without stopping the timer */
			timeLog: ( label?: string, ...data: any[] ) => void,

			/** Logs a stack trace */
			trace: ( ...data: any[] ) => void,

			/** Logs a warning message */
			warn: ( ...data: any[] ) => void,

		};

		/** Methods exposed by a ConsoleFilter logger with this context */
		type ConsoleMethods = {
			[K in keyof ConsoleMethodsBase]: ( this: any, ...args: Parameters<ConsoleMethodsBase[K]> ) => ReturnType<ConsoleMethodsBase[K]>
		};

		/** Map of native console methods */
		type NativeMethods = Partial<Record<ConsoleStaticMethods, Function>>;

		/** A queued asynchronous console command */
		type AsyncGroupCommand = {

			/** Name of the console method */
			method: ConsoleStaticMethods,

			/** Function used to execute the method */
			proxy: Function,

			/** Arguments passed to the method */
			args: any[],

		};

		/** State of a group of asynchronous console commands */
		type AsyncGroup = {

			/** Queued commands */
			commands: AsyncGroupCommand[],

			/** Whether the group is visible */
			visible: boolean,

		};

		namespace Getters {

			/** Names of methods that open console groups */
			type GROUP_OPENERS = {

				/** Opens an expanded console group */
				group: 'group';

				/** Opens a collapsed console group */
				groupCollapsed: 'groupCollapsed';

			};


			/** Symbols used to select all messages from the getter namespace */
			type SYMBOLS_FOR_ALL = {

				/** Asterisk symbol used to select all messages */
				asterisk: '*';

				/** Text value used to select all messages */
				text: 'all';

			};

			/** This returns string possible to place into url get parameter to set settings */
			type SETTINGS_URL_PARAMETER = 'settings';

		};
	};

	namespace Classes {

		/** Internal class, not accessible from outside the script */
		class ConsoleFilterInternal {

			/** Captured native console methods shared by all instances */
			static nativeConsoleMethods: Types.NativeMethods;

			/** Whether the global console has been configured */
			static consoleIsSetup: boolean;

			/** Recursively merges settings and other objects */
			static deepAssign<T>( ...customArgs: Array.<any> ): T;

			/** Current settings (returned throw getter function) */
			get settings(): Types.Settings;

			/** Current settings (with setter function for safety) */
			set settings( newSettings: Partial<Types.Settings> );

			/** Currently opened console groups */
			openedGroups: string[];

			/** Queued asynchronous console groups */
			asyncGroups: Types.AsyncGroup[];

			/** Captured native console methods */
			nativeMethods: Types.NativeMethods;

			/** Open groups currently rendered in document.body */
			bodyConsoleGroups: HTMLElement[];

			/** Whether asynchronous logging is enabled */
			useAsyncLogger: boolean;

			/** Constructor for ConsoleFilterInternal */
			constructor ( settingsElementId?: string );

			/** Reads filtering settings from the settings element */
			readSettings( settingsElementId?: string ): void;

			/** Replaces the global console methods with filtered methods */
			setupConsole(): void;

			/** Determines whether a console command should be filtered out */
			purgeConsoleCommand( importantPart: string ): boolean;

			/** Extracts the relevant text from console arguments */
			getImportantPart( args: any[] ): string;

			/** Calls a captured native console method */
			callNativeMethod( method: Types.ConsoleStaticMethods, args?: any[] | any ): void;

			/** Appends a console message to the document body */
			appendConsoleMessage( method: Types.ConsoleStaticMethods, args: any[] ): void;

			/** Handles a console method while asynchronous logging is active */
			handleAsyncConsoleMethod( method: Types.ConsoleStaticMethods, proxy: Function, args: any[] ): boolean;

			/** Handles a console method with non-string arguments */
			handleNonStringConsoleMethod( method: Types.ConsoleStaticMethods, proxy: Function, args: any[] ): boolean;

			/** Handles a console method with string arguments */
			handleStringConsoleMethod( method: Types.ConsoleStaticMethods, proxy: Function, args: any[] ): void;

			/** Handles a call to a console method */
			handleConsoleMethod( method: Types.ConsoleStaticMethods, proxy: Function, args: any[] ): void;

		}

		/** Public exportable part */
		class ConsoleFilter extends ConsoleFilterInternal {

			/** Current shared settings */
			static get settings(): Types.Settings;
			static set settings( newSettings: Partial<Types.Settings> );

			/** Methods exposed by ConsoleFilter */
			static methods: Types.ConsoleMethods;

			/** Get list */
			static get GROUP_OPENERS(): Types.Getters.GROUP_OPENERS;

			/** Returns symbols used to select all messages */
			static get SYMBOLS_FOR_ALL(): Types.Getters.SYMBOLS_FOR_ALL;

			/** Returns name of settings get http parameter */
			static get SETTINGS_URL_PARAMETER(): Types.Getters.SETTINGS_URL_PARAMETER;

			/** Constructor for ConsoleFilter */
			constructor ( settingsElementId?: string );

			/** Creates an asynchronous console logger */
			createAsyncLogger(): Types.ConsoleMethods;

			/** Returns default settings for ConsoleFilter */
			static get DEFAULT_SETTINGS(): Types.Settings;

		}

		namespace ConsoleFilter {

			type SYMBOLS_FOR_ALL = Types.SymbolsForAll;

			type GROUP_OPENERS = Types.Getters.GROUP_OPENERS;

			type SETTINGS_URL_PARAMETER = Types.Getters.SETTINGS_URL_PARAMETER;

			type methods = Types.ConsoleMethods;

			type DEFAULT_SETTINGS = Types.Settings;

		}
	};

};

declare const ConsoleFilter: typeof Classes.ConsoleFilter;

/** Default ConsoleFilter methods */
declare const methods: Types.ConsoleMethods;

/** Constructor for an asynchronous console logger */
declare const AsyncLogger: {

	/** Creates an asynchronous console logger */
	new( settingsElementId?: string ): Types.ConsoleMethods & {
		settings: Types.Settings;
	};

};

export { ConsoleFilter, methods, AsyncLogger };
