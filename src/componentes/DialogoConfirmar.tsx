import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  aberto: boolean
  titulo: string
  children: ReactNode
  rotuloConfirmar: string
  ocupado?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

// Diálogo de confirmação da própria interface (no lugar do window.confirm).
// Usa o elemento <dialog> do navegador, que já cuida de prender o foco
// dentro dele e de fechar com a tecla Esc.
export default function DialogoConfirmar(props: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  // Abre ou fecha o <dialog> quando a propriedade "aberto" muda
  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (props.aberto && !dialogo.open) dialogo.showModal()
    if (!props.aberto && dialogo.open) dialogo.close()
  }, [props.aberto])

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="dlg-titulo"
      onCancel={(e) => {
        e.preventDefault() // quem fecha é o aoCancelar, para o estado ficar certo
        props.aoCancelar()
      }}
    >
      <h2 id="dlg-titulo">{props.titulo}</h2>
      <div className="dlg-texto">{props.children}</div>
      <div className="acts" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn ghost sm" onClick={props.aoCancelar} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn danger sm" onClick={props.aoConfirmar} disabled={props.ocupado}>
          {props.ocupado ? 'Removendo…' : props.rotuloConfirmar}
        </button>
      </div>
    </dialog>
  )
}
