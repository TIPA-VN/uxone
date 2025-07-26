import React, { useState } from "react";
import { Calendar, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface GanttChartProps {
  requestDate?: string;
  departmentDueDates: Record<string, string>;
  approvalState: Record<string, any>;
  projectStartDate?: string; // Add project start date
}

interface GanttItem {
  department: string;
  dueDate: string;
  daysUntil: number;
  status: 'overdue' | 'upcoming' | 'on-time' | 'completed';
  isCompleted: boolean;
  duration: number; // Duration from project start to due date
  startOffset: number; // Days from project start
}

function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getLatestStatus(logs: any): string {
  if (Array.isArray(logs) && logs.length > 0) return logs[logs.length - 1].status;
  return logs;
}

function getTimelineUnit(totalDays: number): { unit: string; step: number; format: (date: Date, startDate?: Date) => string } {
  if (totalDays <= 7) {
    return { 
      unit: 'days', 
      step: 1, 
      format: (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
    };
  } else if (totalDays <= 31) {
    return { 
      unit: 'weeks', 
      step: 7, 
      format: (date: Date) => {
        // Get ISO week number of the year
        const getWeekNumber = (date: Date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };
        return `Week ${getWeekNumber(date)}`;
      }
    };
  } else if (totalDays <= 365) {
    return { 
      unit: 'months', 
      step: 30, 
      format: (date: Date) => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    };
  } else {
    return { 
      unit: 'years', 
      step: 365, 
      format: (date: Date) => date.getFullYear().toString() 
    };
  }
}

export const GanttChart: React.FC<GanttChartProps> = ({ 
  requestDate, 
  departmentDueDates, 
  approvalState,
  projectStartDate 
}) => {
  const [hoveredItem, setHoveredItem] = useState<GanttItem | null>(null);

  // Use project start date or default to 30 days ago if not provided
  const startDate = projectStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Calculate timeline bounds
  const allDates = [requestDate, ...Object.values(departmentDueDates)].filter(Boolean) as string[];
  const endDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : new Date();
  const totalDuration = getDaysBetween(startDate, endDate.toISOString().split('T')[0]);

  // Get timeline unit based on duration
  const timelineUnit = getTimelineUnit(totalDuration);

  // Process data for Gantt chart
  const ganttItems: GanttItem[] = [];
  
  // Add overall request date if exists
  if (requestDate) {
    const daysUntil = getDaysUntil(requestDate);
    const duration = getDaysBetween(startDate, requestDate);
    const status = daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'upcoming' : 'on-time';
    ganttItems.push({
      department: 'Overall Project',
      dueDate: requestDate,
      daysUntil,
      status,
      isCompleted: false,
      duration,
      startOffset: 0
    });
  }

  // Add department due dates
  Object.entries(departmentDueDates).forEach(([dept, date]) => {
    const daysUntil = getDaysUntil(date);
    const approvalStatus = getLatestStatus(approvalState[dept]);
    const isCompleted = approvalStatus === "APPROVED";
    const duration = getDaysBetween(startDate, date);
    
    let status: GanttItem['status'];
    if (isCompleted) {
      status = 'completed';
    } else if (daysUntil < 0) {
      status = 'overdue';
    } else if (daysUntil <= 7) {
      status = 'upcoming';
    } else {
      status = 'on-time';
    }

    ganttItems.push({
      department: dept.charAt(0).toUpperCase() + dept.slice(1),
      dueDate: date,
      daysUntil,
      status,
      isCompleted,
      duration,
      startOffset: 0
    });
  });

  // Sort by due date (earliest first)
  ganttItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getStatusColor = (status: GanttItem['status']) => {
    switch (status) {
      case 'overdue': return 'bg-red-500';
      case 'upcoming': return 'bg-orange-500';
      case 'on-time': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (item: GanttItem) => {
    if (item.isCompleted) return 'Completed';
    if (item.daysUntil < 0) return `${Math.abs(item.daysUntil)} days overdue`;
    if (item.daysUntil === 0) return 'Due today';
    if (item.daysUntil <= 7) return `${item.daysUntil} days left`;
    return `${item.daysUntil} days left`;
  };

  // Generate timeline markers based on unit
  const generateTimelineMarkers = () => {
    const markers = [];
    const maxMarkers = 10;
    const step = Math.max(1, Math.floor(totalDuration / maxMarkers));
    
    for (let i = 0; i <= totalDuration; i += step) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      markers.push({
        day: i,
        date: timelineUnit.format(date),
        percentage: (i / totalDuration) * 100
      });
    }
    return markers;
  };

  const timelineMarkers = generateTimelineMarkers();

  if (ganttItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Project Timeline
        </h3>
        <div className="text-gray-500 text-center py-8">
          No due dates set for this project
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Project Timeline ({timelineUnit.unit})
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded"></div>
          <span>On Time</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-500 rounded"></div>
          <span>Upcoming (≤7 days)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded"></div>
          <span>Overdue</span>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="mb-1 text-xs text-gray-500 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
        Scroll horizontally to view full timeline
      </div>

      {/* Timeline Container with Scroll */}
      <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
        {/* Timeline Axis */}
        <div className="relative mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="min-w-[800px] h-6 bg-gray-100 rounded-lg relative">
            {timelineMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                style={{ left: `${marker.percentage}%` }}
              >
                <div className="w-px h-3 bg-gray-400"></div>
                <div className="text-[10px] text-gray-600 mt-0.5 whitespace-nowrap">{marker.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="space-y-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="min-w-[800px]">
            {ganttItems.map((item, index) => {
              const barWidth = (item.duration / totalDuration) * 100;
              const barLeft = 0; // All bars start from project start
              
              return (
                <div key={index} className="relative mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-24 text-xs font-medium text-gray-700 truncate flex-shrink-0">
                      {item.department}
                    </div>
                    <div className="flex-1 relative min-w-0">
                      <div className="h-6 bg-gray-200 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full ${getStatusColor(item.status)} transition-all duration-300 relative group`}
                          style={{ 
                            width: `${barWidth}%`,
                            left: `${barLeft}%`,
                            minWidth: '40px'
                          }}
                          onMouseEnter={() => setHoveredItem(item)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-xs px-1">
                            <span className="truncate">{item.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-[10px] text-gray-600 text-right flex-shrink-0">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                    <div className="w-14 text-[10px] font-medium text-right flex-shrink-0">
                      {getStatusText(item)}
                    </div>
                  </div>

                  {/* Tooltip */}
                  {hoveredItem === item && (
                    <div className="absolute left-0 top-8 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 z-10 shadow-lg">
                      <div className="font-medium mb-1">{item.department}</div>
                      <div>Start: {new Date(startDate).toLocaleDateString()}</div>
                      <div>Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                      <div>Duration: {item.duration} days</div>
                      <div>{getStatusText(item)}</div>
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-bold text-green-600">
              {ganttItems.filter(item => item.status === 'completed').length}
            </div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div>
            <div className="font-bold text-blue-600">
              {ganttItems.filter(item => item.status === 'on-time').length}
            </div>
            <div className="text-gray-500">On Time</div>
          </div>
          <div>
            <div className="font-bold text-orange-600">
              {ganttItems.filter(item => item.status === 'upcoming').length}
            </div>
            <div className="text-gray-500">Upcoming</div>
          </div>
          <div>
            <div className="font-bold text-red-600">
              {ganttItems.filter(item => item.status === 'overdue').length}
            </div>
            <div className="text-gray-500">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 