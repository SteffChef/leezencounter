"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const pathname = usePathname();

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === `/`,
    },
    {
      href: "/participants",
      label: "Participants",
      active: pathname === `/participants`,
    },
  ];

  // const categories = await getCategories();
  return (
    <div className="border-b">
      <div className="mx-auto max-w-7xl">
        <div className="relative px-4 sm:px-6 lg-px-8 flex h-16 items-center">
          <Link href="/" className="flex gap-x-2">
            <p className="font-bold text-xl">Logo</p>
          </Link>
          <nav className="mx-6 sm:flex items-center space-x-4 lg:space-x-6 hidden">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-black",
                  route.active ? "text-black" : "text-neutral-500"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
