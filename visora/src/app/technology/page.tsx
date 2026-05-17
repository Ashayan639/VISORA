import { redirect } from "next/navigation";

/** Legacy path — navbar previously linked here. */
export default function TechnologyRedirectPage() {
  redirect("/tech");
}
