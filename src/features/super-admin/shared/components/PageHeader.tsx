import React from "react";
import { PageHeaderProps } from "../../types";


export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="sticky md:top-14 xl:top-0 z-40 bg-white border-b border-slate-200 px-5 sm:px-6 xl:px-8 py-5 w-full">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#030677] to-[#2563eb] bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-sm font-medium bg-gradient-to-r from-[#2563eb] to-[#93c5fd] bg-clip-text text-transparent">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
