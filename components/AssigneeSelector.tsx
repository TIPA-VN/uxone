"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, User } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

interface User {
  id: string;
  name?: string;
  username: string;
  department?: string;
  role?: string;
  isActive?: boolean;
}

interface AssigneeSelectorProps {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AssigneeSelector({
  users,
  value,
  onChange,
  placeholder = "Select assignee",
  className = "",
  disabled = false
}: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const dropdownRef = useClickOutside<HTMLDivElement>(isOpen, () => setIsOpen(false));

  // Get unique departments from users
  const departments = Array.from(
    new Set(users.map(user => user.department).filter(Boolean))
  ).sort();

  // Filter users based on department and search term
  useEffect(() => {
    let filtered = users.filter(user => {
      // Filter by department if selected
      if (selectedDepartment && user.department !== selectedDepartment) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const usernameMatch = user.username.toLowerCase().includes(searchLower);
        return nameMatch || usernameMatch;
      }
      
      return true;
    });

    // Sort alphabetically by name (fallback to username)
    filtered.sort((a, b) => {
      const nameA = (a.name || a.username).toLowerCase();
      const nameB = (b.name || b.username).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredUsers(filtered);
  }, [users, selectedDepartment, searchTerm]);

  // Get selected user
  const selectedUser = users.find(user => user.id === value);

  const handleUserSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setSearchTerm(""); // Clear search when changing department
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className={selectedUser ? "text-gray-900" : "text-gray-500"}>
            {selectedUser 
              ? `${selectedUser.name || selectedUser.username} (${selectedUser.department || 'No Dept'})`
              : placeholder
            }
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Department Filter */}
          <div className="p-3 border-b border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Filter by Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 text-center">
                {searchTerm ? 'No users found matching your search' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-purple-50 focus:bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-500 flex items-center space-x-2 ${
                    value === user.id ? 'bg-purple-100 text-purple-900' : 'text-gray-900'
                  }`}
                >
                  <User className="w-3 h-3 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user.name || user.username}
                    </div>
                    <div className="text-gray-500 truncate">
                      {user.department || 'No Department'} • {user.role || 'No Role'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Clear Selection */}
          {value && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => handleUserSelect("")}
                className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
