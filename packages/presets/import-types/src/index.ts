import { isUsingTypes, Types, CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import addPlugin from '@graphql-codegen/add';
import { FragmentDefinitionNode } from 'graphql';

export type ImportTypesConfig = {
  /**
   * @description Required, should point to the base schema types file.
   * The key of the output is used a the base path for this file.
   *
   * @exampleMarkdown
   * ```yaml {5}
   * generates:
   *   path/to/file.ts:
   *     preset: import-types
   *     presetConfig:
   *       typesPath: types.ts
   *     plugins:
   *       - typescript-operations
   * ```
   */
  typesPath: string;
  /**
   * @description Optional, override the name of the import namespace used to import from the `baseTypesPath` file.
   * @default Types
   *
   * @exampleMarkdown
   * ```yaml {6}
   * generates:
   *   src/:
   *     preset: import-types
   *     presetConfig:
   *       typesPath: types.ts
   *       importTypesNamespace: SchemaTypes
   *     plugins:
   *       - typescript-operations
   * ```
   */
  importTypesNamespace?: string;
};

export type FragmentNameToFile = {
  [fragmentName: string]: { location: string; importName: string; onType: string; node: FragmentDefinitionNode };
};

export const preset: Types.OutputPreset<ImportTypesConfig> = {
  buildGeneratesSection: options => {
    if (!options.presetConfig.typesPath) {
      throw new Error(
        `Preset "import-types" requires you to specify "typesPath" configuration and point it to your base types file (generated by "typescript" plugin)!`
      );
    }

    const importTypesNamespace = options.presetConfig.importTypesNamespace || 'Types';
    const pluginMap: { [name: string]: CodegenPlugin } = {
      ...options.pluginMap,
      add: addPlugin,
    };
    const plugins = [...options.plugins];
    const config = {
      ...options.config,
      // This is for the operations plugin
      namespacedImportName: importTypesNamespace,
      // This is for the client-side runtime plugins
      importOperationTypesFrom: importTypesNamespace,
      externalFragments: [],
    };
    options.documents.map(documentFile => {
      if (
        isUsingTypes(
          documentFile.document,
          config.externalFragments.map(m => m.name),
          options.schemaAst
        )
      ) {
        const importType = options.config.useTypeImports ? 'import type' : 'import';
        plugins.unshift({
          add: {
            content: `${importType} * as ${importTypesNamespace} from '${options.presetConfig.typesPath}';\n`,
          },
        });
      }
    });
    return [
      {
        filename: options.baseOutputDir,
        plugins,
        pluginMap,
        config,
        schema: options.schema,
        schemaAst: options.schemaAst,
        documents: options.documents,
      },
    ] as Types.GenerateOptions[] | null;
  },
};

export default preset;
