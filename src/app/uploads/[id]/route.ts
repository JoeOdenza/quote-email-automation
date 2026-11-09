import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { upload } from "@/db/schema";

// Serves images uploaded from the app. Emails link here, so these URLs must
// keep working for as long as guests might open an old email.
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[id]">) {
    await connection();
    const { id } = await ctx.params;
    const [row] = await db
        .select({ contentType: upload.contentType, data: upload.data })
        .from(upload)
        .where(eq(upload.id, id));
    if (!row) return new Response("Not found", { status: 404 });

    return new Response(new Uint8Array(row.data), {
        headers: {
            "Content-Type": row.contentType,
            // An upload never changes once stored.
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
