import { useApp } from '../../store/AppContext'

export default function Toaster() {
  const { toasts } = useApp()
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div className="toast" key={t.id}><span className="dot" />{t.msg}</div>
      ))}
    </div>
  )
}
