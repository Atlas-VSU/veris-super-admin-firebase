import NotFoundPageLayout from "@/features/system/NotFoundPageLayout";

// App Router's special not-found boundary: rendered for unmatched routes and
// any `notFound()` call. Must live at app/not-found.tsx (not app/not-found/page.tsx).
export default function NotFound() {
  return <NotFoundPageLayout />;
}
