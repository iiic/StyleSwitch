"use strict"

//@ts-check

/**
 * @file browser-tests.mjs
 * @description CI check: serves repository on localhost, opens tests-runner.html in headless Chromium and fails when
 * any test fails ( `✗` ), any error is logged into console, page throws an error or shows a dialog ( alert ).
 * Usage: `node .github/scripts/browser-tests.mjs` ( run `npm ci` and `npx playwright install chromium` first )
 * Optional env `CHROMIUM_PATH` points to already installed Chromium binary instead of the Playwright one.
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' )
const TEST_PAGE = '/tests-runner.html'
const QUIET_PERIOD_MS = 2000
const TIMEOUT_MS = 60000

/** @type {Record<string, string>} */
const CONTENT_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.ico': 'image/x-icon',
	'.png': 'image/png',
}

/** @type {(request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse) => Promise<void>} */
const serveFile = async ( request, response ) =>
{
	const urlPath = decodeURIComponent( new URL( request.url ?? '/', 'http://localhost' ).pathname )
	const filePath = normalize( join( ROOT, urlPath ) )
	if ( !filePath.startsWith( ROOT ) ) {
		response.writeHead( 403 ).end()
		return
	}
	try {
		const body = await readFile( filePath )
		response.writeHead( 200, { 'Content-Type': CONTENT_TYPES[ extname( filePath ) ] ?? 'application/octet-stream' } )
		response.end( body )
	} catch {
		response.writeHead( 404 ).end()
	}
}

/** @type {(ms: number) => Promise<void>} */
const wait = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) )

const server = createServer( serveFile )
await new Promise( ( resolve ) => server.listen( 0, '127.0.0.1', () => resolve( undefined ) ) )
const address = /** @type {import('node:net').AddressInfo} */ ( server.address() )

const browser = await chromium.launch( { executablePath: process.env.CHROMIUM_PATH || undefined } )
const page = await browser.newPage()

/** @type {Array<string>} */
const problems = []
let passedCount = 0
let lastActivity = Date.now()

page.on( 'console', ( message ) =>
{
	lastActivity = Date.now()
	const text = message.text()
	if ( text.startsWith( '✓' ) ) {
		passedCount++
	}
	if ( message.type() === 'error' || text.startsWith( '✗' ) ) {
		problems.push( `console.${ message.type() }: ${ text }` )
	}
} )
page.on( 'pageerror', ( error ) => problems.push( `page error: ${ error.message }` ) )
page.on( 'requestfailed', ( request ) => problems.push( `request failed: ${ request.url() }` ) )
page.on( 'dialog', async ( dialog ) =>
{
	problems.push( `dialog ( ${ dialog.type() } ): ${ dialog.message() }` )
	await dialog.dismiss()
} )

try {
	await page.goto( `http://127.0.0.1:${ address.port }${ TEST_PAGE }`, { waitUntil: 'load' } )
	const startedAt = Date.now()
	while ( Date.now() - lastActivity < QUIET_PERIOD_MS && Date.now() - startedAt < TIMEOUT_MS ) {
		await wait( 200 )
	}
} finally {
	await browser.close()
	server.close()
}

if ( passedCount === 0 ) {
	problems.push( 'no passed test found, tests probably did not run at all' )
}

if ( problems.length ) {
	for ( const problem of problems ) {
		console.error( `✗ ${ problem }` )
	}
	process.exitCode = 1
} else {
	console.log( `✓ ${ passedCount } tests passed in Chromium` )
}
