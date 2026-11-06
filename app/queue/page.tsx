import { redirect } from "next/navigation";

// The old single "queue" is now two pages: Interested and Passed.
export default function QueueRedirect() {
  redirect("/interested");
}
