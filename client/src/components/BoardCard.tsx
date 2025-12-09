import { motion } from "framer-motion";
import { Eye, Heart, Lock, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { VisionBoard, User } from "@shared/schema";

interface BoardCardProps {
  board: VisionBoard & { owner?: User };
  onClick?: () => void;
}

export function BoardCard({ board, onClick }: BoardCardProps) {
  const ownerName = board.owner?.firstName || board.owner?.email?.split("@")[0] || "User";
  const initials = ownerName.slice(0, 2).toUpperCase();

  return (
    <motion.div
      className="group cursor-pointer overflow-hidden rounded-xl bg-card border border-card-border"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      data-testid={`card-board-${board.id}`}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {board.coverAssetUrl ? (
          <img
            src={board.coverAssetUrl}
            alt={board.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary/30">
              {board.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
            {board.visibility === "private" ? (
              <Lock className="h-3 w-3 mr-1" />
            ) : (
              <Globe className="h-3 w-3 mr-1" />
            )}
            {board.visibility}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base line-clamp-1 mb-1">{board.title}</h3>
        {board.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {board.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={board.owner?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{ownerName}</span>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1 text-sm">
              <Eye className="h-3.5 w-3.5" />
              <span>{board.viewCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Heart className="h-3.5 w-3.5" />
              <span>{board.likeCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
