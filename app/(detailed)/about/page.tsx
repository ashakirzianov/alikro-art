import { SocialLinks } from "@/app/(detailed)/about/SocialLinks"
import Link from "next/link"

export default function About() {
    return <div className="flex flex-col items-center text-accent text-2xl mt-4">
        <span>Hi, I&apos;m <Link href={'/'} className="hover:text-secondary hover:bg-accent underline decoration-dotted">
            Alikro
        </Link>
        </span>
        <div className="flex flex-col max-w-prose p-4 gap-8">
            <p>
                Observing the world since 1992 in Ukraine, and now from Buenos Aires, Argentina.
            </p>
            <p>
                I work with drawing, painting, collage, ceramics, and more. I love line — the way a leaf has a shape that asks to be followed. I can put all my attention into that, tracing it as precisely as I can, and in those moments I feel like I&apos;m part of nature too.
            </p>
            <p>
                For me, making art is a way to stop time for a moment. To hold something that feels fragile. Moving through different places, learning languages, failing, starting over — it slowly taught me to hold myself a little lighter. To look more carefully. At people, at nature, at the quiet things that are easy to miss.
            </p>
            <p>
                When I don&apos;t know what to paint, I paint flowers and spikes.
            </p>
            <p>
                I trained as a graphic designer and have shown work in Europe and the US. Here you&apos;ll find both commercial and personal work — sometimes it&apos;s hard to tell them apart, and I like it that way.
            </p>
            <p>
                If something here speaks to you, or you&apos;d like to work together — as an illustrator, designer, artist, ceramicist or friend — I&apos;d love to hear from you.
            </p>
            <p>
                Originals and prints are available to buy — just ask.
            </p>
            <div className="flex flex-col items-end">
                <div className="bg-accent p-4">
                    <div className="flex flex-row gap-4" style={{
                        filter: 'brightness(0) invert(1)',
                    }}>
                        <SocialLinks size={32} />
                    </div>
                </div>
            </div>
        </div>
    </div>
}
