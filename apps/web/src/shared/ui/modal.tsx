import { type ReactNode, useEffect, useRef } from "react"
import Button from "@/shared/ui/button"

type ModalProps = {
	open: boolean
	onClose: () => void
	title: string
	children: ReactNode
	closeLabel?: string
	size?: "md" | "lg"
}

// `lg` : fenêtre de lecture (documents, tableaux larges)
const tailles = {
	md: { dialog: "max-w-3xl", corps: "max-h-[70vh]" },
	lg: {
		// `open:` : un `flex` nu écraserait le `display: none` du dialog fermé
		dialog: "open:flex open:flex-col max-h-[calc(100%-2rem)] max-w-[90rem]",
		corps: "flex-1 min-h-0",
	},
}

// `<dialog>` natif : Échap, piège du focus et couche supérieure viennent du
// navigateur. `onClose` suit l'événement `close`, donc aussi l'Échap natif.
const Modal = ({
	open,
	onClose,
	title,
	children,
	closeLabel = "Fermer",
	size = "md",
}: ModalProps) => {
	const ref = useRef<HTMLDialogElement>(null)
	const titre = useRef<HTMLHeadingElement>(null)

	useEffect(() => {
		const d = ref.current
		if (!d) return
		if (open && !d.open) {
			d.showModal()
			// showModal focalise le h2 : enfant data-autofocus explicite
			const auto = d.querySelector<HTMLElement>("[data-autofocus]")
			;(auto ?? titre.current)?.focus()
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
			className={`m-auto w-[calc(100%-2rem)] ${tailles[size].dialog} rounded-control border border-border-subtle bg-surface p-0 text-text backdrop:bg-black/50`}
		>
			<div
				className={`flex flex-col gap-3 p-4 ${size === "lg" ? "min-h-0 flex-1" : ""}`}
			>
				<div className="flex shrink-0 items-start justify-between gap-2">
					<h2
						id="modal-titre"
						ref={titre}
						tabIndex={-1}
						className="text-lg font-semibold outline-none"
					>
						{title}
					</h2>
					<Button
						size="sm"
						variant="ghost"
						aria-label={closeLabel}
						onClick={onClose}
					>
						{closeLabel}
					</Button>
				</div>
				<div className={`${tailles[size].corps} overflow-y-auto`}>
					{children}
				</div>
			</div>
		</dialog>
	)
}

export default Modal
