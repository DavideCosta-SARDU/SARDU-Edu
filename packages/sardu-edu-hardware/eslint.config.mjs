import { eslintConfigScratch } from 'eslint-config-scratch'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'

export default eslintConfigScratch.defineConfig(
  eslintConfigScratch.recommended,
  {
    files: ['src/**', 'test/**'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['*'],
    languageOptions: {
      globals: globals.node,
    },
  },
  globalIgnores(['dist/**', 'node_modules/**']),
)
