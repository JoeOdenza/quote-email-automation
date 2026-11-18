"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type ChangeEvent, type FormEvent } from "react";
import { saveTheme, type FormState } from "../actions";
import { Field, FormMessage, Input, Section, primaryButton } from "../ui/form";
import { PreviewFrame } from "../ui/preview-frame";
import { withBasePath } from "@/libs/base-path";
import { DEFAULT_COLOR_SCHEME, colorSchemes, swatchColors } from "@/libs/color-schemes";
import { renderQuoteEmail } from "@/libs/render";
import { sampleQuoteEmail } from "@/libs/sample";
import {
    THEME_NAME_MAX,
    themeImageLabels,
    themeImageMaxBytes,
    themeImageMaxLabel,
    themeImageSize,
    themeImageSlots,
    themeImageTypes,
    type ThemeImageSlot,
} from "@/libs/themes";
import { logoSrc } from "@/libs/tiers";

export type ThemeValues = {
    id: number;
    name: string;
    colorScheme: string;
    active: boolean;
    images: Record<ThemeImageSlot, string>;
};

const imageHints: Record<ThemeImageSlot, string> = {
    banner: "Across the top of the email. Very wide: about 3.6 : 1.",
    base: "On the Base quote card. Wide: about 3.3 : 1.",
    upgrade: "On the Upgrade quote card. Wide: about 2.7 : 1.",
    premium: "On the Premium quote card. Wide: about 3 : 1.",
};

// Crops the chosen photo to the shape it shows at in the email, from the
// centre, for the previews. (The server crops the saved copy itself, keeping
// the most eye-catching part, so it can sit slightly differently.)
async function croppedPreview(file: File, slot: ThemeImageSlot): Promise<string> {
    const { width, height } = themeImageSize(slot);
    const bitmap = await createImageBitmap(file);
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const sw = width / scale;
    const sh = height / scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas
        .getContext("2d")!
        .drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
}

// A grey box with the picture's name, for pictures not chosen yet.
function placeholder(slot: ThemeImageSlot): string {
    const { width, height } = themeImageSize(slot);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#e4e7ec"/><text x="50%" y="50%" fill="#8a919c" font-family="Arial" font-size="18" text-anchor="middle" dominant-baseline="middle">${themeImageLabels[slot]}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function ImageField({
    slot,
    current,
    preview,
    error,
    required,
    onChange,
}: {
    slot: ThemeImageSlot;
    current: string | null;
    preview: string | null;
    error?: string;
    required: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
    const { width, height } = themeImageSize(slot);
    const shown = preview ?? (current && withBasePath(current));
    return (
        <div className="flex flex-col gap-2">
            <Field
                label={current ? `Replace ${themeImageLabels[slot].toLowerCase()}` : themeImageLabels[slot]}
                hint={current ? "Leave empty to keep the current picture." : imageHints[slot]}
            >
                <input
                    name={`image.${slot}`}
                    type="file"
                    required={required}
                    accept={themeImageTypes.join(",")}
                    onChange={onChange}
                    className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
                />
            </Field>
            {error && <p className="text-xs text-red-700">{error}</p>}
            {shown ? (
                // eslint-disable-next-line @next/next/no-img-element -- local previews and uploads, shown as-is
                <img
                    src={shown}
                    alt=""
                    width={width}
                    height={height}
                    style={{ aspectRatio: `${width} / ${height}` }}
                    className="w-full rounded-md border border-zinc-200 object-cover"
                />
            ) : (
                <div
                    style={{ aspectRatio: `${width} / ${height}` }}
                    className="w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50"
                />
            )}
        </div>
    );
}

export function ThemeForm({ theme }: { theme: ThemeValues | null }) {
    const [state, action, pending] = useActionState<FormState, FormData>(saveTheme, {});
    const [name, setName] = useState(theme?.name ?? "");
    const [scheme, setScheme] = useState<string>(theme?.colorScheme ?? DEFAULT_COLOR_SCHEME);
    const [previews, setPreviews] = useState<Partial<Record<ThemeImageSlot, string>>>({});
    const [imageErrors, setImageErrors] = useState<Partial<Record<ThemeImageSlot, string>>>({});

    async function onImageChange(slot: ThemeImageSlot, event: ChangeEvent<HTMLInputElement>) {
        const input = event.target;
        const file = input.files?.[0];
        const setError = (error?: string) => setImageErrors((all) => ({ ...all, [slot]: error }));
        const setPreview = (src?: string) => setPreviews((all) => ({ ...all, [slot]: src }));
        setError(undefined);
        if (!file) return setPreview(undefined);

        let error: string | undefined;
        if (!(themeImageTypes as readonly string[]).includes(file.type)) {
            error = "That isn't a JPG, PNG, GIF or WebP. Choose a different file.";
        } else if (file.size > themeImageMaxBytes) {
            error = `That file is over ${themeImageMaxLabel}. Choose a smaller one.`;
        } else {
            try {
                return setPreview(await croppedPreview(file, slot));
            } catch {
                error = "That file couldn't be read as a picture. Choose a different one.";
            }
        }
        input.value = "";
        setPreview(undefined);
        setError(error);
    }

    // Submitted by hand, rather than as the form's action, so the chosen
    // files stay in place if the server sends back an error.
    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
    }

    const picture = (slot: ThemeImageSlot) =>
        previews[slot] ?? (theme ? withBasePath(theme.images[slot]) : placeholder(slot));
    const preview = renderQuoteEmail(
        {
            ...sampleQuoteEmail,
            promo: { ...sampleQuoteEmail.promo, imageUrl: picture("base") },
            upgrade: { ...sampleQuoteEmail.upgrade, imageUrl: picture("upgrade") },
            hailMary: { ...sampleQuoteEmail.hailMary, imageUrl: picture("premium") },
        },
        { logoSrc, heroSrc: picture("banner"), colorScheme: scheme },
    );

    return (
        <form onSubmit={onSubmit} className="grid items-start gap-5 lg:grid-cols-[1fr_minmax(0,40rem)]">
            {theme && <input type="hidden" name="id" value={theme.id} />}
            <div className="flex flex-col gap-5">
                <Section title="Name">
                    <Field label="Theme name" hint="What agents pick on the quote form, e.g. “Caribbean Cruise”.">
                        <Input
                            name="name"
                            required
                            maxLength={THEME_NAME_MAX}
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Field>
                    {theme && (
                        <label className="mt-4 flex cursor-pointer items-start gap-2.5">
                            <input
                                type="checkbox"
                                name="active"
                                defaultChecked={theme.active}
                                className="mt-0.5 size-4 accent-[#0045a5]"
                            />
                            <span className="text-sm">
                                <span className="font-medium text-zinc-900">Offer on new quotes</span>
                                <span className="block text-xs text-zinc-500">
                                    Untick to retire it. Emails already made with it aren&apos;t affected.
                                </span>
                            </span>
                        </label>
                    )}
                </Section>

                <Section title="Colour scheme">
                    <div role="radiogroup" className="grid grid-cols-3 gap-2">
                        {colorSchemes.map((option) => (
                            <label
                                key={option.id}
                                className="flex cursor-pointer flex-col gap-2 rounded-md border border-zinc-200 p-2.5 hover:bg-zinc-50 has-[:checked]:border-[#0045a5] has-[:checked]:bg-[#f4f7fb]"
                            >
                                {/* Names get two lines of room, so every radio and colour strip lines up. */}
                                <span className="flex items-start gap-2">
                                    <input
                                        type="radio"
                                        name="colorScheme"
                                        value={option.id}
                                        checked={scheme === option.id}
                                        onChange={() => setScheme(option.id)}
                                        className="mt-px size-4 shrink-0 accent-[#0045a5]"
                                    />
                                    <span className="line-clamp-2 min-h-[2lh] text-sm font-medium leading-tight text-zinc-900">
                                        {option.name}
                                    </span>
                                </span>
                                <span aria-hidden="true" className="flex h-4 overflow-hidden rounded border border-zinc-200">
                                    {swatchColors(option.palette).map((color) => (
                                        <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                                    ))}
                                </span>
                            </label>
                        ))}
                    </div>
                </Section>

                <Section title="Pictures">
                    <p className="-mt-2 mb-4 text-xs text-zinc-500">
                        {theme
                            ? "Emails already made keep the pictures they were made with."
                            : `All four are required. JPG, PNG, GIF or WebP up to ${themeImageMaxLabel} each; full-size photos are fine. Each is cropped to its shape and compressed for email.`}
                    </p>
                    <div className="flex flex-col gap-5">
                        {themeImageSlots.map((slot) => (
                            <ImageField
                                key={slot}
                                slot={slot}
                                current={theme?.images[slot] ?? null}
                                preview={previews[slot] ?? null}
                                error={imageErrors[slot]}
                                required={!theme}
                                onChange={(event) => onImageChange(slot, event)}
                            />
                        ))}
                    </div>
                </Section>

                <FormMessage error={state.error} />

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={pending} className={primaryButton}>
                        {pending ? "Saving…" : theme ? "Save changes" : "Add theme"}
                    </button>
                    <Link href="/themes" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                        Cancel
                    </Link>
                </div>
            </div>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
                <h2 className="mb-1 text-base font-semibold text-[#14304f]">Preview</h2>
                <p className="mb-3 text-xs text-zinc-500">A sample quote email in this theme.</p>
                <PreviewFrame
                    html={preview}
                    title="Theme preview"
                    className="h-[75vh] w-full rounded-md border border-zinc-200"
                />
            </section>
        </form>
    );
}
