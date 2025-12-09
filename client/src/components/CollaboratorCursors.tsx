import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CollaboratorInfo {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
  cursor: { x: number; y: number } | null;
}

interface CollaboratorCursorsProps {
  collaborators: CollaboratorInfo[];
  containerRef?: React.RefObject<HTMLElement>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CollaboratorCursors({
  collaborators,
  containerRef,
}: CollaboratorCursorsProps) {
  return (
    <AnimatePresence>
      {collaborators.map((collaborator) => {
        if (!collaborator.cursor) return null;

        return (
          <motion.div
            key={collaborator.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: "absolute",
              left: collaborator.cursor.x,
              top: collaborator.cursor.y,
              pointerEvents: "none",
              zIndex: 1000,
            }}
            data-testid={`cursor-${collaborator.id}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ transform: "rotate(-15deg)" }}
            >
              <path
                d="M5.5 3L19 12L12 13L8.5 21L5.5 3Z"
                fill={collaborator.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <div
              className="absolute left-4 top-4 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.name}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

interface PresenceAvatarsProps {
  collaborators: CollaboratorInfo[];
  maxVisible?: number;
}

export function PresenceAvatars({
  collaborators,
  maxVisible = 5,
}: PresenceAvatarsProps) {
  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const hiddenCount = Math.max(0, collaborators.length - maxVisible);

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center -space-x-2"
      data-testid="presence-avatars"
    >
      {visibleCollaborators.map((collaborator) => (
        <Tooltip key={collaborator.id}>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative"
              data-testid={`avatar-${collaborator.id}`}
            >
              <Avatar
                className="h-8 w-8 border-2 border-background"
                style={{ borderColor: collaborator.color }}
              >
                {collaborator.avatar ? (
                  <AvatarImage
                    src={collaborator.avatar}
                    alt={collaborator.name}
                  />
                ) : null}
                <AvatarFallback
                  style={{ backgroundColor: collaborator.color }}
                  className="text-white text-xs"
                >
                  {getInitials(collaborator.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                style={{ backgroundColor: "#22c55e" }}
              />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{collaborator.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {hiddenCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background"
              data-testid="avatar-overflow"
            >
              +{hiddenCount}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{hiddenCount} more collaborators</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

interface ConnectionStatusProps {
  connected: boolean;
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      data-testid="connection-status"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-muted-foreground">
        {connected ? "Connected" : "Reconnecting..."}
      </span>
    </div>
  );
}
