import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { Clock, User, Calendar } from 'lucide-react';

export interface AuditInfoProps {
  lastUpdated: Date | string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedById?: string | null;
  createdAt?: Date | string | null;
  createdBy?: string | null;
  createdById?: string | null;
  showCreatedInfo?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export const AuditInfo: React.FC<AuditInfoProps> = ({
  lastUpdated,
  lastUpdatedBy,
  lastUpdatedById,
  createdAt,
  createdBy,
  createdById,
  showCreatedInfo = false,
  className = '',
  variant = 'default'
}) => {
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  const formatFullDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Clock className="h-3 w-3" />
        <span>Updated {formatDate(lastUpdated)}</span>
        {lastUpdatedBy && (
          <>
            <span>by</span>
            <Badge variant="secondary" className="text-xs">
              {lastUpdatedBy}
            </Badge>
          </>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Audit Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Updated:</span>
                </div>
                <div className="ml-6 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {formatFullDate(lastUpdated)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(lastUpdated)}
                  </p>
                </div>
              </div>

              {lastUpdatedBy && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Updated By:</span>
                  </div>
                  <div className="ml-6">
                    <Badge variant="secondary" className="text-sm">
                      {lastUpdatedBy}
                    </Badge>
                    {lastUpdatedById && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {lastUpdatedById}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {showCreatedInfo && (createdAt || createdBy) && (
              <div className="pt-3 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {createdAt && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Created:</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {formatFullDate(createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {createdBy && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Created By:</span>
                      </div>
                      <div className="ml-6">
                        <Badge variant="outline" className="text-sm">
                          {createdBy}
                        </Badge>
                        {createdById && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {createdById}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Last updated {formatDate(lastUpdated)}</span>
      </div>
      
      {lastUpdatedBy && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>by</span>
          <Badge variant="secondary" className="text-xs">
            {lastUpdatedBy}
          </Badge>
        </div>
      )}

      {showCreatedInfo && (createdAt || createdBy) && (
        <div className="pt-2 border-t">
          {createdAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(createdAt)}</span>
            </div>
          )}
          
          {createdBy && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>by</span>
              <Badge variant="outline" className="text-xs">
                {createdBy}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
