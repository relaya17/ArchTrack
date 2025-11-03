/**
 * Collaboration Indicator Component
 * Construction Master App - Real-time Collaboration UI
 */

import React, { useState, useEffect } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Circle, 
  MessageSquare, 
  Eye, 
  Edit3, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CollaborationIndicatorProps {
  projectId: string;
  className?: string;
}

export const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({
  projectId,
  className = '',
}) => {
  const {
    isConnected,
    participants,
    joinProject,
    leaveProject,
    isCollaborating,
    getCurrentUserParticipant,
    getOtherParticipants,
  } = useCollaboration({
    onUserJoined: (participant) => {
      console.log('User joined:', participant.name);
    },
    onUserLeft: (participant) => {
      console.log('User left:', participant.name);
    },
    onError: (error) => {
      console.error('Collaboration error:', error);
    },
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Auto-join project when component mounts
  useEffect(() => {
    if (projectId && isConnected && !isJoined) {
      joinProject(projectId);
      setIsJoined(true);
    }

    return () => {
      if (isJoined) {
        leaveProject();
        setIsJoined(false);
      }
    };
  }, [projectId, isConnected, isJoined, joinProject, leaveProject]);

  const currentUser = getCurrentUserParticipant();
  const otherParticipants = getOtherParticipants();
  const totalParticipants = participants.length;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'manager':
        return '👨‍💼';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'manager':
        return 'bg-blue-500';
      case 'editor':
        return 'bg-green-500';
      case 'viewer':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { text: 'מתחבר...', color: 'bg-gray-400' };
    if (!isCollaborating()) return { text: 'לא פעיל', color: 'bg-gray-400' };
    return { text: 'פעיל', color: 'bg-green-500' };
  };

  const status = getConnectionStatus();

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Circle className="h-3 w-3 text-gray-400" />
        <span className="text-sm text-gray-500">מתחבר...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Collapsed State */}
      {!isExpanded && (
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            <Circle className={`h-3 w-3 ${status.color} rounded-full`} />
            <span className="text-sm text-gray-600">{status.text}</span>
          </div>

          {/* Participants Count */}
          {totalParticipants > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalParticipants}
            </Badge>
          )}

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-8 px-2"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <Card className="absolute top-0 right-0 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                שיתוף פעולה
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              <Circle className={`h-3 w-3 ${status.color} rounded-full`} />
              <span className="text-sm text-gray-600">{status.text}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Current User */}
            {currentUser && (
              <div className="px-4 py-2 border-b bg-blue-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{currentUser.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getRoleIcon(currentUser.role)} {currentUser.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">אתה</p>
                  </div>
                  <Circle className="h-3 w-3 text-green-500" />
                </div>
              </div>
            )}

            {/* Other Participants */}
            <ScrollArea className="max-h-60">
              <div className="p-4 space-y-3">
                {otherParticipants.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">אין משתמשים אחרים פעילים</p>
                  </div>
                ) : (
                  otherParticipants.map((participant) => (
                    <div key={participant.userId} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${getRoleColor(participant.role)} text-white text-sm`}>
                            {participant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Circle className="h-3 w-3 bg-green-500 rounded-full absolute -bottom-1 -right-1" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{participant.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getRoleIcon(participant.role)} {participant.role}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {participant.isTyping && (
                            <Badge variant="secondary" className="text-xs">
                              <Edit3 className="h-3 w-3 mr-1" />
                              כותב...
                            </Badge>
                          )}
                          
                          {participant.cursorPosition && (
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              פעיל
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (isJoined) {
                      leaveProject();
                      setIsJoined(false);
                    } else {
                      joinProject(projectId);
                      setIsJoined(true);
                    }
                  }}
                >
                  {isJoined ? 'עזוב פרויקט' : 'הצטרף לפרויקט'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="px-3"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

