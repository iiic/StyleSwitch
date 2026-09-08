/**
 * @file style-switch.globals.d.ts
 * @description TypeScript global declarations for StyleSwitch.
 * @version 1.4
 * @license CC-BY-SA-4.0
 */

declare global {

	namespace Enums {

		/** Possible output formats of StyleSwitch */
		type OutputFormats = string & {
			readonly oneOf: 'select' | 'radioList' | 'switch';
		};

		/** Default behavior of the widget when the operating system color scheme changes. The widget can dynamically change the page style immediately when the OS value changes, if that is desirable. For example, if the user has already chosen a site style, they likely do not want it to change. Therefore the default behavior is to change dynamically only when there is no cookie and the user has not yet chosen the page style. All options can be obtained from the static read-only method StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR */
		type PreferredColorSchemeChangeBehavior = string & {
			readonly oneOf: 'never' | 'always' | 'onlyWithoutCookie'
		};

		/** Role of CSS stylesheet file */
		type Roles = string & {
			readonly oneOf: 'persistent' | 'preferred' | 'alternate' | 'alternate (clone of persistent)'
		};

	}

	namespace Constants {

		/** Options for setting how to behave when changing the color theme in the operating system. */
		const PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR = {

			/** Never change the CSS style of a document based on user action, color scheme changes in their operating system. */
			NEVER: 'never' as Enums.PreferredColorSchemeChangeBehavior,

			/** Always change the css style of the document based on the color scheme change in the operating system. */
			ALWAYS: 'always' as Enums.PreferredColorSchemeChangeBehavior,

			/** Change the document's css style when changing the windows color scheme, only if the user has not already chosen a color style. */
			ONLY_WITHOUT_COOKIE: 'onlyWithoutCookie' as Enums.PreferredColorSchemeChangeBehavior,

		};

		/** Options for selecting the type of output element. */
		const OUTPUT_FORMATS = {

			/** Switch realized by semantically described input type checkbox. */
			SWITCH: 'switch' as Enums.OutputFormats,

			/** One select with available css styles as options. */
			SELECT: 'select' as Enums.OutputFormats,

			/** Change the document's css style when changing the windows color scheme, only if the user has not already chosen a color style. */
			RADIOS: 'radioList' as Enums.OutputFormats,

		};

		/** Possible roles of Css stylesheet file included into document */
		const ROLE = {

			/** (has rel="stylesheet" attribute, no title attribute) always applies to the document. */
			PERSISTENT: 'persistent' as Enums.Roles,

			/** (has rel="stylesheet", with title="…" specified): applied by default, but disabled if an alternate stylesheet is selected. There can only be one preferred stylesheet, so providing stylesheets with different title attributes will cause some of them to be ignored. */
			PREFERRED: 'preferred' as Enums.Roles,

			/** (rel="alternate stylesheet", with title="…" specified): disabled by default, can be selected. */
			ALTERNATE: 'alternate' as Enums.Roles,

			/** Same href value as persistent stylesheet but set with title and rel="alternate stylesheet" attributes. This will allow to change css stylesheet to this file by widget. */
			ALTERNATE_CLONE: 'alternate (clone of persistent)' as Enums.Roles,

		};

	}

	namespace Types {

		/** Names of block html elements (element 'a' can be both, block or inline depends on its content) */
		type BlockHTMLElements = 'body' | 'a' | 'address' | 'article' | 'aside' | 'blockquote' | 'dd' | 'div' | 'dl' | 'dt' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'header' | 'hgroup' | 'hr' | 'main' | 'menu' | 'nav' | 'ol' | 'p' | 'pre' | 'search' | 'section' | 'ul' | 'canvas' | 'noscript' | 'details' | 'dialog' | 'table';

		/** Names of inline html elements (element 'a' can be both, block or inline depends on its content) */
		type InlineHTMLElements = 'a' | 'abbr' | 'b' | 'bdi' | 'bdo' | 'br' | 'cite' | 'code' | 'data' | 'dfn' | 'em' | 'i' | 'kbd' | 'mark' | 'q' | 'ruby' | 'rp' | 'rt' | 's' | 'samp' | 'small' | 'span' | 'strong' | 'sub' | 'sup' | 'time' | 'u' | 'var' | 'wbr' | 'area';

		/** Names of special html elements (all other elements that are neither block nor inline) */
		type SpecialHTMLElements = 'html' | 'base' | 'head' | 'link' | 'meta' | 'script' | 'style' | 'title' | 'svg' | 'math' | 'caption' | 'col' | 'colgroup' | 'tbody' | 'td' | 'tfoot' | 'th' | 'thead' | 'tr' | 'datalist' | 'fieldset' | 'legend' | 'optgroup' | 'option' | 'selectedcontent' | 'slot' | 'summary' | 'template' | 'geolocation';

		/** Names of static methods of the regular console object (in window) */
		type ConsoleStaticMethods = 'assert' | 'clear' | 'count' | 'countReset' | 'debug' | 'dir' | 'dirxml' | 'error' | 'group' | 'groupCollapsed' | 'groupEnd' | 'info' | 'log' | 'table' | 'time' | 'timeEnd' | 'timeLog' | 'timeStamp' | 'trace' | 'warn';

		/** Settings for output cookie of StyleSwitch */
		type CookieSettings = { name: string, timeBeforeExpire: number, partitioned: boolean, path: string, sameSite: CookieSameSite };

		/** Array as result of this function… will be used for cookie content, later */
		type ResultArray = Array<{ role: Enums.Roles; reference: ?HTMLLinkElement }>;

		/** Result Object… will be set as a content of cookie, later */
		type ResultCookieObject = { [x: string]: { disabled: boolean; byNakedDay?: boolean } };

		/** Output element of StyleSwitch can be those types of HTMLElement or null */
		type PossibleOutputElement = HTMLOptionElement | HTMLInputElement | null;

		/** Settings for StyleSwitch */
		type Settings = {

			/** The value for document.querySelectorAll() used to load styles. You probably will not need to change the default. */
			styleLinksQSA: string;

			/** The value for document.querySelector() returning the element into which the widget created by this script will be inserted. */
			rootElementQS: string;

			/** Settings for the cookie used to store the user-selected site style. */
			cookie: {

				/** Name of the cookie */
				name: string;

				/** A number of seconds before cookie expire… in seconds */
				timeBeforeExpire: number;

				/** A boolean value that defaults to false. If set to true, the set cookie will be a partitioned cookie. */
				partitioned: boolean;

				/** A string containing the path of the cookie. */
				path: string;

				/** One of the following SameSite values: "strict", "lax", or "none". */
				sameSite: CookieSameSite;

			};

			/** All text labels for the widget. */
			texts: {

				/** Main caption of all widgets */
				caption: string;

				/** Text description of naked style for document */
				nakedStyleCaption: string;

				/** Group of texts only for switch output type */
				switch: {

					/** Caption of switch element */
					caption: string;

					/** Text value of title element (shown on mouse over) */
					title: string;

					/** Text for visual divider between on and off values */
					versusDividerForRadio: string;

					/** Status text when switch is on */
					stateOnCaption: string;

					/** Status text when switch is off */
					stateOffCaption: string;

				};

				/** Group of texts only for select output type */
				select: {

					/** Caption of select element */
					caption: string;

					/** Text label for OptGroup in Select for existing document styles. (OptGroup will not be used when empty) */
					optGroupLabelForStyles: string;

					/** Text label for OptGroup in Select used for naked style. (Only if naked style is enabled and OptGroup will not be used when empty) */
					otpGroupLabelForNaked: string;

				};

				/** Group of texts only for radio list output type */
				radioList: {

					/** Caption of radio list group of output element */
					caption: string;

				};
			};

			/** Setting for dokument naked style (all Css Stylesheets disabled) */
			nakedStyle: {

				/** Allows you to add a CSS-free style as one of the usable page display styles, the so-called naked style. */
				use: boolean;

				/** Possible settings for automatic change of stylesheet to naked when "naked day" event */
				celebrateNakedDay: {

					/** Automatically select "naked style" (all Css Stylesheets disabled) when "naked day" event */
					switchAutomatically: boolean; // if true naked style is set and unset automatically at event

					/** Month number of Naked day event. Month numbers starts with 0, so April is number 3 */
					monthNumber: number;

					/** Day number of Naked day event */
					dayNumber: number;

				};
			};

			/** Group of settings specified appearance of result element */
			resultSnippetAppearance: {

				/** Prefix for the widget's id. A random string is appended so the id becomes unique and the widget can be used more than once in the document if needed. */
				idPrefix: string;

				/** Type of element that will wrap the resulting widget. */
				defaultResultSnippetElement: string;

				/** List of possible form controls that the script will create as output. This list can be obtained from the static read-only method StyleSwitch.OUTPUT_FORMATS */
				outputFormat: Enums.OutputFormats;

				/** Default behavior of the widget when the operating system color scheme changes. The widget can dynamically change the page style immediately when the OS value changes, if that is desirable. For example, if the user has already chosen a site style, they likely do not want it to change. Therefore the default behavior is to change dynamically only when there is no cookie and the user has not yet chosen the page style. All options can be obtained from the static read-only method StyleSwitch.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR . */
				preferredColorSchemeChangeBehavior: Enums.PreferredColorSchemeChangeBehavior;

				/** Output the styles found in the document head in reverse order? */
				reverseOrder: boolean; // order of style sheets, should be reversed?

				/** All settings for the 'switch' widget */
				switch: {

					/** Use the detected style role as the title attribute of the switch control? */
					useRolesAsTitle: boolean;

					/** Class name attribute for the wrapper element of the resulting widget. */
					labelClassName: string;

					/** Element name for the title of the resulting switch widget. */
					captionElementName: InlineHTMLElements;

					/** Class name attribute for the visual switch element of the resulting widget. */
					visualSwitchClassName: string;

					/** Class name attribute for the element displaying the switch state (default "on" / "off" ... can be changed to any text) */
					stateClassName: string;

					/** Element name for the element displaying the switch state. */
					statusElementName: InlineHTMLElements;

				};

				/** All settings for the 'select' widget */
				select: {

					/** Use the detected style role as the 'title' attribute for the 'option' inside the 'select'? */
					useRoleAsOptionTitle: boolean;

					/** Element name for the 'title' of the resulting select widget. */
					captionElementName: string;

				};

				/** All settings for the 'radioList' widget */
				radioList: {

					/** Use the detected style role as the 'title' attribute for the 'input'? */
					captionElementName: string;

					/** Element name for the title of the resulting radio list widget. */
					useRoleAsItemTitle: boolean;

				};
			};

			/** Run the script automatically after import or insertion into the document? The default setting is yes, and you will usually use this default. Only when custom run function assembly use case is needed set it to false. */
			autoRun: boolean;

		};

		/** This returns string possible to place into url get parameter to set settings */
		type SETTINGS_URL_PARAMETER = 'settings';

		/** Options for selecting the type of output element. */
		type OutputFormats = typeof Constants.OUTPUT_FORMATS;

		/** Options for setting how to behave when changing the color theme in the operating system. */
		type PreferredColorSchemeChangeBehavior = typeof Constants.PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR;

		/** Possible roles of Css stylesheet file included into document */
		type Roles = typeof Constants.ROLE;

	};

	namespace Classes {

		/** Internal class, not accessible from outside the script */
		class StyleSwitchInternal {

			/** Current settings (returned throw getter function) */
			get settings(): Types.Settings;

			/** Current settings (with setter function for safety) */
			set settings( newSettings: Partial<Types.Settings> );

			/** Root element for result of widget (returned throw getter function) */
			get rootElement(): HTMLElement;

			/** Root element for result of widget (with setter function for safety) */
			set rootElement( rootElement: HTMLElement );

			/** Gets determined role from stylesheet HTMLLinkElement */
			static getRoleFrom( styleLink: HTMLLinkElement ): Enums.Roles;

			/** Returns the original href / value from a stylesheet or form control */
			static getOriginalHrefAttribute( possibleElement: HTMLLinkElement | HTMLOptionElement | HTMLInputElement | null ): string;

			/** Get path of css stylesheet file currently selected by StyleSwitch's widget element */
			static getSelectedPath( interestStyleSheets: Array.<{ role: Enums.Roles, reference: ?HTMLLinkElement }>, transferredEvent: Event ): ?string;

			/** Sets cookie as result of StyleSwitch */
			static async switchStyleEvent( interestStyleSheets: Types.ResultArray, cookieSettings: Types.CookieSettings, event: Event ): Promise<void>;

			/** Set selected item in result element (it does not matter the specific type of output element) */
			static setValueOnResultElementBy( cookieObject: Types.ResultCookieObject, outputFormat: ?Enums.OutputFormats, rootElement: HTMLElement ): void;

			/** Set input[type=checkbox] checked or not checked by currentlyActivatedPath (if presented) or to default style */
			static setCurrentChecked( rootElement: HTMLElement, interestStyleSheets: Types.ResultArray, currentlyActivatedPath: ?string ): void;

			/** Set selected / checked by type of element from parameter */
			static setCurrentSelection( possibleElement: Types.PossibleOutputElement ): void;

			/** Returns element set as output element by current settings */
			static findDefaultSelection( rootElement: HTMLElement ): Types.PossibleOutputElement;

			/** Returns number of current StyleSheet position (array begins with 0) */
			static findCurrentSelectionPosition( interestStyleSheets: Types.ResultArray ): number;

			/** Returns number of StyleSheet position by assigned path (array begins with 0) */
			static findCurrentSelectionByPath( interestStyleSheets: Types.ResultArray, currentlyActivatedPath: ?string ): number;

			/** Sets currently activated style checked in output format */
			static setDefaultOnResultElement( outputFormat: ?Enums.OutputFormats, rootElement: HTMLElement, interestStyleSheets: Types.ResultArray ): void;

			/** Listener waiting to change color scheme in operation system (and then color scheme in browser) */
			static preferredColorSchemeChangeListener( outputFormat: ?Enums.OutputFormats, cookieName: string, rootElement: HTMLElement, interestStyleSheets: Types.ResultArray, /* event: MediaQueryListEvent */ ): void;

			/** Listener waiting to change StyleSwitch cookie */
			static cookieChangeListener( outputFormat: ?Enums.OutputFormats, cookieName: String, rootElement: HTMLElement, interestStyleSheets: Types.ResultArray, event: CookieChangeEvent ): void;

			/** Constructor for StyleSwitchInternal */
			constructor ( settingsElementId: string ): StyleSwitchInternal;

			/** Gets caption and title only if output element is switch  */
			getCaptionAndTitleForSwitch( interestStyleSheets: Types.ResultArray ): { caption: string; title: string; };

			/** Gets a caption for stylesheet found by style link element */
			getCaptionForStyleSheet( possibleLinkElement: HTMLLinkElement | null ): string;

			/** Gets a title for stylesheet from role */
			getTitleForStyleSheet( role: Enums.Roles ): ?string;

		}

		/** Public exportable part */
		class StyleSwitch extends StyleSwitchInternal {

			/** Get list of possibilities for behavior when color scheme in OS changes. */
			static get PREFERRED_COLOR_SCHEME_CHANGE_BEHAVIOR(): Types.PreferredColorSchemeChangeBehavior;

			/** Get list of possible output formats for widget */
			static get OUTPUT_FORMATS(): Types.OutputFormats;

			/** Get list of possible roles of CSS style sheet file */
			static get ROLE(): Types.Roles;

			/** Returns name of settings get http parameter */
			static get SETTINGS_URL_PARAMETER(): Types.SETTINGS_URL_PARAMETER;

			/** Constructor for StyleSwitch */
			constructor ( settingsElementId: string ): StyleSwitch;

			/** Checks if everything is OK for start, throws error if isn't */
			checkRequirements(): void;

			/** Finds root element for widget, or crates it */
			prepareRootElement(): void;

			/** Finds path of currently activated style sheet file by cookie file */
			async getCurrentlyActivatedStyleSheetsPath(): Promise<{ currentlyActivatedPath: ?string; byNakedDay: boolean }>;

			/** Count of preferred and alternate styles (not persistent), without duplicates (2 link elements, with same path, but different role) */
			getCleanedStyleSheetsObject(): Types.ResultArray;

			/** Get currently used output format (by settings) */
			determineTypeOfOutputElement( interestStyleSheets: Types.ResultArray ): ?Enums.OutputFormats

			/** Create output element switch */
			createSwitch( interestStyleSheets: Types.ResultArray, currentlyActivatedPath: ?string ): void;

			/** Create output element radio list */
			createRadioList( interestStyleSheets: Types.ResultArray, currentlyActivatedPath: ?String ): void;

			/** Create output element select */
			createSelect( interestStyleSheets: Types.ResultArray, currentlyActivatedPath: ?String ): void;

			/** Automatically set naked style if it's Css Naked Day */
			celebrateNakedDay( interestStyleSheets: Types.ResultArray ): void;

			/** Returns document's stylesheet back to normal after naked day ends */
			cancelNakedDay( byNakedDay: boolean ): void;

			/** On change or delete cookie with styles… it changes selected value on root element */
			swapSelectionOnCookieChange( outputFormat: ?Enums.OutputFormats, interestStyleSheets: Types.ResultArray ): void;

			/** Change document's cs stylesheet depends on change default color scheme in OS */
			swapSelectionOnPreferredColorSchemeChange( outputFormat: ?Enums.OutputFormats, currentlyActivatedPath: ?String, interestStyleSheets: Types.ResultArray );

			/** Runs whole StyleSwitch and returns result */
			async run(): Promise<HTMLElement | null>;

			/** Returns default settings for StyleSwitch */
			static get DEFAULT_SETTINGS(): Types.Settings;

		}
	};

};

export { };
