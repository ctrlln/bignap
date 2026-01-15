
import { jsPDF } from 'jspdf';
import type { User, Certification } from './data/types';

export async function generateCertificatePDF(student: User, certification: Certification, stampUrl?: string | null) {
    // Create landscape PDF
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Dimensions
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const centerX = width / 2;

    // Border
    doc.setLineWidth(1);
    doc.setDrawColor(44, 63, 66); // Dark Teal (Secondary Foreground)
    doc.rect(10, 10, width - 20, height - 20);

    doc.setLineWidth(0.5);
    doc.setDrawColor(129, 174, 181); // Brand Teal
    doc.rect(15, 15, width - 30, height - 30);

    // Bignap Academy Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(44, 63, 66); // Dark Teal
    doc.text("Certificate of Completion", centerX, 50, { align: "center" });

    // Subheader
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("This is to certify that", centerX, 70, { align: "center" });

    // Student Name
    doc.setFont("times", "italic");
    doc.setFontSize(32);
    doc.setTextColor(0);
    doc.text(`${student.first_name} ${student.last_name}`, centerX, 90, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(150);
    doc.line(centerX - 60, 92, centerX + 60, 92); // Underline name

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("has successfully completed the certification", centerX, 110, { align: "center" });

    // Certification Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(129, 174, 181); // Brand Teal
    const certName = certification.certification_type;
    doc.text(certName, centerX, 130, { align: "center" });

    // Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100);
    const dateStr = new Date(certification.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Awarded on ${dateStr}`, centerX, 150, { align: "center" });

    // Footer / Seal
    doc.setFontSize(12);
    doc.setTextColor(150);
    doc.text("Bignap Academy", centerX, 180, { align: "center" });
    doc.text("Official Record", centerX, 185, { align: "center" });

    // Stamp
    if (stampUrl) {
        try {
            // Fetch the image
            console.log('Fetching stamp from:', stampUrl);
            const response = await fetch(stampUrl);
            if (!response.ok) throw new Error(`Stamp fetch failed: ${response.statusText}`);

            const blob = await response.blob();
            let base64: string;
            let format: string;

            if (blob.type === 'image/svg+xml' || stampUrl.toLowerCase().endsWith('.svg')) {
                // Simplified SVG handling wrapper
                base64 = await convertSvgToPng(blob);
                format = 'PNG';
            } else {
                base64 = await blobToBase64(blob);
                const ext = stampUrl.split('.').pop()?.toUpperCase() || 'PNG';
                format = ext === 'JPG' ? 'JPEG' : ext;
            }

            // Add to PDF (bottom right usually)
            const stampSize = 30; // mm
            doc.addImage(base64, format, width - 50, height - 50, stampSize, stampSize);
        } catch (e) {
            console.error('Failed to embed stamp:', e);
        }
    }

    // Save
    const filename = `Certificate_${student.last_name}_${certification.id}.pdf`;
    doc.save(filename);
}

// Helpers
function convertSvgToPng(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 200;
            canvas.height = img.height || 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                reject(new Error('Canvas context failed'));
            }
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}
