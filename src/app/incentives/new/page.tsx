import { IncentiveForm } from "../incentive-form";

export default function NewIncentivePage() {
    return (
        <main className="flex flex-col gap-5">
            <h1 className="text-2xl font-semibold text-[#14304f]">Add incentive</h1>
            <IncentiveForm incentive={null} />
        </main>
    );
}
