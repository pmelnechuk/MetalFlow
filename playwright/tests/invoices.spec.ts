import { test, expect } from '@playwright/test'
import {
    seedEntity, seedAccount, seedCreditCard, seedInventoryItem,
    cleanupEntity, cleanupInventoryItem, db
} from '../fixtures'

test.describe('Invoice / Facturas', () => {
    let entityId: string
    let accountId: string
    let newItemIds: string[] = []

    test.beforeEach(async () => {
        const entity = await seedEntity(`InvoiceTest-${Date.now()}`)
        entityId = entity.id
        const acct = await seedAccount(entityId, { name: `TestCuenta-${Date.now()}`, initial_balance: 100_000 })
        accountId = acct.id
        newItemIds = []
    })

    test.afterEach(async () => {
        for (const id of newItemIds) await cleanupInventoryItem(id)
        await cleanupEntity(entityId)
    })

    test('InvoiceModal abre y permite carga manual sin foto', async ({ page }) => {
        await page.goto('/finanzas')

        // Click "Factura" button in TopBar
        await page.getByRole('button', { name: /factura/i }).click()

        // Skip upload step
        await page.getByRole('button', { name: /cargar manualmente/i }).click()

        // Should be on review step
        await expect(page.getByPlaceholder(/nombre del proveedor/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /guardar factura/i })).toBeVisible()
    })

    test('factura manual con ítem existente del inventario crea movimiento y actualiza stock', async ({ page }) => {
        const item = await seedInventoryItem({ name: `VarillaTest-${Date.now()}`, unit: 'kg', stock_min: 10 })
        newItemIds.push(item.id)

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /factura/i }).click()
        await page.getByRole('button', { name: /cargar manualmente/i }).click()

        // Fill date
        await page.locator('input[type=date]').fill(new Date().toISOString().split('T')[0])

        // Fill first line item: link to existing inventory item
        await page.locator('input[placeholder="Nombre del ítem"]').first().fill(item.name)
        await page.locator('input[type=number]').nth(0).fill('20')   // qty (nth 0)
        await page.locator('input[type=text]').nth(2).fill('kg')     // unit (0=supplier, 1=itemName, 2=unit)
        await page.locator('input[type=number]').nth(1).fill('500')  // unit_price (nth 1)

        // Link to existing inventory item
        await page.locator('select').filter({ hasText: 'Sin inventario' }).first().selectOption(item.id)

        // Select account payment
        await page.locator('select').filter({ hasText: '' }).last().selectOption({ index: 0 })

        await page.getByRole('button', { name: /guardar factura/i }).click()
        // Wait for modal to close (handleSaveInvoice completes and calls setShowInvoiceModal(false))
        await expect(page.getByRole('button', { name: /guardar factura/i })).not.toBeVisible({ timeout: 15000 })

        // Verify movement created
        const { data: movs } = await db
            .from('movements')
            .select('*')
            .eq('inventory_item_id', item.id)
        expect(movs?.length).toBeGreaterThan(0)
        expect(movs![0].inventory_qty).toBe(20)
    })

    test('factura con ítem nuevo crea inventory_item + movement', async ({ page }) => {
        const newName = `DiscoCorte-${Date.now()}`

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /factura/i }).click()
        await page.getByRole('button', { name: /cargar manualmente/i }).click()

        await page.locator('input[placeholder="Nombre del ítem"]').first().fill(newName)
        await page.locator('input[type=number]').nth(0).fill('5')   // qty
        await page.locator('input[type=number]').nth(1).fill('800') // unit_price

        // Select "Crear nuevo ítem"
        await page.locator('select').filter({ hasText: 'Sin inventario' }).first().selectOption('__new__')

        // Fill new item fields — stock_min input is inside the blue .bg-blue-50 section
        await page.locator('.bg-blue-50 input[type=number]').first().fill('5')  // stock_min

        await page.getByRole('button', { name: /guardar factura/i }).click()
        await expect(page.getByRole('button', { name: /guardar factura/i })).not.toBeVisible({ timeout: 15000 })

        // Verify new inventory item created
        const { data } = await db.from('inventory_items').select('*').eq('name', newName)
        expect(data?.length).toBe(1)
        newItemIds.push(data![0].id)
    })

    test('factura con tarjeta de crédito crea installment_purchase', async ({ page }) => {
        const card = await seedCreditCard(entityId, { name: `VisaFactura-${Date.now()}`, credit_limit: 500_000 })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /factura/i }).click()
        await page.getByRole('button', { name: /cargar manualmente/i }).click()

        await page.locator('input[placeholder="Nombre del ítem"]').first().fill('Compra tarjeta')
        await page.locator('input[type=number]').nth(0).fill('1')    // qty
        await page.locator('input[type=number]').nth(1).fill('30000') // unit_price

        // Switch to card payment
        await page.getByRole('button', { name: /tarjeta crédito/i }).click()
        await page.locator('select').filter({ hasText: card.name }).selectOption(card.id)
        await page.locator('input[placeholder="Cuotas"]').fill('6')

        await page.getByRole('button', { name: /guardar factura/i }).click()
        await expect(page.getByRole('button', { name: /guardar factura/i })).not.toBeVisible({ timeout: 15000 })

        // Verify installment_purchase created
        const { data } = await db.from('installment_purchases').select('*').eq('credit_card_id', card.id)
        expect(data?.length).toBe(1)
        expect(data![0].num_installments).toBe(6)

        // Cleanup
        await db.from('credit_cards').delete().eq('id', card.id)
    })
})
