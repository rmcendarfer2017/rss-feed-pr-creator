'use client'

interface DateFilterProps {
  selectedFilter: string
  onFilterChange: (filter: string) => void
  articleCount: number
}

export default function DateFilter({ selectedFilter, onFilterChange, articleCount }: DateFilterProps) {
  const filters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
  ]

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-slate-600 mb-2">
        Filter by Date ({articleCount} articles)
      </label>
      <select
        value={selectedFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {filters.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
    </div>
  )
}
