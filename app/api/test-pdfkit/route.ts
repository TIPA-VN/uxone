import { NextRequest, NextResponse } from 'next/server';
import PDFKitGenerator from '@/lib/pdfkit-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title } = body;

    console.log('🔍 PDFKit Test Request:', { content, title });

    // Create PDFKit generator instance
    const pdfGenerator = new PDFKitGenerator();

    // Generate PDF with Vietnamese text
    const pdfBuffer = await pdfGenerator.generateContractPDF({
      title: title || 'Test Contract with Vietnamese Text',
      content: content || 'Default content',
      contractNumber: 'TEST-2025-001',
      counterparty: 'Thành Nghĩa Việt Nam',
      value: '1000000',
      currency: 'VND',
      contractStatus: 'DRAFT',
      approverNames: ['NGUYỄN HƯNG QUỐC'],
      approvedAt: new Date(),
      contractTitle: 'Test Contract Title',
      version: 1.0,
      revisionNumber: 1,
      finalizationDate: new Date(),
      checksum: 'test-checksum-123'
    });

    console.log('✅ PDFKit PDF generated successfully, size:', pdfBuffer.length);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-pdfkit-contract.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ Error in PDFKit test endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF with PDFKit', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test with sample Vietnamese content
    const sampleContent = `
      <h2>Hợp đồng mẫu với tiếng Việt</h2>
      <p><strong>Bên A:</strong> Công ty TNHH Thành Nghĩa Việt Nam</p>
      <p><strong>Bên B:</strong> Ông NGUYỄN HƯNG QUỐC</p>
      <p><strong>Nội dung:</strong> Hợp đồng cung cấp dịch vụ</p>
      <p><strong>Giá trị:</strong> 900,000,000 VND</p>
      <p><strong>Thời hạn:</strong> 12 tháng</p>
      <p><strong>Điều khoản:</strong></p>
      <ul>
        <li>Điều 1: Phạm vi công việc</li>
        <li>Điều 2: Thời gian thực hiện</li>
        <li>Điều 3: Thanh toán</li>
        <li>Điều 4: Bảo mật</li>
      </ul>
    `;

    const pdfGenerator = new PDFKitGenerator();
    const pdfBuffer = await pdfGenerator.generateContractPDF({
      title: 'Test Contract with Vietnamese Text',
      content: sampleContent,
      contractNumber: 'TEST-2025-001',
      counterparty: 'Thành Nghĩa Việt Nam',
      value: '900000000',
      currency: 'VND',
      contractStatus: 'DRAFT',
      approverNames: ['NGUYỄN HƯNG QUỐC'],
      approvedAt: new Date(),
      contractTitle: 'Test Contract Title',
      version: 1.0,
      revisionNumber: 1,
      finalizationDate: new Date(),
      checksum: 'test-checksum-123'
    });

    console.log('✅ PDFKit GET test successful, size:', pdfBuffer.length);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-pdfkit-vietnamese.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ Error in PDFKit GET test:', error);
    return NextResponse.json(
      { error: 'Failed to generate test PDF', details: error.message },
      { status: 500 }
    );
  }
}
