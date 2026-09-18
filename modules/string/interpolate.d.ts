declare module 'interpolate' {

	/**
	 * Adds an `interpolate` method to the prototype of the given constructor.
	 * By default augments `String.prototype`, enabling template-literal interpolation on strings.
	 */
	class append {

		/**
		 * @param target Constructor function whose prototype will get the `interpolate` method. Defaults to String.
		 */
		constructor ( target?: StringConstructor );

	}

	export { append };

}
