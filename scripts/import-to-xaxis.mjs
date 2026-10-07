// One-off import of crow-cms's works into the xaxis workspace `alikro-art`
// (design-xaxis-migration.md, §2). Re-runnable: a second run changes nothing,
// and a later run syncs whatever changed in crow since.
//
//   node --env-file=.env.local scripts/import-to-xaxis.mjs [--dry-run] [--only id,id] [--apply-deletes]
//
// Env: XAXIS_IMPORT_KEY (a secret of `alikro-art:keys/import`), NEXT_PUBLIC_CROW_CMS, CROW_CMS_SECRET_KEY.

import { createHash } from 'node:crypto'

const WORKSPACE = 'alikro-art'
const XAXIS_MCP = `https://xaxis.app/ws/${WORKSPACE}/api/mcp`
// crow's CloudFront serves the originals publicly: the same bytes as S3
const CROW_ORIGINALS = 'https://ddj4fy891wvdw.cloudfront.net/alikro/originals'
const BATCH = 50
const PARALLEL = 4
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const PROPERTIES = [
    'xaxis-title', 'kind', 'year-number', 'material', 'order-number', 'tags-list',
    'uploaded-time', 'published-flag', 'xaxis-public-flag',
]

const args = parseArgs(process.argv.slice(2))
await main()

async function main() {
    const crow = await fetchCrowWorks()
    const selected = args.only ? crow.filter(asset => args.only.includes(asset.id)) : crow
    if (args.only && selected.length !== args.only.length) {
        const found = new Set(selected.map(asset => asset.id))
        throw new Error(`--only names works crow does not have: ${args.only.filter(id => !found.has(id)).join(', ')}`)
    }
    const existing = await fetchXaxisWorks()
    console.log(`crow: ${crow.length} works (${selected.length} selected); xaxis: ${existing.size} works`)

    const plans = await pool(selected, PARALLEL, asset => planWork(asset, existing.get(objectName(asset.id))))
    const changes = plans.filter(plan => plan.op !== 'none')
    console.log(`to create ${count(plans, 'create')}, replace ${count(plans, 'replace')}, update ${count(plans, 'update')}, unchanged ${count(plans, 'none')}`)

    const crowNames = new Set(crow.map(asset => objectName(asset.id)))
    const orphans = [...existing.keys()].filter(name => !crowNames.has(name))
    if (orphans.length > 0) {
        console.log(`in xaxis but not in crow (${orphans.length}): ${orphans.join(', ')}${args.applyDeletes ? '' : ' — pass --apply-deletes to delete'}`)
    }
    if (args.dryRun) {
        for (const plan of changes) console.log(`  ${plan.op} ${plan.name}${plan.changed ? ` (${plan.changed.join(', ')})` : ''}`)
        return
    }

    // Uploads run ahead of the commits that use them, a batch at a time: an upload no
    // object uses is swept a day later, so nothing waits long between the two
    for (let start = 0; start < changes.length; start += BATCH) {
        const batch = changes.slice(start, start + BATCH)
        await pool(batch, PARALLEL, uploadIfNeeded)
        const forms = batch.flatMap(mutationForms)
        await mutate({ message: `import ${batch.length} works from crow-cms`, forms })
        console.log(`committed ${start + batch.length}/${changes.length}`)
    }
    if (args.applyDeletes && orphans.length > 0) {
        await mutate({
            message: `delete ${orphans.length} works crow no longer has`,
            forms: orphans.map(name => ['delete!', name]),
        })
        console.log(`deleted ${orphans.length}`)
    }
    await verify(selected)
}

async function planWork(asset, current) {
    const name = objectName(asset.id)
    const properties = desiredProperties(asset)
    const head = await fetch(originalUrl(asset), { method: 'HEAD' })
    if (!head.ok) throw new Error(`HEAD ${asset.fileName}: ${head.status}`)
    const size = Number(head.headers.get('content-length'))
    if (current === undefined) {
        return { op: 'create', name, asset, properties }
    }
    // crow never reuses a file name, so the same name and size is the same bytes
    const sameFile = current.fileName === asset.fileName && current.size === size
    if (!sameFile) {
        return { op: 'replace', name, asset, properties }
    }
    const changed = PROPERTIES.filter(key => !sameValue(current.properties[key], properties[key]))
    return changed.length === 0
        ? { op: 'none', name }
        : { op: 'update', name, properties, changed }
}

async function uploadIfNeeded(plan) {
    if (plan.op !== 'create' && plan.op !== 'replace') return
    const res = await fetch(originalUrl(plan.asset))
    if (!res.ok) throw new Error(`GET ${plan.asset.fileName}: ${res.status}`)
    const bytes = new Uint8Array(await res.arrayBuffer())
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const upload = await callTool('upload-file', { file_name: plan.asset.fileName, size: bytes.length })
    const put = await fetch(upload.url, { method: 'PUT', headers: upload.headers, body: bytes })
    if (!put.ok) throw new Error(`PUT ${plan.asset.fileName}: ${put.status} ${await put.text()}`)
    const finished = await callTool('finish-upload', { upload_id: upload['upload-id'] })
    if (finished.pointer.sha256 !== sha256) {
        throw new Error(`${plan.asset.fileName}: xaxis hashed ${finished.pointer.sha256}, the bytes hash to ${sha256}`)
    }
    plan.sha256 = sha256
}

function mutationForms(plan) {
    switch (plan.op) {
        case 'create':
            return [['create!', plan.name, ['file', plan.sha256], propertiesForm(plan.properties, { skipNull: true })]]
        case 'replace':
            // A delete and a create of one name in one commit is a change: the object's life continues
            return [
                ['delete!', plan.name],
                ['create!', plan.name, ['file', plan.sha256], propertiesForm(plan.properties, { skipNull: true })],
            ]
        case 'update':
            return [['update!', plan.name, propertiesForm(pick(plan.properties, plan.changed), { skipNull: false })]]
        default:
            return []
    }
}

async function verify(assets) {
    const works = await fetchXaxisWorks()
    const problems = []
    for (const asset of assets) {
        const work = works.get(objectName(asset.id))
        if (work === undefined) {
            problems.push(`${asset.id}: missing`)
            continue
        }
        if (work.width !== asset.width || work.height !== asset.height) {
            problems.push(`${asset.id}: ${work.width}×${work.height} in xaxis, ${asset.width}×${asset.height} in crow`)
        }
        const desired = desiredProperties(asset)
        const changed = PROPERTIES.filter(key => !sameValue(work.properties[key], desired[key]))
        if (changed.length > 0) problems.push(`${asset.id}: differs in ${changed.join(', ')}`)
    }
    console.log(`verified ${assets.length} works: ${problems.length === 0 ? 'all match crow' : `${problems.length} problems`}`)
    for (const problem of problems) console.log(`  ${problem}`)
    if (problems.length > 0) process.exitCode = 1
}

async function fetchCrowWorks() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_CROW_CMS}/api/projects/alikro/metadata`, {
        headers: { Authorization: `Bearer ${process.env.CROW_CMS_SECRET_KEY}` },
    })
    if (!res.ok) throw new Error(`crow metadata: ${res.status}`)
    return res.json()
}

async function fetchXaxisWorks() {
    const object = { sym: 'object' }
    const content = ['get-content', object]
    const rows = await callTool('query', {
        json: ['from', ['workspace', 'current'],
            ['where', ['string-starts-with?', ['get-name', object], 'works/']],
            ['project', ['record',
                'name', ['get-name', object],
                'fileName', ['get', content, 'file-name'],
                'size', ['get', content, 'size'],
                'width', ['get', content, 'width'],
                'height', ['get', content, 'height'],
                'properties', ['record', ...PROPERTIES.flatMap(key => [key, ['get', object, key]])],
            ]]],
    })
    return new Map(rows.map(row => [row.name, row]))
}

async function mutate({ message, forms }) {
    return callTool('mutate', { json: ['commit', message, ...forms] })
}

let requestId = 0
async function callTool(name, toolArgs) {
    const res = await fetch(XAXIS_MCP, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.XAXIS_IMPORT_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method: 'tools/call', params: { name, arguments: toolArgs } }),
    })
    const body = await res.text()
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${body}`)
    const message = res.headers.get('content-type')?.includes('text/event-stream')
        ? JSON.parse(body.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5)).join(''))
        : JSON.parse(body)
    if (message.error) throw new Error(`${name}: ${message.error.message}`)
    const text = message.result.content[0].text
    if (message.result.isError) throw new Error(`${name}: ${text}`)
    return JSON.parse(text)
}

function desiredProperties(asset) {
    const released = asset.kind !== 'unpublished'
    return {
        'xaxis-title': asset.title ?? null,
        'kind': released ? asset.kind ?? null : null,
        'year-number': asset.year ?? null,
        'material': asset.material ?? null,
        'order-number': asset.order ?? null,
        'tags-list': asset.tags?.length ? asset.tags : null,
        'uploaded-time': new Date(asset.uploaded).toISOString(),
        'published-flag': released ? true : null,
        'xaxis-public-flag': released ? true : null,
    }
}

function propertiesForm(properties, { skipNull }) {
    const entries = Object.entries(properties).filter(([, value]) => !(skipNull && value === null))
    return ['record', ...entries.flatMap(([key, value]) => [key, valueForm(key, value)])]
}

function valueForm(key, value) {
    if (value === null) return null
    if (key.endsWith('-time')) return ['time', value]
    if (Array.isArray(value)) return ['list', ...value]
    return value
}

function sameValue(a, b) {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function objectName(id) {
    // xaxis names allow single hyphens only: `plate-with-the--dog` becomes `plate-with-the-dog`
    const slug = id.replace(/-{2,}/g, '-')
    if (!SLUG.test(slug)) throw new Error(`crow id "${id}" does not make an xaxis name`)
    return `works/${slug}`
}

function originalUrl(asset) {
    return `${CROW_ORIGINALS}/${encodeURIComponent(asset.fileName)}`
}

function pick(record, keys) {
    return Object.fromEntries(keys.map(key => [key, record[key]]))
}

function count(plans, op) {
    return plans.filter(plan => plan.op === op).length
}

async function pool(items, size, task) {
    const results = new Array(items.length)
    let next = 0
    async function worker() {
        while (next < items.length) {
            const index = next++
            results[index] = await task(items[index])
        }
    }
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker))
    return results
}

function parseArgs(argv) {
    const parsed = { dryRun: false, applyDeletes: false, only: undefined }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--dry-run') parsed.dryRun = true
        else if (arg === '--apply-deletes') parsed.applyDeletes = true
        else if (arg === '--only') parsed.only = argv[++i].split(',')
        else throw new Error(`unknown argument ${arg}`)
    }
    return parsed
}
