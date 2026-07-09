import React, { useState } from 'react';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface FilterState {
  blood_group: string;
  city: string;
  district: string;
  availability: string;
}

interface DonorSearchFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

const DonorSearchFilter: React.FC<DonorSearchFilterProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    blood_group: '',
    city: '',
    district: '',
    availability: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-subtle border border-border p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
      <div className="flex flex-col">
        <label htmlFor="blood_group" className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
          Blood Group
        </label>
        <select
          id="blood_group"
          name="blood_group"
          value={filters.blood_group}
          onChange={handleChange}
          className="p-3 bg-backgroundLight border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textPrimary font-medium transition-all"
        >
          <option value="">All Blood Groups</option>
          {bloodGroups.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="city" className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
          City
        </label>
        <input
          id="city"
          name="city"
          type="text"
          placeholder="e.g. New York"
          value={filters.city}
          onChange={handleChange}
          className="p-3 bg-backgroundLight border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textPrimary placeholder-slate-400 font-medium transition-all"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="district" className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
          District
        </label>
        <input
          id="district"
          name="district"
          type="text"
          placeholder="e.g. Manhattan"
          value={filters.district}
          onChange={handleChange}
          className="p-3 bg-backgroundLight border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textPrimary placeholder-slate-400 font-medium transition-all"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="availability" className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
          Availability
        </label>
        <select
          id="availability"
          name="availability"
          value={filters.availability}
          onChange={handleChange}
          className="p-3 bg-backgroundLight border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-textPrimary font-medium transition-all"
        >
          <option value="">All Availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>
    </div>
  );
};

export default DonorSearchFilter;
