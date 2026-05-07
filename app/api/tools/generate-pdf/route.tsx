import { renderToBuffer } from '@react-pdf/renderer'
import { ToolsPdfDocument } from '@/lib/toolsPdfDocument'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const buffer = await renderToBuffer(<ToolsPdfDocument />)
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="monkcubed-tool-library.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('tools PDF:', e)
    return new Response('PDF generation failed', { status: 500 })
  }
}
