import { test, expect } from '@playwright/test'
import {
    seedEntity, seedCreditCard, seedAccount,
    seedInstallmentPurchase, cleanupEntity, db
} from '../fixtures'

test.describe('Installments / Cuotas', () => {
    let entityId: string
    let cardId: string
    let accountId: string

    test.beforeEach(async () => {
        const entity = await seedEntity(`InstallTest-${Date.now()}`)
        entityId = entity.id
        const card = await seedCreditCard(entityId, { name: `TestVisa-${Date.now()}`, credit_limit: 200_000, due_day: 25 })
        cardId = card.id
        const acct = await seedAccount(entityId, { name: `CuentaDebito-${Date.now()}`, type: 'bank', initial_balance: 100_000 })
        accountId = acct.id
    })

    test.afterEach(async () => {
        await cleanupEntity(entityId)
    })

    test('registrar compra en 3 cuotas crea 3 installments en DB', async ({ page }) => {
        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // Find the card and click "add installment purchase"
        await page.locator('[title="Registrar compra en cuotas"]').first().click()

        // Fill the form — ensure the seeded card is selected
        await page.locator('select').first().selectOption(cardId)
        await page.getByPlaceholder(/notebook/i).fill('Herramienta test')
        await page.locator('input[type=number]').nth(0).fill('60000')
        await page.locator('input[type=number]').nth(1).fill('3')

        await page.getByRole('button', { name: /registrar/i }).click()
        // Wait for modal to close and DB write to complete
        await expect(page.getByPlaceholder(/notebook/i)).not.toBeVisible()

        // Verify installments created in DB
        const { data } = await db
            .from('installments')
            .select('*')
            .in('installment_purchase_id',
                (await db.from('installment_purchases').select('id').eq('credit_card_id', cardId)).data?.map(r => r.id) ?? []
            )
        expect(data).toHaveLength(3)
        expect(data![0].amount).toBeCloseTo(20_000, 0)
    })

    test('timeline 6 meses muestra cuotas agrupadas', async ({ page }) => {
        await seedInstallmentPurchase(cardId, { total_amount: 60_000, num_installments: 3 })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // Installments timeline section should be visible (h3 heading, not "Sin cuotas pendientes")
        await expect(page.getByRole('heading', { name: /cuotas pendientes/i })).toBeVisible()
        // Should show 3 months with amounts
        await expect(page.locator('text=20.000').first()).toBeVisible()
    })

    test('pagar cuota crea movement y marca cuota como pagada', async ({ page }) => {
        const desc = `PagoTest-${Date.now()}`
        const ip = await seedInstallmentPurchase(cardId, { total_amount: 60_000, num_installments: 3, description: desc })

        // Get first installment
        const { data: installments } = await db
            .from('installments')
            .select('*')
            .eq('installment_purchase_id', ip.id)
            .order('installment_number')
        const firstInstallment = installments![0]

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // Find the installment row in the timeline (has both the description and a Pagar button)
        const installmentRow = page.locator('div.flex.items-center.gap-3').filter({
            has: page.locator('p', { hasText: desc }),
        }).filter({
            has: page.getByRole('button', { name: /pagar/i }),
        }).first()
        await expect(installmentRow).toBeVisible()
        await installmentRow.getByRole('button', { name: /pagar/i }).click()

        // In the PayModal, select the seeded account and confirm
        await page.locator('select').last().selectOption(accountId)
        await page.getByRole('button', { name: /confirmar pago/i }).click()
        // Wait for modal to close confirming async payment completed
        await expect(page.getByRole('button', { name: /confirmar pago/i })).not.toBeVisible({ timeout: 10000 })

        // Verify installment marked as paid
        const { data: updated } = await db.from('installments').select('*').eq('id', firstInstallment.id).single()
        expect(updated.status).toBe('pagado')
        expect(updated.paid_at).not.toBeNull()
        expect(updated.movement_id).not.toBeNull()
    })

    test('cuota vencida muestra badge Vencida', async ({ page }) => {
        // Create an installment with past due_date
        const ip = await seedInstallmentPurchase(cardId, { total_amount: 30_000, num_installments: 1, first_due_date: '2020-01-25' })
        // Override status to vencido
        await db.from('installments').update({ status: 'vencido' }).eq('installment_purchase_id', ip.id)

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        await expect(page.locator('text=Vencida').first()).toBeVisible()
    })

    test('CreditCardCard muestra utilizado y disponible actualizados', async ({ page }) => {
        await seedInstallmentPurchase(cardId, { total_amount: 60_000, num_installments: 3 })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        // Card should show debt_used = 60000 (all unpaid), available = 140000
        await expect(page.locator('text=60.000').first()).toBeVisible()
        await expect(page.locator('text=140.000').first()).toBeVisible()
    })
})
