import PageClient from "./page-client";

export async function generateMetadata({ params, searchParams }: any) {
  const queryParams = new URLSearchParams(searchParams);

  return {
    title: "Lucide Studio",
    description: "Edit and create lucide icons",
    openGraph: {
      images: [{ url: `/api/og?${queryParams}` }],
    },
    twitter: {
      card: "summary_large_image",
      images: [{ url: `/api/og?${queryParams}` }],
    },
  };
}

export default function Home() {
  return <PageClient />;
}
