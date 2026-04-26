import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
const ALLOWED_TYPES: MediaType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function fileToBase64(file: File): Promise<{ data: string; mediaType: MediaType }> {
  const buf = await file.arrayBuffer()
  const data = Buffer.from(buf).toString('base64')
  const mediaType: MediaType = ALLOWED_TYPES.includes(file.type as MediaType)
    ? (file.type as MediaType)
    : 'image/jpeg'
  return { data, mediaType }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ID scan not configured' }, { status: 503 })
  }

  const formData = await req.formData()
  const frontFile = formData.get('front') as File | null
  const backFile = formData.get('back') as File | null

  if (!frontFile && !backFile) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 })
  }

  const imageContent: Anthropic.ImageBlockParam[] = []
  const textParts: string[] = []

  if (frontFile) {
    const { data, mediaType } = await fileToBase64(frontFile)
    imageContent.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } })
    textParts.push('First image: FRONT of the identity card')
  }
  if (backFile) {
    const { data, mediaType } = await fileToBase64(backFile)
    imageContent.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } })
    textParts.push('Second image: BACK of the identity card')
  }

  const prompt = `You are reading a Dutch "Vreemdelingen identiteitsbewijs" (Alien Identity Document).

${textParts.join('\n')}

Extract ONLY the following fields and return them as valid JSON. Use null for any field you cannot read clearly.

Fields to extract:
- lastName: Family name (on front, after NAAM)
- firstName: Given name(s) (on front, second line under the family name)
- fullName: Full name combined (firstName + lastName)
- nationality: Nationality (on front, after NAT.)
- dateOfBirth: Date of birth in DD-MM-YYYY format (on front, after GEB.)
- placeOfBirth: Place of birth (on front, after TE)
- docType: Document type code (on front, after DOC. TYPE)
- frontDocNumber: Document number on front (on front, after DOC. NR.)
- backDocNumber: DOC.NR. on the back of the card (on back, first number)
- vnr: V-NR. — the Vreemdelingennummer, exactly 10 digits (on back, the number right below DOC.NR., starts with V-NR.)
- validUntil: Valid until date in DD-MM-YYYY format (on back, after GELDIG TOT)

Return ONLY a JSON object with these exact field names. No explanation, no markdown, just JSON.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any markdown code fences if present
    const clean = raw.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)
  } catch (err) {
    console.error('ID scan error:', err)
    return NextResponse.json({ error: 'Failed to read card. Please try a clearer photo.' }, { status: 422 })
  }
}
