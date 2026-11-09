import { signOut } from "../actions";
import { withBasePath } from "@/libs/base-path";
import { currentAccount } from "@/libs/session";

// Shows who's signed in with Microsoft. A plain <a> (not <Link>) for sign-in,
// since it's a redirect to Microsoft rather than a page to prefetch.
export async function AccountMenu() {
    const account = await currentAccount();
    if (!account) {
        return (
            <a href={withBasePath("/auth/signin")} className="text-sm font-medium text-white/80 hover:text-white">
                Sign in with Microsoft
            </a>
        );
    }
    return (
        <form action={signOut} className="flex items-center gap-3 text-sm">
            <span className="text-white/80" title={account.email}>
                {account.name}
            </span>
            <button type="submit" className="font-medium text-white/80 underline-offset-2 hover:text-white hover:underline">
                Sign out
            </button>
        </form>
    );
}
