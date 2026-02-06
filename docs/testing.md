# Testing Guide

テスト実装ガイドライン。

## Test Framework

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | Vitest | 個別関数・ユーティリティ・純粋ロジック |
| Integration | Vitest | API・WebSocket・コンポーネント間連携 |
| Component | Vitest + Testing Library | Reactコンポーネント |
| E2E | Playwright | ユーザージャーニー全体 |

## Test Naming Convention

```yaml
e2e:
  file: "{feature}.spec.ts"
  describe: "Feature: {FeatureName}"
  test: "AC-{N}: {expected behavior}"

integration:
  file: "{feature}.integration.test.ts"
  describe: "Integration: {FeatureName} {Component}"
  test: "{METHOD} {endpoint} {expected behavior}"

unit:
  file: "{module}.test.ts"
  describe: "Unit: {functionName}"
  test: "{expected behavior} when {condition}"
```

## Example Tests

### E2E Test (Playwright)

```typescript
// e2e/tests/business-hours.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Feature: Business Hours', () => {
  test('AC-1: should show entrance when accessed during business hours', async ({ page }) => {
    // Given: 現在時刻が22:00-04:00 JST
    // When: ユーザーがトップページにアクセス
    await page.goto('/')
    // Then: 入店画面が表示される
    await expect(page.getByRole('heading', { name: /入店/i })).toBeVisible()
  })
})
```

### Integration Test (Vitest)

```typescript
// apps/backend/tests/integration/api.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { app } from '../../src/app'

describe('Integration: Business Hours API', () => {
  it('GET /api/status returns open during business hours', async () => {
    vi.setSystemTime(new Date('2026-02-06T23:00:00+09:00'))
    const res = await app.request('/api/status')
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.open).toBe(true)
  })
})
```

### Unit Test (Vitest)

```typescript
// apps/backend/src/__tests__/business-hours.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isOpen } from '../business-hours'

describe('Unit: isOpen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    { hour: 22, expected: true, desc: '22:00 (開店時刻)' },
    { hour: 4, expected: false, desc: '04:00 (閉店時刻)' },
  ])('returns $expected for $desc', ({ hour, expected }) => {
    const utcHour = (hour - 9 + 24) % 24
    vi.setSystemTime(new Date(`2026-02-06T${utcHour.toString().padStart(2, '0')}:00:00Z`))
    expect(isOpen()).toBe(expected)
  })
})
```

## Setup Instructions

詳細は各パッケージのREADMEを参照:
- E2E: `e2e/README.md`
- Backend: `apps/backend/README.md`
- Frontend: `apps/frontend/README.md`
