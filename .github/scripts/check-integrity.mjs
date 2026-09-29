"use strict"

//@ts-check

/**
 * @file check-integrity.mjs
 * @description CI check: every `sha256-…` / `sha384-…` / `sha512-…` hash written in HTML, Markdown and PHP files must match
 * the current content of the file referenced on the same line ( importmap `integrity` or `integrity=""` attribute ).
 * Also checks that version in package.json matches `@version` in style-switch.mjs and version line in README.md.
 * Usage: `node .github/scripts/check-integrity.mjs` ( run `npm ci` first, some hashes point into node_modules )
 */

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' )
const CHECKED_EXTENSIONS = [ '.html', '.md', '.php' ]
const HASH_ALGORITHMS = [ 'sha256', 'sha384', 'sha512' ]
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
const PATH_END_CHARS = [ '?', '#', '"', '\'', '&', ' ', '`', '<', ')' ]

/** @type {(fileName: string) => boolean} */
const isCheckedFile = ( fileName ) => CHECKED_EXTENSIONS.some( ( extension ) => fileName.endsWith( extension ) )

/** @type {() => Array<string>} */
const listCheckedFiles = () => readdirSync( ROOT, { withFileTypes: true } )
	.filter( ( entry ) => entry.isFile() && isCheckedFile( entry.name ) )
	.map( ( entry ) => join( ROOT, entry.name ) )

/** @type {(text: string, start: number) => string} */
const readHashValue = ( text, start ) =>
{
	let end = start
	while ( end < text.length && BASE64_CHARS.includes( text[ end ] ) ) {
		end++
	}
	return text.slice( start, end )
}

/** @type {(linePart: string) => string} */
const findReferencedPath = ( linePart ) =>
{
	const pathStart = linePart.lastIndexOf( './' )
	if ( pathStart === -1 ) {
		return ''
	}
	const endPositions = PATH_END_CHARS
		.map( ( char ) => linePart.indexOf( char, pathStart ) )
		.filter( ( position ) => position !== -1 )
	return linePart.slice( pathStart, endPositions.length ? Math.min( ...endPositions ) : linePart.length )
}

/** @type {(filePath: string, algorithm: string) => string} */
const computeHash = ( filePath, algorithm ) => createHash( algorithm ).update( readFileSync( filePath ) ).digest( 'base64' )

/**
 * @description finds all hashes on one line and returns list of problems
 * @type {(line: string, lineNumber: number, sourceFile: string) => Array<string>}
 */
const checkLine = ( line, lineNumber, sourceFile ) =>
{
	/** @type {Array<string>} */
	const problems = []
	for ( const algorithm of HASH_ALGORITHMS ) {
		const prefix = algorithm + '-'
		let position = line.indexOf( prefix )
		while ( position !== -1 ) {
			const expected = readHashValue( line, position + prefix.length )
			const referencedPath = findReferencedPath( line.slice( 0, position ) )
			const location = `${ relative( ROOT, sourceFile ) }:${ lineNumber }`
			if ( referencedPath && expected ) {
				const absolutePath = join( dirname( sourceFile ), referencedPath )
				if ( !existsSync( absolutePath ) ) {
					problems.push( `${ location } file ${ referencedPath } does not exist` )
				} else {
					const actual = computeHash( absolutePath, algorithm )
					if ( actual !== expected ) {
						problems.push( `${ location } ${ referencedPath }: expected ${ prefix }${ expected }, actual ${ prefix }${ actual }` )
					}
				}
			}
			position = line.indexOf( prefix, position + prefix.length )
		}
	}
	return problems
}

/** @type {(sourceFile: string) => Array<string>} */
const checkFile = ( sourceFile ) => readFileSync( sourceFile, 'utf8' )
	.split( '\n' )
	.flatMap( ( line, index ) => checkLine( line, index + 1, sourceFile ) )

/** @type {(text: string, marker: string) => string} */
const readValueAfter = ( text, marker ) =>
{
	const start = text.indexOf( marker )
	if ( start === -1 ) {
		return ''
	}
	const rest = text.slice( start + marker.length ).trimStart()
	return rest.slice( 0, rest.indexOf( '\n' ) ).split( '`' ).join( '' ).trim()
}

/** @type {() => Array<string>} */
const checkVersions = () =>
{
	const packageVersion = JSON.parse( readFileSync( join( ROOT, 'package.json' ), 'utf8' ) ).version
	const found = {
		'style-switch.mjs @version': readValueAfter( readFileSync( join( ROOT, 'style-switch.mjs' ), 'utf8' ), '@version' ),
		'README.md version': readValueAfter( readFileSync( join( ROOT, 'README.md' ), 'utf8' ), '- version:' ),
	}
	return Object.entries( found )
		.filter( ( [ , version ] ) => version !== packageVersion )
		.map( ( [ place, version ] ) => `${ place } is "${ version }", but package.json version is "${ packageVersion }"` )
}

const problems = [ ...listCheckedFiles().flatMap( checkFile ), ...checkVersions() ]

if ( problems.length ) {
	for ( const problem of problems ) {
		console.error( `✗ ${ problem }` )
	}
	process.exitCode = 1
} else {
	console.log( '✓ all integrity hashes and versions match' )
}
