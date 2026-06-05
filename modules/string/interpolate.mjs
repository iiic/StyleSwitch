export class append
{
	constructor ( s = String )
	{
		const FUNCTION_NAME = 'interpolate';

		if ( typeof s()[ FUNCTION_NAME ] !== 'function' ) {
			Object.defineProperty( s.prototype, FUNCTION_NAME, {
				value: function ( /** @type {Object.<string:string>} */ customArguments )
				{
					return new Function( ...Object.keys( customArguments ), `return \`${ this }\`;` )( ...Object.values( customArguments ) );
				},
				writable: false,
				configurable: false,
				enumerable: false,
			} );
		}
	}
}
