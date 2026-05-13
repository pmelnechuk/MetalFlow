import { test, expect } from '@playwright/test'
import { seedEntity, seedBank, seedAccount, seedCreditCard, cleanupEntity } from '../fixtures'

test.describe('Banking structure', () => {
    let entityId: string

    test.beforeEach(async () => {
        const entity = await seedEntity(`BankingTest-${Date.now()}`)
        entityId = entity.id
    })

    test.afterEach(async () => {
        await cleanupEntity(entityId)
    })

    test('crear banco aparece en selector de AccountModal', async ({ page }) => {
        const bank = await seedBank(entityId, `Galicia-${Date.now()}`)

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // Click "Nueva cuenta"
        await page.getByRole('button', { name: /nueva cuenta/i }).click()

        // Select tipo Banco to reveal bank selector
        await page.getByRole('button', { name: /banco/i }).click()

        // Bank should appear in the bank selector
        const bankSelect = page.locator('select').filter({ hasText: bank.name })
        await expect(bankSelect).toBeVisible()
        await expect(bankSelect.locator(`option[value="${bank.id}"]`)).toBeAttached()
    })

    test('crear cuenta bancaria muestra nombre de banco en AccountCard', async ({ page }) => {
        const bank = await seedBank(entityId, `Santander-${Date.now()}`)
        const acct = await seedAccount(entityId, { name: `Cuenta-${Date.now()}`, type: 'bank', initial_balance: 10_000, bank_id: bank.id })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // AccountCard should mention the bank name
        const card = page.locator('text=' + acct.name)
        await expect(card).toBeVisible()
        await expect(page.locator(`text=${bank.name}`).first()).toBeVisible()
    })

    test('cuenta con descubierto muestra barra de overdraft', async ({ page }) => {
        await seedAccount(entityId, {
            name: `CuentaDescubierto-${Date.now()}`,
            type: 'bank',
            initial_balance: 1_000,
            overdraft_limit: 5_000,
        })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // Overdraft section should be visible
        await expect(page.locator('text=Descubierto')).toBeVisible()
        await expect(page.locator('text=Límite')).toBeVisible()
    })

    test('nueva tarjeta de crédito muestra límite y disponible correctos', async ({ page }) => {
        const card = await seedCreditCard(entityId, {
            name: `VisaTest-${Date.now()}`,
            credit_limit: 200_000,
        })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // CreditCardCard should show limit and available
        await expect(page.locator(`text=${card.name}`)).toBeVisible()
        await expect(page.locator('text=200.000').first()).toBeVisible()
        // No debt yet → available = limit
        await expect(page.locator('text=Disp').first()).toBeVisible()
    })

    test('modal de nueva tarjeta valida campos requeridos', async ({ page }) => {
        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()
        await page.getByRole('button', { name: /nueva tarjeta/i }).click()

        // Save button disabled without required fields
        const saveBtn = page.getByRole('button', { name: /crear/i })
        await expect(saveBtn).toBeDisabled()

        // Fill name and limit → button enabled
        await page.getByPlaceholder(/visa galicia/i).fill('Test Card')
        await page.locator('input[type=number]').first().fill('50000')
        await expect(saveBtn).toBeEnabled()
    })
})
