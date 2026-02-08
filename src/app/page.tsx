import { env } from "~/env";

export default function HomePage() {
  return <div className="text-yellow-300">{env.NEXT_PUBLIC_BETTER_AUTH_URL}</div>;
}
