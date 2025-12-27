
import { jsPDF } from 'jspdf';
import type { Student, Certification } from '../types';

export function generateCertificatePDF(student: Student, certification: Certification) {
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
    doc.setDrawColor(20, 83, 45); // emerald-900 like
    doc.rect(10, 10, width - 20, height - 20);

    doc.setLineWidth(0.5);
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.rect(15, 15, width - 30, height - 30);

    // Bignap Academy Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(20, 83, 45);
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
    doc.setTextColor(20, 83, 45);
    const certName = certification.certification;
    // Handle long text wrapping if necessary - simplistic split used here if needed, but centering typically handles
    doc.text(certName, centerX, 130, { align: "center" });

    // Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100);
    const dateStr = new Date(certification.certification_date).toLocaleDateString('en-US', {
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

    // Save
    const filename = `Certificate_${student.last_name}_${certification.studentcertification_id}.pdf`;
    doc.save(filename);
}
