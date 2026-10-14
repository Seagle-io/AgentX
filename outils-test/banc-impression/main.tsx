import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Page from 'banc:page'
import { codes } from 'banc:registre'
import projet from 'banc:projet'
import 'banc:css'

// ?list → codes lus du registre (adaptateur du projet) ; ?code=X → vraie route du projet (entree, {code} = X)
const params = new URLSearchParams(location.search)
const w = window as unknown as Record<string, unknown>
w.__codes = codes
const code = params.get('code')
if (code) createRoot(document.getElementById('root')!).render(
	<MemoryRouter initialEntries={[projet.entree.replace('{code}', code)]}>
		<Routes><Route path={projet.route} Component={Page} /></Routes>
	</MemoryRouter>,
)
