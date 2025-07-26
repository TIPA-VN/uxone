import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// Types
type User = {
  id: string;
  name: string | null;
  email: string | null;
  username: string;
  department: string | null;
  departmentName: string | null;
  role: string | null;
}

type UserOption = {
  value: string;
  label: string;
  username: string;
  department: string;
}

type AnnouncementFormData = {
  title: string;
  message: string;
  link?: string;
  broadcast: boolean;
  departments?: string[];
  users?: string[];
}

interface AnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  canAnnounce: boolean;
}

const DEPARTMENTS = [
  { value: "logistics", label: "Logistics" },
  { value: "procurement", label: "Procurement" },
  { value: "pc", label: "Production Planning" },
  { value: "qa", label: "Quality Assurance" },
  { value: "qc", label: "Quality Control" },
  { value: "pm", label: "Production Maintenance" },
  { value: "fm", label: "Facility Management" },
  { value: "hra", label: "Human Resources" },
  { value: "cs", label: "Customer Service" },
  { value: "sales", label: "Sales" },
  { value: "LVM-EXPAT", label: "LVM EXPATS" },
];

export function AnnouncementDialog({ open, onClose, canAnnounce }: AnnouncementDialogProps) {
  const [announceTarget, setAnnounceTarget] = useState<"broadcast" | "departments" | "users">("broadcast");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [announceStatus, setAnnounceStatus] = useState<string | null>(null);
  const [announceConfirm, setAnnounceConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { isSubmitting, errors }
  } = useForm<AnnouncementFormData>({
    defaultValues: {
      broadcast: true,
      departments: [],
      users: []
    }
  });

  // Fetch users when target is "users"
  useEffect(() => {
    if (announceTarget === "users") {
      fetch("/api/notifications/users")
        .then(res => res.json())
        .then((users: User[]) => {
          if (!Array.isArray(users)) {
            console.error("Expected array from /api/notifications/users, got:", users);
            setUserOptions([]);
            return;
          }
          const mappedUsers: UserOption[] = users.map((user: User): UserOption => ({
            value: user.id,
            label: `${user.username} (${user.department || "-"})`,
            username: user.username,
            department: user.department || "-"
          }));
          setUserOptions(mappedUsers);
        })
        .catch(error => {
          console.error("Error fetching users:", error);
          setUserOptions([]);
        });
    }
  }, [announceTarget]);

  // Filtered user options for search
  const filteredUserOptions = userOptions.filter((user: UserOption) => {
    const search = userSearch.toLowerCase();
    return (
      user.username.toLowerCase().includes(search) ||
      user.department.toLowerCase().includes(search)
    );
  });

  // Sync selectedUsers with form value
  useEffect(() => {
    if (announceTarget === "users") {
      const formUsers = getValues("users") || [];
      setSelectedUsers(formUsers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announceTarget, open]);

  const onAnnounce = async (data: AnnouncementFormData) => {
    setAnnounceStatus(null);
    setAnnounceConfirm(false);
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          broadcast: !!data.broadcast,
          type: "announcement",
        }),
      });
      
      if (res.ok) {
        setAnnounceStatus("✅ Announcement sent successfully!");
        reset();
        setTimeout(() => {
          onClose();
          setAnnounceStatus(null);
        }, 1500);
      } else {
        setAnnounceStatus("❌ Failed to send announcement.");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      setAnnounceStatus("❌ Failed to send announcement.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAnnounceStatus(null);
    setAnnounceConfirm(false);
    reset();
    onClose();
  };

  if (!canAnnounce) return null;

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <h2 className="text-lg font-bold">Send Announcement</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(() => setAnnounceConfirm(true))} className="p-4 space-y-3">
          {/* Target Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Target Audience
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="announceTarget"
                  value="broadcast"
                  checked={announceTarget === "broadcast"}
                  onChange={() => { setAnnounceTarget("broadcast"); setValue("broadcast", true); }}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">📢 Broadcast to All</div>
                  <div className="text-xs text-gray-500">Send to all users in the system</div>
                </div>
              </label>
              
              <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="announceTarget"
                  value="departments"
                  checked={announceTarget === "departments"}
                  onChange={() => { setAnnounceTarget("departments"); setValue("broadcast", false); }}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">🏢 Selected Departments</div>
                  <div className="text-xs text-gray-500">Choose specific departments</div>
                </div>
              </label>
              
              <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="announceTarget"
                  value="users"
                  checked={announceTarget === "users"}
                  onChange={() => { setAnnounceTarget("users"); setValue("broadcast", false); }}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">👥 Individual Users</div>
                  <div className="text-xs text-gray-500">Select specific users</div>
                </div>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Title *
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="Enter announcement title..."
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Message *
            </label>
            <textarea
              {...register("message", { required: "Message is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
              rows={3}
              placeholder="Enter announcement message..."
            />
            {errors.message && (
              <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Link (Optional)
            </label>
            <input
              {...register("link")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="https://example.com"
            />
          </div>

          {/* Departments Selection */}
          {announceTarget === "departments" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Select Departments *
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {DEPARTMENTS.map((dept) => (
                  <label key={dept.value} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      value={dept.value}
                      {...register("departments", { 
                        required: announceTarget === "departments" ? "Please select at least one department" : false 
                      })}
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-xs text-gray-700">{dept.label}</span>
                  </label>
                ))}
              </div>
              {errors.departments && (
                <p className="text-xs text-red-600 mt-1">{errors.departments.message}</p>
              )}
            </div>
          )}

          {/* Users Selection */}
          {announceTarget === "users" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Select Users *
              </label>
              {/* Search input */}
              <input
                type="text"
                placeholder="Search by username or department..."
                className="w-full px-2 py-1 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={userSearch || ''}
                onChange={e => setUserSearch(e.target.value)}
              />
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 bg-white">
                {filteredUserOptions.length === 0 ? (
                  <div className="text-xs text-gray-400 p-3 text-center">No users found</div>
                ) : (
                  filteredUserOptions.map((user) => (
                    <label key={user.value} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={user.value}
                        checked={selectedUsers.includes(user.value)}
                        onChange={e => {
                          const checked = e.target.checked;
                          let newSelected: string[];
                          if (checked) {
                            newSelected = [...selectedUsers, user.value];
                          } else {
                            newSelected = selectedUsers.filter(id => id !== user.value);
                          }
                          setSelectedUsers(newSelected);
                          setValue('users', newSelected, { shouldValidate: true });
                        }}
                        className="accent-purple-600"
                      />
                      <span className="text-xs text-gray-800 font-mono">{user.username}</span>
                      <span className="text-xs text-gray-500">({user.department || '-'})</span>
                    </label>
                  ))
                )}
              </div>
              {errors.users && (
                <p className="text-xs text-red-600 mt-1">{errors.users.message}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting || isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Announcement
              </>
            )}
          </button>

          {/* Status Message */}
          {announceStatus && (
            <div className={`text-center text-sm p-2 rounded-lg ${
              announceStatus.includes("✅") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {announceStatus}
            </div>
          )}
        </form>

        {/* Confirmation Dialog */}
        {announceConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirm Send</h3>
                  <p className="text-sm text-gray-600">Are you sure you want to send this announcement?</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">Preview:</div>
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">{getValues("title")}</div>
                    <div className="mt-1">{getValues("message")}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setAnnounceConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  onClick={async () => {
                    setAnnounceConfirm(false);
                    await onAnnounce(getValues());
                  }}
                >
                  Confirm Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 