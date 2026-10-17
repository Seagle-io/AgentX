import { type ReactNode, useEffect, useRef } from "react"

type ModalProps = {
	open: boolean
	onClose: () => void
	title: string
	children: ReactNode
}

// `<dialog>` natif : Échap, piège du focus et couche supérieure viennent du
// navigateur. `onClose` suit l'événement `close`, donc aussi l'Échap natif.
const Modal = ({ open, onClose, title, children }: ModalProps) => {
	const ref = useRef<HTMLDialogElement>(null)
	const titre = useRef<HTMLHeadingElement>(null)

	useEffect(() => {
		const d = ref.current
		if (!d) return
		if (open && !d.open) {
			d.showModal()
			titre.current?.focus()
		}
		if (!open && d.open) d.close()
	}, [open])

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: l'équivalent clavier du clic sur le fond est l'Échap natif du dialog
		<dialog
			ref={ref}
			aria-labelledby="modal-titre"
			onClose={onClose}
			// le fond (::backdrop) fait partie de la cible du dialog : un clic
			// dont la cible est le dialog lui-même tombe hors du contenu
			onClick={(e) => e.target === ref.current && onClose()}
			className="m-auto w-full max-w-3xl rounded-control border border-border-subtle bg-surface p-0 text-text backdrop:bg-black/50"
		>
			<div className="flex flex-col gap-3 p-4">
				<h2
					id="modal-titre"
					ref={titre}
					tabIndex={-1}
					className="text-lg font-semibold outline-none"
				>
					{title}
				</h2>
				<div className="max-h-[70vh] overflow-y-auto">{children}</div>
			</div>
		</dialog>
	)
}

export default Modal
