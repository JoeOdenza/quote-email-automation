import { ThemeForm } from "../theme-form";

export default function NewThemePage() {
    return (
        <main className="flex flex-col gap-5">
            <h1 className="text-2xl font-semibold text-[#14304f]">Add theme</h1>
            <ThemeForm theme={null} />
        </main>
    );
}
