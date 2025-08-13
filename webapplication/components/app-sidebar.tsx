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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Home, LayoutDashboard, MapIcon, Bike } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { getLeezenboxs } from "@/actions/get-leezenboxs";
import React from "react";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: SidebarSubItem[];
}

interface SidebarSubItem {
  title: string;
  url?: string;
}

export async function AppSidebar() {
  const leezenboxen = await getLeezenboxs();
  const leezenboxItemHeader = [
    {
      title: "Overview",
      url: "/leezenboxes",
    },
    {
      title: "Separator",
    },
  ];
  const leezenboxItems = leezenboxen.map((leezenbox) => ({
    title: leezenbox.name,
    url: `/leezenboxes/${leezenbox.id}`,
  }));
  const leezenboxItemsWithHeader = [...leezenboxItemHeader, ...leezenboxItems];

  const items: SidebarItem[] = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Leezenboxes",
      url: "/leezenboxes",
      icon: Bike,
      children: leezenboxItemsWithHeader,
    },
    {
      title: "Map",
      url: "/map",
      icon: MapIcon,
    },
    // {
    //   title: "Settings",
    //   url: "/settings",
    //   icon: Settings,
    // },
  ];

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Leezencounter</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) =>
                !item.children ? (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <Collapsible
                    defaultOpen
                    className="group/collapsible"
                    key={index}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon />
                          <span>{item.title}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {item.children && (
                          <SidebarMenuSub>
                            {item.children.map((subItem, subIndex) => (
                              <SidebarMenuSubItem key={subIndex}>
                                {subItem.title === "Separator" ? (
                                  <SidebarSeparator />
                                ) : (
                                  <SidebarMenuButton asChild size="sm">
                                    <a href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </a>
                                  </SidebarMenuButton>
                                )}
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
