import { test, expect } from '@playwright/test'
import {
    seedEntity, seedAccount, seedInventoryItem,
    seedMovement, cleanupEntity, cleanupInventoryItem, db
} from '../fixtures'

test.describe('Inventory stock derived from movements', () => {
    let entityId: string
    let accountId: string
    let itemId: string

    test.beforeEach(async () => {
        const entity = await seedEntity(`InvTest-${Date.now()}`)
        entityId = entity.id
        const acct = await seedAccount(entityId, { initial_balance: 100_000 })
        accountId = acct.id
        const item = await seedInventoryItem({ name: `Chapa-${Date.now()}`, unit: 'u', stock_min: 10 })
        itemId = item.id
    })

    test.afterEach(async () => {
        await cleanupInventoryItem(itemId)
        await cleanupEntity(entityId)
    })

    test('stock inicial = 0, badge Sin stock', async () => {
        const { data } = await (db as any)
            .from('inventory_stock')
            .select('stock_current')
            .eq('id', itemId)
            .single()
        expect(data.stock_current).toBe(0)
    })

    test('compra_insumo +20 → stock = 20', async () => {
        await seedMovement(entityId, accountId, -10_000, {
            type: 'compra_insumo',
            inventory_item_id: itemId,
            inventory_qty: 20,
        })

        const { data } = await (db as any)
            .from('inventory_stock')
            .select('stock_current')
            .eq('id', itemId)
            .single()
        expect(data.stock_current).toBe(20)
    })

    test('compra +20 → consumo -5 → stock = 15', async () => {
        await seedMovement(entityId, accountId, -10_000, {
            type: 'compra_insumo',
            inventory_item_id: itemId,
            inventory_qty: 20,
        })
        await seedMovement(entityId, accountId, 0, {
            type: 'consumo_insumo',
            inventory_item_id: itemId,
            inventory_qty: 5,  // view subtracts consumo_qty: stock = compra - consumo
        })

        const { data } = await (db as any)
            .from('inventory_stock')
            .select('stock_current')
            .eq('id', itemId)
            .single()
        expect(data.stock_current).toBe(15)
    })

    test('stock bajo muestra badge Bajo stock en UI', async ({ page }) => {
        // stock_current=8 < stock_min=10 → low stock
        await seedMovement(entityId, accountId, -4_000, {
            type: 'compra_insumo',
            inventory_item_id: itemId,
            inventory_qty: 8,
        })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /inventario/i }).click()
        // Wait for inventory data to load (item name starts with "Chapa-" from beforeEach)
        await page.locator('text=Chapa-').first().waitFor({ timeout: 10000 })

        await expect(page.locator('text=Stock bajo').first()).toBeVisible()
    })

    test('stock = 0 muestra badge Sin stock en UI', async ({ page }) => {
        await page.goto('/finanzas')
        await page.getByRole('button', { name: /inventario/i }).click()

        await expect(page.locator('text=Sin stock').first()).toBeVisible()
    })

    test('múltiples compras se acumulan en inventory_stock view', async () => {
        await seedMovement(entityId, accountId, -5_000, {
            type: 'compra_insumo',
            inventory_item_id: itemId,
            inventory_qty: 10,
        })
        await seedMovement(entityId, accountId, -3_000, {
            type: 'compra_insumo',
            inventory_item_id: itemId,
            inventory_qty: 7,
        })

        const { data } = await (db as any)
            .from('inventory_stock')
            .select('stock_current')
            .eq('id', itemId)
            .single()
        expect(data.stock_current).toBe(17)
    })
})
