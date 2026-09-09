import { SocialLinks } from "@/app/(detailed)/about/SocialLinks"
import Link from "next/link"

export default function About() {
    return <div className="flex flex-col items-center text-accent text-2xl mt-4">
        <span>Hi, I&apos;m <Link href={'/'} className="hover:text-secondary hover:bg-accent underline decoration-dotted">
            Alikro
        </Link>
        </span>
        <div className="max-w-prose p-4">
            Observing the world since 1992 in Ukraine, and now from Buenos Aires, Argentina.
            <br /><br />
            I work with drawing, painting, collage, ceramics, and more. I love line — the way a leaf has a shape that asks to be followed. I can put all my attention into that, tracing it as precisely as I can, and in those moments I feel like I&apos;m part of nature too.
            <br /><br />
            For me, making art is a way to stop time for a moment. To hold something that feels fragile. Moving through different places, learning languages, failing, starting over — it slowly taught me to hold myself a little lighter. To look more carefully. At people, at nature, at the quiet things that are easy to miss.
            <br /><br />
            When I don&apos;t know what to paint, I paint flowers and spikes.
            <br /><br />
            I trained as a graphic designer and have shown work in Europe and the US. Here you&apos;ll find both commercial and personal work — sometimes it&apos;s hard to tell them apart, and I like it that way.
            <br /><br />
            If something here speaks to you, or you&apos;d like to work together — as an illustrator, designer, artist, ceramicist or friend — I&apos;d love to hear from you.
            <br /><br />
            Originals and prints are available to buy — just ask.
            <div className="py-4 flex flex-col items-end grow">
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
