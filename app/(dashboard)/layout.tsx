import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  console.log("🔥 DASHBOARD LAYOUT SE ESTÁ EJECUTANDO"); // 👈 AQUÍ

  const cookieStore = await cookies();
  const user = cookieStore.get("user");

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient>{children}</DashboardClient>;
}