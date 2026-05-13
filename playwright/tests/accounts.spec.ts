import { test, expect } from '@playwright/test'
import { seedEntity, seedAccount, seedMovement, cleanupEntity, db } from '../fixtures'

test.describe('Account balances and movements', () => {
    let entityId: string

    test.beforeEach(async () => {
        const entity = await seedEntity(`AcctTest-${Date.now()}`)
        entityId = entity.id
    })

    test.afterEach(async () => {
        await cleanupEntity(entityId)
    })

    test('cuenta $10.000 → gasto $3.000 → saldo = $7.000 vía view', async () => {
        const acct = await seedAccount(entityId, { initial_balance: 10_000 })
        await seedMovement(entityId, acct.id, -3_000, { type: 'gasto' })

        const { data } = await (db as any).from('account_balances').select('balance').eq('id', acct.id).single()
        expect(data.balance).toBe(7_000)
    })

    test('cuenta $10.000 → ingreso $5.000 → saldo = $15.000', async () => {
        const acct = await seedAccount(entityId, { initial_balance: 10_000 })
        await seedMovement(entityId, acct.id, 5_000, { type: 'ingreso' })

        const { data } = await (db as any).from('account_balances').select('balance').eq('id', acct.id).single()
        expect(data.balance).toBe(15_000)
    })

    test('transferencia entre cuentas actualiza ambas vía transfer_pair_id', async () => {
        const acctA = await seedAccount(entityId, { name: 'A', initial_balance: 10_000 })
        const acctB = await seedAccount(entityId, { name: 'B', initial_balance: 5_000 })

        // Insert transfer pair
        const { data: outLeg } = await db.from('movements').insert({
            entity_id: entityId,
            account_id: acctA.id,
            type: 'transferencia',
            amount: -2_000,
            date: new Date().toISOString().split('T')[0],
        }).select('id').single()

        const { data: inLeg } = await db.from('movements').insert({
            entity_id: entityId,
            account_id: acctB.id,
            type: 'transferencia',
            amount: 2_000,
            date: new Date().toISOString().split('T')[0],
            transfer_pair_id: (outLeg as any).id,
        }).select('id').single()

        await db.from('movements').update({ transfer_pair_id: (inLeg as any).id }).eq('id', (outLeg as any).id)

        // Check balances
        const { data: balanceA } = await (db as any).from('account_balances').select('balance').eq('id', acctA.id).single()
        const { data: balanceB } = await (db as any).from('account_balances').select('balance').eq('id', acctB.id).single()

        expect(balanceA.balance).toBe(8_000)   // 10000 - 2000
        expect(balanceB.balance).toBe(7_000)   // 5000 + 2000
    })

    test('gasto en cuenta con descubierto: saldo negativo dentro del límite', async () => {
        const acct = await seedAccount(entityId, { initial_balance: 500, overdraft_limit: 5_000 })
        await seedMovement(entityId, acct.id, -2_000, { type: 'gasto' })

        const { data } = await (db as any).from('account_balances').select('balance, overdraft_limit').eq('id', acct.id).single()
        expect(data.balance).toBe(-1_500)
        expect(data.overdraft_limit).toBe(5_000)
        // Available with overdraft = -1500 + 5000 = 3500
        expect(data.balance + data.overdraft_limit).toBe(3_500)
    })

    test('AccountCard muestra saldo negativo en rojo en la UI', async ({ page }) => {
        const acct = await seedAccount(entityId, { name: `NegAcct-${Date.now()}`, initial_balance: 500, overdraft_limit: 5_000 })
        await seedMovement(entityId, acct.id, -2_000, { type: 'gasto' })

        await page.goto('/finanzas')
        await page.getByRole('button', { name: /cuentas/i }).click()

        const card = page.locator(`text=${acct.name}`).first()
        await expect(card).toBeVisible()

        // Negative balance shown with red styling (text-red-600 class)
        const balanceEl = page.locator('.text-red-600').first()
        await expect(balanceEl).toBeVisible()
    })
})
