import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CollaborationUser, DocumentChange } from '@/hooks/useCollaboration';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationPanelProps {
  users: CollaborationUser[];
  recentChanges: DocumentChange[];
  isConnected: boolean;
  lastActivity: Date | null;
  onUserClick?: (user: CollaborationUser) => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  users,
  recentChanges,
  isConnected,
  lastActivity,
  onUserClick
}) => {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'insert':
        return '➕';
      case 'delete':
        return '➖';
      case 'format':
        return '🎨';
      case 'comment':
        return '💬';
      case 'cursor':
        return '👆';
      default:
        return '📝';
    }
  };

  const getChangeDescription = (change: DocumentChange) => {
    switch (change.changeType) {
      case 'insert':
        return `added text`;
      case 'delete':
        return `deleted text`;
      case 'format':
        return `formatted text`;
      case 'comment':
        return `added a comment`;
      case 'cursor':
        return `moved cursor`;
      default:
        return `made changes`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            Collaboration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            {isConnected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-red-600">Disconnected</span>
            )}
            {lastActivity && (
              <div className="mt-1 text-xs">
                Last activity: {formatDistanceToNow(lastActivity, { addSuffix: true })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Active Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {users.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No active users
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onUserClick?.(user)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback 
                      className="text-xs"
                      style={{ backgroundColor: user.color, color: 'white' }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.department}
                    </div>
                  </div>
                  {user.cursor && (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <span className="text-xs text-muted-foreground">Editing</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Recent Changes ({recentChanges.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentChanges.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent changes
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {recentChanges.slice().reverse().map((change) => (
                  <div key={change.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <div className="text-lg">{getChangeIcon(change.changeType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">{change.userName}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {getChangeDescription(change)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(change.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
