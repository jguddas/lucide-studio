import PageClient from "./page-client";

export async function generateMetadata({ params, searchParams }: any) {
  const queryParams = new URLSearchParams(searchParams);
  const url = `https://lucide-studio.vercel.app/api/og?${queryParams}`;

  return {
    title: "Lucide Studio",
    description: "Edit and create lucide icons",
    openGraph: {
      images: [
        {
          url,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image", images: [{ url }] },
  };
}

export default function Home() {
  return <PageClient />;
}
