import { redirect } from "next/navigation";

export default function Home() {
  redirect("/menu?table=T1");
}
