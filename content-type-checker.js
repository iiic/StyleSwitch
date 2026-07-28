"use strict";

//@ts-check

/**
 * @typedef {String & { interpolate: (data: Object<string,string>) => string }} InterpolatedString
 */

import { importWithIntegrity } from './modules/importWithIntegrity.mjs';

/**
 * @class
 * @description internal class, not accessible from outside the script
 */
const ContentTypeCheckerInternal = class
{

	/**
	 * @type {Object}
	 */
	#settings = {
		testingFileExtensions: {
			js: ContentTypeChecker.REPORT_TYPE.WARNING,
			mjs: ContentTypeChecker.REPORT_TYPE.ALERT,
			css: ContentTypeChecker.REPORT_TYPE.WARNING,
			json: ContentTypeChecker.REPORT_TYPE.WARNING,
		},
		contentTypes: {
			js: {
				supported: [
					'text/javascript'
				],
				deprecated: [
					'application/javascript',
					'application/ecmascript',
					'text/ecmascript'
				],
				nonStandard: [
					'application/x-ecmascript',
					'application/x-javascript',
					'text/javascript1.0',
					'text/javascript1.1',
					'text/javascript1.2',
					'text/javascript1.3',
					'text/javascript1.4',
					'text/javascript1.5',
					'text/jscript',
					'text/livescript',
					'text/x-ecmascript',
					'text/x-javascript'
				],
			},
			css: {
				supported: [
					'text/css'
				],
			},
			json: {
				supported: [
					'application/json',
					'application/ld+json',
					'application/manifest+json',
					'application/problem+json',
					'application/schema+json',
					'application/activity+json',
				],
				deprecated: [
					'application/javascript',
					'text/javascript',
					'text/json'
				],
			},
		},
		modulesImportPath: './modules', // 'https://iiic.dev/js/modules',
		texts: {
			jsDeprecatedMimeType: 'Javascript file extension ".${fileExtension}" is associated with content type ${contentType} (for example file ${pathToFile} ). This is marked as deprecated ( https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types#textjavascript ) only proper mime type is now ${properJsFileType} .',
			jsNonStandardMimeType: 'Javascript file extension ".${fileExtension}" is associated with content type ${contentType} (for example file ${pathToFile} ). This is marked as non-standard ( https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types#textjavascript ) only proper mime type is now ${properJsFileType} .',
			jeErrorMimeType: 'Javascript file extension ".${fileExtension}" (for example file ${pathToFile} ). Is NOT associated with content type for javascript. Only proper mime type is now ${properJsFileType} .',
			universalDeprecatedMimeType: 'File extension ".${fileExtension}" is associated with content type ${contentType} (for example file ${pathToFile} ). This is marked as deprecated.',
			universalNonStandardMimeType: 'File extension ".${fileExtension}" is associated with content type ${contentType} (for example file ${pathToFile} ). This is marked as non-standard.',
			universalErrorMimeType: 'Javascript file extension ".${fileExtension}" (for example file ${pathToFile} ). Is NOT associated with correct content type.',
			properTypesSeparator: ', ',
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
	setSettings ( /** @type {Object} */ newSettings = {} )
	{
		this.#settings = ContentTypeCheckerInternal.#deepAssign( this.#settings, newSettings );
	}

	/**
	 * @type {Array.<{ fileExtension: string, path: string; contentType: string; }>}
	 */
	#result = [];

	/**
	 * @returns {Array.<{ fileExtension: string, path: string; contentType: string; }>}
	 */
	getResult ()
	{
		return this.#result;
	}
	setResult ( /** @type {Array.<{ fileExtension: string, path: string; contentType: string; }>} */ result = [] )
	{
		this.#result = result;
	}

	constructor ( /** @type {String} */ settingsElementId = 'content-type-checker-settings' )
	{
		Object.defineProperty( this, 'settings', {
			configurable: true,
			enumerable: true,
			get: this.getSettings,
			set: this.setSettings
		} );

		Object.defineProperty( this, 'result', {
			configurable: false,
			enumerable: false,
			get: this.getResult,
			set: this.setResult
		} );

		/** @type {URLSearchParams} */
		const searchParams = new URL( import.meta.url ).searchParams;

		if ( searchParams.has( 'settings' ) ) {
			const jsonInString = /** @type {String} */ ( searchParams.get( 'settings' ) );
			this.settings = JSON.parse( jsonInString );
		}

		/** @type {HTMLElement | null} */
		const settingsElement = document.getElementById( settingsElementId );

		if ( settingsElement && settingsElement.constructor.name === 'HTMLScriptElement' ) {
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
						value = ContentTypeCheckerInternal.#deepAssign( currentLevel[ key ], value );
					}
					currentLevel = { ...currentLevel, [ key ]: value };
				} );
			}
		} );

		return currentLevel;
	}

	/** @returns {void} */
	propagateReport ( /** @type {{ fileExtension: string, path: string; reportingType?: 'alert' | 'warning' | 'object'; contentType: string; }} */ testingItem, /** @type {String} */ reportResult )
	{

		/** @type {String} */
		let message = '';

		if ( testingItem.fileExtension === 'js' || testingItem.fileExtension === 'mjs' ) {
			if ( reportResult === 'deprecated' ) {
				message = this.settings.texts.jsDeprecatedMimeType;
			} else if ( reportResult === 'nonStandard' ) {
				message = this.settings.texts.jsNonStandardMimeType;
			} else { // error
				message = this.settings.texts.jeErrorMimeType;
			}
		} else {
			if ( reportResult === 'deprecated' ) {
				message = this.settings.texts.universalDeprecatedMimeType;
			} else if ( reportResult === 'nonStandard' ) {
				message = this.settings.texts.universalNonStandardMimeType;
			} else { // error
				message = this.settings.texts.universalErrorMimeType;
			}
		}
		message = /** @type {InterpolatedString} */ ( message ).interpolate( {
			fileExtension: testingItem.fileExtension,
			contentType: testingItem.contentType,
			pathToFile: testingItem.path,
			properJsFileType: this.settings.contentTypes.js.supported.join( this.settings.texts.properTypesSeparator ),
		} );
		if ( testingItem.reportingType === ContentTypeChecker.REPORT_TYPE.ALERT ) {
			alert( message );
		} else if ( testingItem.reportingType === ContentTypeChecker.REPORT_TYPE.WARNING ) {
			console.warn( message );
		}
	}

	/** @returns {String} */
	static getCleanedContentType ( /** @type {String} */ contentType )
	{

		/** @type {Array.<String>} */
		const parts = contentType.split( ';' );

		return parts[ 0 ].trimEnd();
	}

	/** @returns {void} */
	reportSingleResult ( /** @type {{ fileExtension: string, path: string; reportingType?: 'alert' | 'warning' | 'object'; contentType: string; }} */ testingItem )
	{

		/** @type {String} */
		const cleanedContentType = ContentTypeCheckerInternal.getCleanedContentType( testingItem.contentType );

		/** @type {String} */
		let currentFileExtension = testingItem.fileExtension;

		if ( currentFileExtension === 'mjs' ) {
			currentFileExtension = 'js';
		}

		if (
			this.settings.contentTypes[ currentFileExtension ].supported &&
			this.settings.contentTypes[ currentFileExtension ].supported.includes( cleanedContentType )
		) {
			return; // good result
		} else if (
			this.settings.contentTypes[ currentFileExtension ].deprecated &&
			this.settings.contentTypes[ currentFileExtension ].deprecated.includes( cleanedContentType )
		) {
			this.propagateReport( testingItem, 'deprecated' );
		} else if (
			this.settings.contentTypes[ currentFileExtension ].nonStandard &&
			this.settings.contentTypes[ currentFileExtension ].nonStandard.includes( cleanedContentType )
		) {
			this.propagateReport( testingItem, 'nonStandard' );
		} else {
			this.propagateReport( testingItem, 'error' );
		}
	};

	/** @returns {void|Array.<{ fileExtension: string, path: string; contentType: string; }>} */
	reportResults ( /** @type {Array.<{ fileExtension: string, path: string; reportingType: 'alert' | 'warning' | 'object'; contentType: string; }>} */ testingResults )
	{

		/** @type {Array.<{ fileExtension: string, path: string; contentType: string; }>} */
		const returnReport = [];

		loopThroughAllResults:
		testingResults.forEach( ( /** @type {{ fileExtension: string, path: string; reportingType?: 'alert' | 'warning' | 'object'; contentType: string; }} */ testingItem ) =>
		{
			if ( testingItem.reportingType === ContentTypeChecker.REPORT_TYPE.OBJECT ) {
				delete testingItem.reportingType;
				returnReport.push( testingItem );
			} else {
				this.reportSingleResult( testingItem );
			}
		} );

		if ( returnReport.length ) {
			return returnReport;
		}
	}

	/** @returns {void} */
	checkRequirements ()
	{
		if ( !this.settings ) {
			throw new Error( 'Settings object is missing' );
		}
	}

	/** @returns {Promise<Array.<Promise.<{ fileExtension: string, path: string; reportingType: 'alert' | 'warning' | 'object'; contentType: string; }>>>} */
	static async prepareFetches ( /** @type {Array<{fileExtension: string, path: string, reportingType: 'alert' | 'warning' | 'object', contentType: string}>} */ testingFileExtensionsObject )
	{

		/** @type {Array.<Promise<{fileExtension: string, path: string; reportingType: 'alert' | 'warning' | 'object'; contentType: string; }>>} */
		const promises = [];

		loopThroughDocumentsFoundPaths:
		testingFileExtensionsObject.forEach( ( /** @type {{fileExtension: string, path: string, reportingType: 'alert' | 'warning' | 'object', contentType: string}} */ testingItem ) =>
		{
			promises.push( fetch( testingItem.path, {
				method: 'HEAD',
				credentials: 'omit',
				cache: 'no-store',
				referrerPolicy: 'no-referrer',
				redirect: 'follow',
				mode: 'cors'
			} ).then( ( /** @type {Response} */ response ) =>
			{
				if ( response && response.ok && response.status === 200 ) {
					return response.headers.get( 'content-type' );
				}
				throw new Error( 'Cannot fetch :(' );
			} ).then( ( /** @type {String|null} */ contentType ) =>
			{
				if ( contentType ) {
					testingItem.contentType = contentType;
					return testingItem;
				}
				throw new Error( 'Content type of file ' + testingItem.path + ' not found' );
			} ).catch( ( /** @type {Error|Response} */ error ) =>
			{
				return Promise.reject( error );
			} )
			);
		} );

		return promises;
	}

	/** @returns {String|null} */
	findPathToFirstFile ( /** @type { HTMLCollectionOf<HTMLScriptElement> | NodeListOf<HTMLLinkElement> } */ foundElements, /** @type {String} */ fileExtension = 'mjs' )
	{
		loopThroughDocumentsFoundElements:
		for (/** @type {HTMLScriptElement|HTMLLinkElement} */ const element of foundElements ) {

			/** @type {String} */
			let path = ''

			if ( element.constructor.name === 'HTMLScriptElement' ) {
				const scriptElement = /** @type {HTMLScriptElement} */ ( element );
				path = scriptElement.src;
			} else if ( element.constructor.name === 'HTMLLinkElement' ) {
				const linkElement = /** @type {HTMLLinkElement} */ ( element );
				path = linkElement.href;
			}

			if ( path
				&& ( path.endsWith( '.' + fileExtension )
					|| path.includes( '.' + fileExtension + '?' )
				)
			) {
				return path;
			}
		}
		return null;
	};

	/** @returns {Array<{fileExtension: string, path: string, reportingType: 'alert' | 'warning' | 'object', contentType: string}>} */
	prepareTestingObject ()
	{

		/** @type {Array<{fileExtension: string, path: string, reportingType: 'alert' | 'warning' | 'object', contentType: string}>} */
		const testingFileExtensionsObject = [];

		loopThroughPossibleFileExtensions:
		Object.entries( this.settings.testingFileExtensions ).forEach( ( [
			/** @type {String} */ fileExtension,
			/** @type {'alert' | 'warning' | 'object'} */ reportingType
		] ) =>
		{

			/** @type {String} */
			let firstTestingFileSrc = '';

			/** @type {HTMLCollectionOf<HTMLScriptElement>} */
			let scriptElements = document.head.getElementsByTagName( 'script' );

			if ( scriptElements.length ) {
				firstTestingFileSrc = this.findPathToFirstFile( scriptElements, fileExtension ) ?? '';
			}
			if ( !firstTestingFileSrc ) {
				firstTestingFileSrc = this.findPathToFirstFile( document.body.getElementsByTagName( 'script' ), fileExtension ) ?? '';
			}
			if ( !firstTestingFileSrc ) {
				firstTestingFileSrc = this.findPathToFirstFile( document.querySelectorAll( 'link[rel=preload], link[rel~=stylesheet]' ), fileExtension ) ?? '';
			}
			if ( firstTestingFileSrc ) {
				testingFileExtensionsObject.push( {
					fileExtension: fileExtension,
					path: firstTestingFileSrc,
					reportingType: reportingType,
					contentType: '' // default empty string, real value will be fetched later
				} );
			}
		} );
		return testingFileExtensionsObject;
	}

	static async loadExternalFunctions ( /** @type {String} */ modulesImportPath = '' )
	{
		return Promise.all( [
			{
				name: 'interpolate',
				appendInto: String,
				path: modulesImportPath + '/string/interpolate.mjs',
				integrity: 'sha256-Aitn7qM8Ml8BV4dtcQUksJfFzdU9NQ745axG1nK9y44='
			},
		].map( async ( { name, appendInto, path, integrity } ) =>
		{
			if ( !appendInto.hasOwnProperty( name ) ) {
				return importWithIntegrity(
					/** @type {String} */ path,
					/** @type {String} */ integrity
				).then( ( /** @type {module} */ module ) =>
				{
					return new module.append( appendInto );
				} );
			}
		} ) );
	}

	updatePathByBase ()
	{

		/** @type {HTMLBaseElement|null} */
		const possibleBaseElement = document.head.querySelector( 'base' );

		if ( possibleBaseElement && possibleBaseElement.href ) {
			this.settings.modulesImportPath = possibleBaseElement.href + this.settings.modulesImportPath;
		}
	}

	/** @returns {Promise.<void|Array.<{ fileExtension: string, path: string; contentType: string; }>>} */
	async run ()
	{
		this.checkRequirements();
		this.updatePathByBase();
		await ContentTypeChecker.loadExternalFunctions( this.settings.modulesImportPath );

		/** @type {Array<{fileExtension: string, path: string, reportingType: 'alert' | 'warning' | 'object', contentType: string}>} */
		const testingObject = this.prepareTestingObject();

		/** @type {Array.<Promise<{ fileExtension: string, path: string; reportingType: 'alert' | 'warning' | 'object'; contentType: string; }>>} */
		const promises = await ContentTypeCheckerInternal.prepareFetches( testingObject );

		/** @type {Array.<{ fileExtension: string, path: string; reportingType: 'alert' | 'warning' | 'object'; contentType: string; }>} */
		const testingResults = await Promise.all( promises );

		return this.reportResults( testingResults );
	}
}

/**
 * @class
 * @description accessible from Window object
 * @extends ContentTypeCheckerInternal
 * @returns {void|Array.<{ fileExtension: string, path: string; contentType: string; }>}
 */
class ContentTypeChecker extends ContentTypeCheckerInternal
{
	constructor ( /** @type {String} */ settingsElementId = 'content-type-checker-settings' )
	{
		super( ...arguments );
		if ( this.settings.autoRun ) {
			this.result = this.run();
		}
	}
};

Object.defineProperty( ContentTypeChecker, 'REPORT_TYPE', {
	value: {
		ALERT: 'alert',
		WARNING: 'warning',
		OBJECT: 'object',
	},
	configurable: false,
	enumerable: true,
	writable: false,
} );

/** @returns {void|Array.<{ fileExtension: string, path: string; contentType: string; }>} */
const ctc = new ContentTypeChecker();

const result = await ctc.result;

export { ContentTypeChecker, result };
