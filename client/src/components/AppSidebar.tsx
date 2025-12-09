import { Link, useLocation } from "wouter";
import {
  Home,
  Layout,
  Target,
  Calendar,
  Trophy,
  Sparkles,
  Plus,
  LogOut,
  Settings,
  BrainCircuit,
  Mic,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "My Boards", url: "/boards", icon: Layout },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Achievements", url: "/achievements", icon: Trophy },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const displayName =
    user?.firstName || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">VisionFlow</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <Link href="/boards/new">
              <Button
                className="w-full justify-start gap-2"
                data-testid="button-new-board"
              >
                <Plus className="h-4 w-4" />
                New Board
              </Button>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/ai-goals"}
                  data-testid="nav-ai-goals"
                >
                  <Link href="/ai-goals">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Goal Builder</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/coach"}
                  data-testid="nav-coach"
                >
                  <Link href="/coach">
                    <BrainCircuit className="h-4 w-4" />
                    <span>Weekly Coach</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/journal"}
                  data-testid="nav-journal"
                >
                  <Link href="/journal">
                    <Mic className="h-4 w-4" />
                    <span>Voice Journal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              className="object-cover"
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <a href="/api/logout" data-testid="button-logout">
            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
