import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import globals from 'globals'

// me-me-en の clean architecture 境界を機械的に強制する ESLint flat config。
//
// 依存方向 (外 → 内のみ):
//   apps/web → infrastructure → application → domain
//   apps/web も contracts を import 可。contracts → domain だけ。
//
// import-x/no-restricted-paths の zones で「禁止する import」を declarative に書く。

const PROJECT_ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '')

const restrictedPathsZones = [
  // domain は依存なし
  {
    target: `${PROJECT_ROOT}/packages/domain/src`,
    from: [
      `${PROJECT_ROOT}/packages/application`,
      `${PROJECT_ROOT}/packages/infrastructure`,
      `${PROJECT_ROOT}/packages/contracts`,
      `${PROJECT_ROOT}/apps/web`,
    ],
    message: 'domain layer must not depend on outer layers.',
  },
  // application は domain のみ。infrastructure / apps への参照を禁止
  {
    target: `${PROJECT_ROOT}/packages/application/src`,
    from: [
      `${PROJECT_ROOT}/packages/infrastructure`,
      `${PROJECT_ROOT}/apps/web`,
    ],
    message:
      'application layer must depend only on domain. infrastructure / apps are outer.',
  },
  // infrastructure は domain + application のみ。apps への参照を禁止
  {
    target: `${PROJECT_ROOT}/packages/infrastructure/src`,
    from: [`${PROJECT_ROOT}/apps/web`],
    message: 'infrastructure must not depend on apps.',
  },
  // contracts は domain だけ
  {
    target: `${PROJECT_ROOT}/packages/contracts/src`,
    from: [
      `${PROJECT_ROOT}/packages/application`,
      `${PROJECT_ROOT}/packages/infrastructure`,
      `${PROJECT_ROOT}/apps/web`,
    ],
    message: 'contracts must depend only on domain.',
  },
]

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/prisma/generated/**',
      'docs/design/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './tsconfig.json',
            './packages/*/tsconfig.json',
            './apps/*/tsconfig.json',
          ],
        },
        node: true,
      },
    },
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        { zones: restrictedPathsZones },
      ],
      // tsc がやる仕事なので止める
      'import-x/no-unresolved': 'off',
      // workspace 越しの type 参照に対する誤検知が多いので緩める
      'import-x/named': 'off',
      'import-x/namespace': 'off',
      'import-x/default': 'off',
      // flat config 内で default import を使うのは typescript-eslint / import-x の
      // 公式推奨パターン。誤情報的な warning を抑える。
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      // 既存コードは underscore prefix の unused を許容する
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  // テスト用 file は any や catch any を許容
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__test-helpers__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
)
