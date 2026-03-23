import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = params;

    // Get certificate
    const { data: certificate } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single();

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', certificate.user_id)
      .single();

    const fullName = profile?.full_name || 'Unknown User';

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);

    const { width, height } = page.getSize();
    const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const scriptFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Border
    page.drawRectangle({
      x: 30, y: 30, width: width - 60, height: height - 60,
      color: rgb(0.95, 0.95, 0.95),
      borderWidth: 2, borderColor: rgb(0.2, 0.4, 0.8),
    });

    // Inner border
    page.drawRectangle({
      x: 40, y: 40, width: width - 80, height: height - 80,
      color: rgb(1, 1, 1),
      borderWidth: 1, borderColor: rgb(0.3, 0.5, 0.9),
    });

    // Logo
    page.drawText('SKILLPROOF', {
      x: width / 2 - 100, y: height - 100, size: 32,
      font: titleFont, color: rgb(0.2, 0.4, 0.8),
    });

    // Title
    page.drawText('Certificate of Completion', {
      x: width / 2 - 180, y: height - 150, size: 36,
      font: titleFont, color: rgb(0.1, 0.1, 0.1),
    });

    // Body text
    page.drawText('This is to certify that', {
      x: width / 2 - 100, y: height - 220, size: 18,
      font: regularFont, color: rgb(0.3, 0.3, 0.3),
    });

    // Recipient name
    page.drawText(fullName, {
      x: width / 2 - (fullName.length * 10), y: height - 280, size: 48,
      font: scriptFont, color: rgb(0.1, 0.1, 0.1),
    });

    // Description
    page.drawText('has successfully completed', {
      x: width / 2 - 110, y: height - 330, size: 18,
      font: regularFont, color: rgb(0.3, 0.3, 0.3),
    });

    // Challenge count
    page.drawText(`${certificate.challenge_ids.length} coding challenges`, {
      x: width / 2 - 100, y: height - 365, size: 22,
      font: titleFont, color: rgb(0.2, 0.4, 0.8),
    });

    // Proficiency
    page.drawText('Demonstrating proficiency in programming', {
      x: width / 2 - 125, y: height - 400, size: 16,
      font: regularFont, color: rgb(0.4, 0.4, 0.4),
    });

    // Issue date
    const issueDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    page.drawText(issueDate, {
      x: width / 2 - 60, y: height - 450, size: 16,
      font: regularFont, color: rgb(0.4, 0.4, 0.4),
    });

    // Certificate ID
    page.drawText(`Certificate ID: ${certificate.id.slice(0, 8)}...`, {
      x: width / 2 - 70, y: 80, size: 10,
      font: regularFont, color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SkillProof-Certificate-${fullName.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
