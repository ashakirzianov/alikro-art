'use client'
import { hrefForConsole } from "@/shared/href"
import { useIsClient, useShowEditButton } from "@/shared/setting"
import Link from "next/link"

export function EditLink({ asset }: { asset: { id: string } }) {
    const isClient = useIsClient()
    const [showEditButton] = useShowEditButton()
    if (!showEditButton || !isClient) {
        return null
    }
    return <Link href={hrefForConsole({ assetId: asset.id })}
        className="hover:underline"
        target="_blank" rel="noopener noreferrer"
    >edit</Link>
}