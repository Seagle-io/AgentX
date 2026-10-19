// Scénario T270 : filtres de la liste (Liste, Cabinet, tag lecture, recherche, tri, page 2) → Imprimer « Exercice 10 » → Retour : filtres conservés ?
// usage : node ../../banc.mjs --dist <dist> --api liste-api.mjs --chemin /exercises --out t270/apres --scenario liste-filtres.mjs
export default async ({ page: p, out, log, origine }) => {
	const etat = async () => ({
		url: p.url().replace(origine, ''),
		recherche: await p.locator('input[placeholder="Rechercher dans les exercices…"]').inputValue().catch(() => '∅'),
		stockage: await p.evaluate(() => localStorage.getItem('exercise-list-filters')),
		lignes: (await p.locator('[data-tour=exo-grid]').innerText().catch(() => '')).split('\n').filter(l => /^Exercice \d+$/.test(l)).join(','),
	})
	await p.getByText('Liste', { exact: true }).click()
	await p.getByText(/^Cabinet/).first().click()
	await p.getByText('lecture', { exact: true }).last().click()
	await p.locator('input[placeholder="Rechercher dans les exercices…"]').fill('exercice')
	await p.getByRole('button', { name: 'Exercice', exact: true }).click()
	await p.waitForTimeout(300)
	await p.getByRole('button', { name: /^(page )?2$/i }).click()
	await p.waitForTimeout(500)
	log('AVANT ', JSON.stringify(await etat()))
	await p.screenshot({ path: out + '-1-liste.png' })
	const row = p.locator('[data-tour=exo-grid] .grid').filter({ hasText: 'Exercice 10' }).first()
	await row.getByRole('button', { name: 'Plus d’actions' }).click()
	await p.waitForTimeout(400)
	await p.screenshot({ path: out + '-menu.png' })
	log('MENU', JSON.stringify(await p.locator('[role=menu], [role=menuitem]').allInnerTexts()))
	await p.getByText('Imprimer', { exact: true }).last().click()
	await p.locator('.print-police').waitFor({ timeout: 15000 })
	await p.waitForTimeout(1000)
	log('PRINT ', p.url().replace(origine, ''))
	await p.screenshot({ path: out + '-2-print.png' })
	await p.getByRole('button', { name: /Retour/ }).click()
	await p.waitForTimeout(1500)
	log('RETOUR', JSON.stringify(await etat()))
	await p.screenshot({ path: out + '-3-retour.png' })
	await p.getByText('lecture', { exact: true }).last().click(); await p.waitForTimeout(500)
	log('FILTRE', JSON.stringify(await etat()))
	await p.goto(origine + '/exercises'); await p.waitForTimeout(2000)
	log('FROID ', JSON.stringify(await etat()))
}
