'use client'
import { AssetMetadata } from "@/shared/asset"
import { Modal } from "@/app/(detailed)/Modal"
import { AssetImage } from "@/app/AssetImage"
import { useRouter, useSearchParams } from "next/navigation"
import React, { Suspense, useCallback, useEffect } from "react"
import { hrefForConsole, hrefForAssetModal, hrefForAsset } from "@/shared/href"
import Link from "next/link"
import { useIsClient, useShowEditButton } from "@/shared/setting"

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
    const asset = assets[assetIdx]
    const nextIndex = (assetIdx + 1) % assets.length
    const prevIndex = (assetIdx - 1 + assets.length) % assets.length

    const nextLink = nextIndex >= 0 && nextIndex < assets.length
        ? hrefForAssetModal({
            pathname,
            assetId: assets[nextIndex].id,
        })
        : undefined
    const prevLink = prevIndex >= 0 && prevIndex < assets.length
        ? hrefForAssetModal({
            pathname,
            assetId: assets[prevIndex].id,
        })
        : undefined
    const dismissLink = pathname
    const editLink = hrefForConsole({ assetId: asset.id })

    const currentAssetLink = hrefForAsset({
        assetId: asset.id,
        pathname,
    })

    const router = useRouter()
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (nextLink) {
                    router.push(nextLink, { scroll: false })
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (prevLink) {
                    router.push(prevLink, { scroll: false })
                }
            } else if (e.key === 'Escape') {
                if (dismissLink) {
                    router.push(dismissLink, { scroll: false })
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [nextLink, prevLink, dismissLink, router])

    const dismiss = useCallback(function dismiss() {
        router.push(dismissLink, { scroll: false })
    }, [router, dismissLink])

    function stopPropagation(e: React.MouseEvent) {
        e.stopPropagation()
    }

    return <Modal
        onDismiss={dismiss}
    >
        <Link href={currentAssetLink} scroll={false} onClick={stopPropagation}>
            <AssetImage
                asset={asset}
                sizes="100vw"
                style={{
                    objectFit: 'contain',
                    maxWidth: '100svw',
                    maxHeight: '100svh',
                }}
            />
        </Link>

        {/* Navigation buttons */}
        {prevLink && <div className="absolute top-0 bottom-0 left-4 flex items-center justify-between" onClick={stopPropagation}>
            <RoundButton href={prevLink} scroll={false} label="Previous work" className="m-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </RoundButton>
        </div>}

        {nextLink && <div className="absolute top-0 bottom-0 right-4 flex items-center justify-between" onClick={stopPropagation}>
            <RoundButton href={nextLink} scroll={false} label="Next work" className="m-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </RoundButton>
        </div>}

        {/* Close button */}
        <RoundButton href={dismissLink} scroll={false} label="Close modal" className="absolute top-4 right-4" onClick={stopPropagation}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </RoundButton>

        {/* Edit button */}
        {showEditButton && <EditButton editLink={editLink} />}
    </Modal >
}

function RoundButton({ href, label, className, scroll, onClick, children }: {
    href: string,
    label: string,
    className?: string,
    scroll?: boolean,
    onClick?: React.MouseEventHandler<HTMLAnchorElement>,
    children: React.ReactNode,
}) {
    return <Link
        href={href}
        scroll={false}
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
        scroll={false}
        onClick={e => e.stopPropagation()}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="square" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
    </RoundButton>
}