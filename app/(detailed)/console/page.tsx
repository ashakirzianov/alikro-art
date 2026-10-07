'use client'

import { hrefForConsole } from "@/shared/href"
import { useShowEditButton } from "@/shared/setting"

const xaxisUrl = process.env.NEXT_PUBLIC_XAXIS_URL

export default function Page() {
    const [showEditButton, setShowEditButton] = useShowEditButton()
    return <section className="flex flex-col items-start max-w-prose w-full px-6 py-8 md:px-10 md:py-12 gap-8 md:gap-10">
        <h1 className="text-3xl font-semibold leading-tight">Console</h1>
        {xaxisUrl && <a
            href={hrefForConsole()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-accent underline"
        >
            Open Editor
        </a>}
        <fieldset className="flex flex-col w-full gap-6 p-6 md:p-8 border border-neutral-200">
            <legend className="text-sm uppercase tracking-wide text-neutral-500 px-2">Settings</legend>
            <label className="flex items-center gap-4 cursor-pointer text-lg leading-none">
                <input
                    type="checkbox"
                    checked={showEditButton}
                    onChange={() => setShowEditButton(!showEditButton)}
                    className="w-5 h-5 accent-accent"
                />
                <span>Show Edit Buttons</span>
            </label>
        </fieldset>
    </section>
}
