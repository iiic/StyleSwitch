<?php

declare(strict_types=1);

/**
 * @file example-usage.php
 * @description Server-side (PHP) counterpart of style-switch-cookie-listener-example.js. It reads the cookie in which
 * StyleSwitch stores the chosen style and renders the style sheet `link` elements already switched to that style,
 * so the page is shown in the chosen style right from the first paint, without waiting for JavaScript.
 * The attributes are changed the same way the JS listener changes them (`data-alternate`, `data-title`, `data-media`,
 * `disabled`), so StyleSwitch and the optional JS listener keep working on the generated page.
 * Requires PHP 8.1+. This file is only an example, it is not needed for StyleSwitch.
 */

/** Name of the cookie, must match `cookie.name` in StyleSwitch settings ( default 'stylesheets' ) */
const STYLE_SWITCH_COOKIE_NAME = 'stylesheets';

/** Key used in the cookie for the naked style ( page without any CSS ) */
const NAKED_STYLE_PATH = '';

/**
 * Style sheets of this page, same as in example-usage.html. `href` must be written exactly the same way as in
 * the rendered `link` element, StyleSwitch stores the value of the `href` attribute as a key in the cookie.
 * @var list<array{href: string, rel: string, title?: string, media?: string, comment: string, extra?: array<string, string>}>
 */
const STYLE_SHEETS = [
	[
		'href' => './example-css/switch.css',
		'rel' => 'stylesheet',
		'comment' => '(persistent) example style for snippet element Switch',
	],
	[
		'href' => './example-css/light.css',
		'rel' => 'stylesheet',
		'comment' => 'persistent',
		'extra' => [ 'fetchpriority' => 'high' ],
	],
	[
		'href' => './example-css/dark.css',
		'rel' => 'stylesheet',
		'title' => 'Dark style',
		'media' => '(prefers-color-scheme: dark)',
		'comment' => 'preferred',
	],
	[
		'href' => './example-css/light.css',
		'rel' => 'alternate stylesheet',
		'title' => 'Light style',
		'comment' => 'alternate',
	],
	[
		'href' => './example-css/alternate.css',
		'rel' => 'alternate stylesheet',
		'title' => 'Alternate style',
		'comment' => 'alternate',
		'extra' => [ 'fetchpriority' => 'low' ],
	],
];

/**
 * Reads the cookie and returns the path of the chosen style sheet ( '' for naked style ), or null when the user
 * has not chosen any style yet or the cookie is not valid. Cookie value looks like:
 * `{"./example-css/dark.css":{"disabled":true},"./example-css/light.css":{"disabled":false},"":{"disabled":true}}`
 * @param array<string, mixed> $cookies usually `$_COOKIE`
 */
function getChosenStyleSheetPath ( array $cookies ): ?string
{
	$cookieValue = $cookies[ STYLE_SWITCH_COOKIE_NAME ] ?? '';
	if ( !is_string( $cookieValue ) || $cookieValue === '' ) { // empty value means same behavior like deleted cookie
		return null;
	}
	try {
		$styles = json_decode( $cookieValue, true, 3, JSON_THROW_ON_ERROR );
	} catch ( JsonException ) {
		return null;
	}
	if ( !is_array( $styles ) ) {
		return null;
	}
	foreach ( $styles as $path => $state ) {
		if ( is_array( $state ) && ( $state[ 'disabled' ] ?? null ) === false ) {
			return (string) $path;
		}
	}
	return null;
}

/**
 * Returns attributes of one `link` element switched by the chosen style, same logic as resetCssStyleSheets() in
 * style-switch-cookie-listener-example.js. Without a chosen style the attributes are kept as they are.
 * @param array{href: string, rel: string, title?: string, media?: string, comment: string, extra?: array<string, string>} $styleSheet
 * @return array<string, string|true>
 */
function getLinkAttributes ( array $styleSheet, ?string $chosenPath ): array
{
	/** @var array<string, string|true> $attributes */
	$attributes = [ 'rel' => $styleSheet[ 'rel' ], 'href' => $styleSheet[ 'href' ] ];
	if ( isset( $styleSheet[ 'title' ] ) ) {
		$attributes[ 'title' ] = $styleSheet[ 'title' ];
	}
	if ( isset( $styleSheet[ 'media' ] ) ) {
		$attributes[ 'media' ] = $styleSheet[ 'media' ];
	}

	if ( $chosenPath === null ) {
		return $attributes;
	}

	if ( !isset( $styleSheet[ 'title' ] ) ) { // persistent style sheet, disabled only by naked style
		if ( $chosenPath === NAKED_STYLE_PATH ) {
			$attributes[ 'disabled' ] = true;
		}
		return $attributes;
	}

	if ( $styleSheet[ 'href' ] !== $chosenPath ) {
		$attributes[ 'disabled' ] = true;
		return $attributes;
	}

	// chosen style sheet, enable it and hide attributes which would stop the browser from using it
	if ( str_contains( $styleSheet[ 'rel' ], 'alternate' ) ) {
		$attributes[ 'rel' ] = 'stylesheet';
		$attributes[ 'data-alternate' ] = '';
	}
	unset( $attributes[ 'title' ] );
	$attributes[ 'data-title' ] = $styleSheet[ 'title' ];
	if ( isset( $styleSheet[ 'media' ] ) ) { // user has chosen this style, so it applies whatever the media query says
		unset( $attributes[ 'media' ] );
		$attributes[ 'data-media' ] = $styleSheet[ 'media' ];
	}
	return $attributes;
}

/**
 * Renders one `link` element, attributes in order: href, rel, then the others alphabetically.
 * @param array{href: string, rel: string, title?: string, media?: string, comment: string, extra?: array<string, string>} $styleSheet
 */
function renderLink ( array $styleSheet, ?string $chosenPath ): string
{
	$attributes = [
		...getLinkAttributes( $styleSheet, $chosenPath ),
		...( $styleSheet[ 'extra' ] ?? [] ),
		'crossorigin' => 'anonymous',
	];
	$href = $attributes[ 'href' ];
	$rel = $attributes[ 'rel' ];
	unset( $attributes[ 'href' ], $attributes[ 'rel' ] );
	ksort( $attributes );

	$html = '<link href="' . escapeHtml( (string) $href ) . '" rel="' . escapeHtml( (string) $rel ) . '"';
	foreach ( $attributes as $name => $value ) {
		$html .= $value === true ? ' ' . $name : ' ' . $name . '="' . escapeHtml( $value ) . '"';
	}
	return $html . '><!-- ' . escapeHtml( $styleSheet[ 'comment' ] ) . ' -->';
}

function escapeHtml ( string $text ): string
{
	return htmlspecialchars( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
}

/** Human readable name of the chosen style, for the demo text in the page */
function getChosenStyleCaption ( ?string $chosenPath ): string
{
	if ( $chosenPath === null ) {
		return 'none yet, the browser uses the default style ( preferred by OS color scheme or persistent )';
	}
	if ( $chosenPath === NAKED_STYLE_PATH ) {
		return 'Without style (naked HTML)';
	}
	foreach ( STYLE_SHEETS as $styleSheet ) {
		if ( $styleSheet[ 'href' ] === $chosenPath && isset( $styleSheet[ 'title' ] ) ) {
			return $styleSheet[ 'title' ];
		}
	}
	return 'unknown style, the cookie points to a style sheet which is not in this page';
}

$chosenPath = getChosenStyleSheetPath( $_COOKIE );

header( 'Content-Type: text/html; charset=utf-8' );
header( 'Vary: Cookie' ); // generated HTML depends on the cookie, caches must not share it between users

?><!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>StyleSwitch PHP example</title>
	<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
	<!-- Optional, switches the style live after the choice, without page reload. Without it the new style is used after the next page load ( rendered by PHP ) -->
	<script src="./style-switch-cookie-listener-example.js?v=1.0" type="module" crossorigin="anonymous" integrity="sha256-CJNHv370jlgrCgbvYufk258TKe7tXWU1fBGBBgQXqrE="></script>
	<link href="./favicon.ico" type="image/x-icon" rel="icon">
<?php foreach ( STYLE_SHEETS as $styleSheet ) : ?>
	<?= renderLink( $styleSheet, $chosenPath ), "\n" ?>
<?php endforeach ?>
	<script type="application/json" id="styleSwitchSettings">
	{
		"nakedStyle": {
			"use": true
		},
		"texts": {
			"caption": "Chose a style for website"
		}
	}
	</script>
	<script src="./style-switch.mjs?v=1.4.2" type="module" crossorigin="anonymous" integrity="sha256-T4UH0d5j4kg0b+hupVOIW4aWRjJPwija0MTlrzXWqgk="></script>
</head>

<body>

	<ul id="loaded-styles">
		<li class="dark.css" hidden>loaded file <em>dark.css</em></li>
		<li class="light.css" hidden>loaded file <em>light.css</em></li>
		<li class="alternate.css" hidden>loaded file <em>alternate.css</em></li>
	</ul>

	<header>
		<h1 id="style-switch-php-example">StyleSwitch… PHP example</h1>
		<p>This page is generated by PHP. The server reads the cookie <code><?= escapeHtml( STYLE_SWITCH_COOKIE_NAME ) ?></code> saved by StyleSwitch and sends the style sheets already switched to the chosen style, so there is no flash of the default style on page load.</p>
	</header>

	<main>
		<section id="live-demo">
			<header>
				<h2 id="live-demo-heading">Choose a style</h2>
				<fieldset id="style-switch">
					<legend>Available styles… choose from the select to switch the page style</legend>
				</fieldset>
			</header>
			<p>Style chosen when this page was generated: <strong><?= escapeHtml( getChosenStyleCaption( $chosenPath ) ) ?></strong></p>
			<p>Reload the page after a change and look at the page source, the <code>link</code> elements in the <code>head</code> are changed by PHP.</p>
		</section>
		<hr>
		<section>
			<p>More in <a href="./example-usage.html">example-usage.html</a> and <a href="./README.md">README.md</a>.</p>
		</section>
	</main>

	<footer>
		<hr>
		<p>
			<small>iiic.dev</small>
		</p>
	</footer>
