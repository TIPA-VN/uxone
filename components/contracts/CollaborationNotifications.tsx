import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationNotificationsProps {
  contractId: string;
  className?: string;
}

export const CollaborationNotifications: React.FC<CollaborationNotificationsProps> = ({
  contractId,
  className = ''
}) => {
  const { notifications, markAsRead } = useNotifications();

  // Filter collaboration-related notifications for this contract
  const collaborationNotifications = notifications.filter(notification => 
    (notification.type === 'collaboration' || 
     notification.type === 'document_change' || 
     notification.type === 'comment') &&
    notification.link?.includes(contractId)
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'collaboration':
        return '👥';
      case 'document_change':
        return '📝';
      case 'comment':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'collaboration':
        return 'bg-blue-100 text-blue-800';
      case 'document_change':
        return 'bg-green-100 text-green-800';
      case 'comment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (collaborationNotifications.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Collaboration Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No recent collaboration activity
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Collaboration Activity</span>
          <Badge variant="secondary" className="text-xs">
            {collaborationNotifications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {collaborationNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors ${
                  notification.read ? 'bg-muted/30' : 'bg-muted/50'
                } hover:bg-muted/70 cursor-pointer`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  // You could also navigate to the notification link here
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-lg">{getNotificationIcon(notification.type || '')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getNotificationColor(notification.type || '')}`}>
                        {notification.type?.replace('_', ' ').toUpperCase()}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-sm font-medium mb-1">{notification.title}</div>
                    <div className="text-sm text-muted-foreground mb-2">{notification.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
