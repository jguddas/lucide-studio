import { redirect } from "next/navigation";
import PageClient from "./page-client";

export default async function Home({ searchParams }: any) {
  const queryParams = new URLSearchParams(searchParams);
  if (queryParams.toString()) {
    redirect(`/edit?${queryParams.toString()}`);
  }
  return <PageClient />;
}
