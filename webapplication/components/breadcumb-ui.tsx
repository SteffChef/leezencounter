"use client";

import { House } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { usePathname } from "next/navigation";
import React from "react";

const BreadcrumbUI: React.FC = () => {
  const path = usePathname();

  const pathParts = path.split("/");
  // Remove empty parts and the leading slash
  const filteredPathParts = pathParts.filter((part) => part !== "");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1">
            <House size={15} />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {filteredPathParts.map((pathPart, index) => {
          return (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index < filteredPathParts.length - 1 ? (
                  <BreadcrumbLink
                    href={`/${filteredPathParts.slice(0, index + 1).join("/")}`}
                    className="capitalize"
                  >
                    {pathPart}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="capitalize">
                    {pathPart}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbUI;
