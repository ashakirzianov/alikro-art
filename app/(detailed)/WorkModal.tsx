'use client'
import { AssetMetadata } from "@/shared/asset"
import { Modal } from "@/app/(detailed)/Modal"
import { AssetImage } from "@/app/AssetImage"
import { useRouter, useSearchParams } from "next/navigation"
import React, { Suspense, useCallback, useEffect, useState } from "react"
import { hrefForConsole, hrefForAssetModal, hrefForAsset, hrefForTag } from "@/shared/href"
import Link from "next/link"
import { useIsClient, useShowEditButton } from "@/shared/setting"
import { Carousel, scrollCarouselNext, scrollCarouselPrev } from "./Carousel"

export function OptionalModal({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    return <Suspense fallback={null}>
        <OptionalModalImpl
            assets={assets}
            pathname={pathname}
        />
    </Suspense>
}

function OptionalModalImpl({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    const searchParams = useSearchParams()
    const show = searchParams.get('show')
    const [showEditButton] = useShowEditButton()
    const assetIdx = assets.findIndex(asset => asset.id === show)
    if (typeof show === 'string' && assetIdx !== -1) {
        return <WorkModalImpl
            assetIdx={assetIdx}
            assets={assets}
            pathname={pathname}
            showEditButton={showEditButton}
        />
    } else {
        return null
    }
}

function WorkModalImpl({
    assets, assetIdx, pathname, showEditButton,
}: {
    assetIdx: number,
    assets: AssetMetadata[],
    pathname: string,
    showEditButton: boolean,
}) {
    const n = assets.length
    const router = useRouter()
    const [showTags, setShowTags] = useState(false)

    const nextIdx = (assetIdx + 1) % n
    const prevIdx = (assetIdx - 1 + n) % n
    const nextLink = hrefForAssetModal({ pathname, assetId: assets[nextIdx].id })
    const prevLink = hrefForAssetModal({ pathname, assetId: assets[prevIdx].id })
    const dismissLink = pathname
    const asset = assets[assetIdx]
    const editLink = hrefForConsole({ assetId: asset.id })

    const handleIndexChange = useCallback((newIdx: number) => {
        setShowTags(false)
        router.push(hrefForAssetModal({ pathname, assetId: assets[newIdx].id }), { scroll: false })
    }, [assets, pathname, router])

    const dismiss = useCallback(() => router.push(dismissLink, { scroll: false }), [router, dismissLink])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') dismiss()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [dismiss])

    function stopPropagation(e: React.MouseEvent) { e.stopPropagation() }

    const imageStyle: React.CSSProperties = {
        objectFit: 'contain',
        maxWidth: '100svw',
        maxHeight: '100svh',
    }

    return <Modal onDismiss={dismiss}>
        <Carousel
            count={n}
            currentIndex={assetIdx}
            onIndexChange={handleIndexChange}
            renderCell={(idx, nearCurrent) => {
                const cellAsset = assets[idx]
                const cellLink = hrefForAsset({ assetId: cellAsset.id, pathname })
                return <Link href={cellLink} onClick={stopPropagation}>
                    <AssetImage asset={cellAsset} sizes="100vw" style={imageStyle} loading={nearCurrent ? 'eager' : 'lazy'} />
                </Link>
            }}
        />

        {/* Navigation buttons */}
        <div className="absolute top-0 bottom-0 left-4 flex items-center justify-between" onClick={stopPropagation}>
            <RoundButton
                href={prevLink}
                label="Previous work"
                className="m-4"
                onClick={(e) => {
                    e.preventDefault()
                    const el = document.querySelector('.carousel-scroll') as HTMLElement
                    if (el) scrollCarouselPrev(el)
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </RoundButton>
        </div>

        <div className="absolute top-0 bottom-0 right-4 flex items-center justify-between" onClick={stopPropagation}>
            <RoundButton
                href={nextLink}
                label="Next work"
                className="m-4"
                onClick={(e) => {
                    e.preventDefault()
                    const el = document.querySelector('.carousel-scroll') as HTMLElement
                    if (el) scrollCarouselNext(el)
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </RoundButton>
        </div>

        {/* Close button */}
        <RoundButton href={dismissLink} label="Close modal" className="absolute top-4 right-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss() }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </RoundButton>

        {/* Edit button */}
        {showEditButton && <EditButton editLink={editLink} />}

        {/* More tags */}
        {asset.tags && asset.tags.length > 0 && <div className="absolute bottom-4 right-4" onClick={stopPropagation}>
            {showTags
                ? <div className="flex flex-row flex-wrap justify-end gap-x-2 items-center bg-black/60 px-3 py-1 rounded-full">
                    <span className="text-accent text-sm sm:text-lg">See more:</span>
                    {asset.tags.map((tag, i) => (
                        <Link key={i} href={hrefForTag({ tag })} className="text-accent hover:bg-accent hover:text-white text-sm sm:text-lg">
                            {tag}{i < asset.tags!.length - 1 ? ',' : ''}
                        </Link>
                    ))}
                </div>
                : <button
                    onClick={() => setShowTags(true)}
                    className="p-2 text-accent rounded-full transition-all duration-150 hover:scale-110"
                    aria-label="Show more"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                    </svg>
                </button>
            }
        </div>}

    </Modal>
}

function RoundButton({ href, label, className, onClick, children }: {
    href: string,
    label: string,
    className?: string,
    onClick?: React.MouseEventHandler<HTMLAnchorElement>,
    children: React.ReactNode,
}) {
    return <Link
        href={href}

        className={`p-2 text-accent rounded-full transition-all duration-150 hover:scale-110 ${className ? ` ${className}` : ''}`}
        aria-label={label}
        onClick={onClick}
    >
        {children}
    </Link>
}

function EditButton({ editLink }: { editLink: string }) {
    const isClient = useIsClient()
    if (!isClient) {
        return null
    }
    return <RoundButton
        href={editLink}
        label="Edit work"
        className="absolute top-4 left-4"

        onClick={e => e.stopPropagation()}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="square" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
    </RoundButton>
}

