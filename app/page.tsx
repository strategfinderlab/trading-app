import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const user = cookies().get("user");

  if (user) {
    redirect("/entradas");
  } else {
    redirect("/login");
  }
}