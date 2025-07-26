import React, { useState } from "react";
import { Calendar, Save, X } from "lucide-react";

interface DueDateEditorProps {
  project: any;
  departments: string[];
  onSave: (requestDate: string, departmentDueDates: Record<string, string>) => void;
  onCancel: () => void;
}

export const DueDateEditor: React.FC<DueDateEditorProps> = ({ project, departments, onSave, onCancel }) => {
  const [requestDate, setRequestDate] = useState(project.requestDate ? new Date(project.requestDate).toISOString().split('T')[0] : '');
  const [departmentDueDates, setDepartmentDueDates] = useState<Record<string, string>>(
    project.departmentDueDates || {}
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(requestDate, departmentDueDates);
    } finally {
      setSaving(false);
    }
  };

  const updateDepartmentDueDate = (dept: string, date: string) => {
    setDepartmentDueDates(prev => ({
      ...prev,
      [dept]: date
    }));
  };

  const removeDepartmentDueDate = (dept: string) => {
    const newDates = { ...departmentDueDates };
    delete newDates[dept];
    setDepartmentDueDates(newDates);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Set Due Dates
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Overall Request Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Request Date
          </label>
          <input
            type="date"
            value={requestDate}
            onChange={(e) => setRequestDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Set the overall deadline for this project
          </p>
        </div>

        {/* Department Due Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Department Due Dates
          </label>
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 min-w-[120px]">
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}:
                </span>
                <input
                  type="date"
                  value={departmentDueDates[dept] || ''}
                  onChange={(e) => updateDepartmentDueDate(dept, e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {departmentDueDates[dept] && (
                  <button
                    onClick={() => removeDepartmentDueDate(dept)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"
                    title="Remove due date"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Set individual deadlines for each department (optional)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Due Dates'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}; 