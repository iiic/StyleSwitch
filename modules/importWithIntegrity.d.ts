declare module 'importWithIntegrity' {
	/** Hash algorithms accepted by the helper before the default is applied. */
	type IntegrityAlgorithm = 'sha256' | 'sha384' | 'sha512'

	/** Integrity metadata in the usual `<algorithm>-<digest>` form. */
	type IntegrityMetadata = `${IntegrityAlgorithm}-${string}`

	/** Constructor exported by the dynamically imported module. */
	type ImportedModuleExportConstructor = new ( target?: StringConstructor ) => unknown

	/** Namespace object returned by the dynamic import used by this project. */
	interface ImportedModule {
		append: ImportedModuleExportConstructor
	}

	/**
	 * Adds a module script with Subresource Integrity metadata and dynamically imports the same module.
	 *
	 * An empty or non-prefixed integrity value is accepted by the implementation and normalized to SHA-256.
	 * The returned promise resolves with the imported module namespace after the dynamic import succeeds.
	 */
	export function importWithIntegrity(
		path: string,
		integrity: string | IntegrityMetadata
	): Promise<ImportedModule>
}
