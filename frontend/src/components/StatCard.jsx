// components/StatCard.jsx — Dashboard stat card

export default function StatCard({ icon, label, value, color = 'primary', sublabel }) {
  const colorMap = {
    primary:   'bg-primary-50  text-primary-600  border-primary-100',
    success:   'bg-secondary-50 text-secondary-600 border-secondary-100',
    warning:   'bg-accent-50   text-accent-600   border-accent-100',
    danger:    'bg-danger-50   text-danger-600   border-danger-100',
  }
  const iconBg = colorMap[color] || colorMap.primary

  return (
    <div className="card flex items-center gap-4 animate-fade-in">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
