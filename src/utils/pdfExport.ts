// =========================================
// PDF EXPORT SERVICE
// Professional PDF generation for meeting minutes
// =========================================

import jsPDF from 'jspdf';
import type { MinutesTemplate } from './minutesTemplates';

interface PDFMeeting {
  title: string;
  date: string;
  time?: string;
  location?: string;
  participants?: Array<{
    name: string;
    role?: string;
  }>;
  transcription?: string;
  ai_summary?: {
    resumo?: string;
    pontos_principais?: string[];
    decisoes?: string[];
    tarefas?: Array<{
      titulo: string;
      responsavel?: string;
      prazo?: string;
    }>;
    proximos_passos?: string[];
  };
  minutes_status?: string;
  approved_at?: string;
  approved_by?: string;
  tags?: string[];
  template_type?: string;
  project_name?: string;
  client_name?: string;
}

interface PDFOptions {
  includeTranscription?: boolean;
  includeSignatures?: boolean;
  companyName?: string;
  companyLogo?: string;
  footerText?: string;
}

// =========================================
// PDF GENERATOR
// =========================================

export const generateMinutesPDF = (
  meeting: PDFMeeting,
  template: MinutesTemplate,
  options: PDFOptions = {}
): void => {
  const {
    includeTranscription = true,
    includeSignatures = true,
    companyName = 'Lumina AI ERP',
    footerText = 'Documento gerado automaticamente'
  } = options;

  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPosition = 20;
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // =========================================
  // HEADER
  // =========================================

  // Company name
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(companyName, margin, yPosition);
  yPosition += 10;

  // Document title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${template.icon} ${template.name}`, margin, yPosition);
  yPosition += 10;

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // =========================================
  // MEETING INFO
  // =========================================

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(meeting.title, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  const meetingDate = new Date(meeting.date).toLocaleDateString('pt-BR', {
    dateStyle: 'full'
  });
  doc.text(`Data: ${meetingDate}`, margin, yPosition);
  yPosition += 5;

  if (meeting.time) {
    doc.text(`Horário: ${meeting.time}`, margin, yPosition);
    yPosition += 5;
  }

  if (meeting.location) {
    doc.text(`Local: ${meeting.location}`, margin, yPosition);
    yPosition += 5;
  }

  if (meeting.project_name) {
    doc.text(`Projeto: ${meeting.project_name}`, margin, yPosition);
    yPosition += 5;
  }

  if (meeting.client_name) {
    doc.text(`Cliente: ${meeting.client_name}`, margin, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Status badge
  if (meeting.minutes_status) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let statusColor: [number, number, number] = [128, 128, 128];
    let statusText = meeting.minutes_status.toUpperCase();
    
    switch (meeting.minutes_status) {
      case 'approved':
        statusColor = [34, 197, 94]; // green
        statusText = '✓ APROVADA';
        break;
      case 'in_review':
        statusColor = [59, 130, 246]; // blue
        statusText = '◷ EM REVISÃO';
        break;
      case 'draft':
        statusColor = [156, 163, 175]; // gray
        statusText = '✎ RASCUNHO';
        break;
      case 'archived':
        statusColor = [107, 114, 128]; // darker gray
        statusText = '📁 ARQUIVADA';
        break;
    }
    
    doc.setTextColor(...statusColor);
    doc.text(statusText, margin, yPosition);
    yPosition += 8;
  }

  // Tags
  if (meeting.tags && meeting.tags.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tags: ${meeting.tags.join(', ')}`, margin, yPosition);
    yPosition += 8;
  }

  doc.setTextColor(0, 0, 0);

  // Check for new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // =========================================
  // PARTICIPANTS
  // =========================================

  if (meeting.participants && meeting.participants.length > 0) {
    checkNewPage(40);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Participantes', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    meeting.participants.forEach((p, idx) => {
      checkNewPage(10);
      const participantText = `${idx + 1}. ${p.name}${p.role ? ` - ${p.role}` : ''}`;
      doc.text(participantText, margin + 5, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  // =========================================
  // AI SUMMARY
  // =========================================

  if (meeting.ai_summary) {
    const summary = meeting.ai_summary;

    // Executive Summary
    if (summary.resumo) {
      checkNewPage(50);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Executivo', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const resumoLines = doc.splitTextToSize(summary.resumo, contentWidth);
      resumoLines.forEach((line: string) => {
        checkNewPage(10);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      yPosition += 5;
    }

    // Key Points
    if (summary.pontos_principais && summary.pontos_principais.length > 0) {
      checkNewPage(40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Pontos Principais', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      summary.pontos_principais.forEach((ponto, idx) => {
        checkNewPage(15);
        const pontoLines = doc.splitTextToSize(`${idx + 1}. ${ponto}`, contentWidth - 5);
        pontoLines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });

      yPosition += 5;
    }

    // Decisions
    if (summary.decisoes && summary.decisoes.length > 0) {
      checkNewPage(40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Decisões Tomadas', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      summary.decisoes.forEach((decisao, idx) => {
        checkNewPage(15);
        const decisaoLines = doc.splitTextToSize(`${idx + 1}. ${decisao}`, contentWidth - 5);
        decisaoLines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });

      yPosition += 5;
    }

    // Tasks
    if (summary.tarefas && summary.tarefas.length > 0) {
      checkNewPage(40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Tarefas e Responsáveis', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      summary.tarefas.forEach((tarefa, idx) => {
        checkNewPage(20);
        doc.text(`${idx + 1}. ${tarefa.titulo}`, margin + 5, yPosition);
        yPosition += 5;
        
        if (tarefa.responsavel) {
          doc.setTextColor(80, 80, 80);
          doc.text(`   Responsável: ${tarefa.responsavel}`, margin + 8, yPosition);
          yPosition += 5;
        }
        
        if (tarefa.prazo) {
          doc.setTextColor(80, 80, 80);
          doc.text(`   Prazo: ${tarefa.prazo}`, margin + 8, yPosition);
          yPosition += 5;
        }
        
        doc.setTextColor(0, 0, 0);
      });

      yPosition += 5;
    }

    // Next Steps
    if (summary.proximos_passos && summary.proximos_passos.length > 0) {
      checkNewPage(40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Próximos Passos', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      summary.proximos_passos.forEach((passo, idx) => {
        checkNewPage(15);
        const passoLines = doc.splitTextToSize(`${idx + 1}. ${passo}`, contentWidth - 5);
        passoLines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });

      yPosition += 5;
    }
  }

  // =========================================
  // TRANSCRIPTION
  // =========================================

  if (includeTranscription && meeting.transcription) {
    checkNewPage(40);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Transcrição Completa', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const transcriptionLines = doc.splitTextToSize(meeting.transcription, contentWidth);
    transcriptionLines.forEach((line: string) => {
      checkNewPage(8);
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
  }

  // =========================================
  // SIGNATURES
  // =========================================

  if (includeSignatures) {
    checkNewPage(60);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Aprovação', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (meeting.minutes_status === 'approved' && meeting.approved_at) {
      const approvedDate = new Date(meeting.approved_at).toLocaleString('pt-BR');
      doc.text(`Aprovada em: ${approvedDate}`, margin, yPosition);
      yPosition += 6;
      
      if (meeting.approved_by) {
        doc.text(`Aprovada por: ${meeting.approved_by}`, margin, yPosition);
        yPosition += 6;
      }
    } else {
      // Signature lines
      yPosition += 10;
      doc.line(margin, yPosition, margin + 70, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.text('Assinatura do Responsável', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.line(margin, yPosition, margin + 70, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.text('Data', margin, yPosition);
    }
  }

  // =========================================
  // FOOTER
  // =========================================

  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(footerText, margin, pageHeight - 15);
    
    // Page number
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin - 30,
      pageHeight - 15
    );
    
    // Generation date
    const generatedDate = new Date().toLocaleDateString('pt-BR');
    doc.text(
      `Gerado em: ${generatedDate}`,
      pageWidth / 2 - 20,
      pageHeight - 15
    );
  }

  // =========================================
  // SAVE PDF
  // =========================================

  const fileName = `Ata_${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

// =========================================
// HELPER: Quick PDF export
// =========================================

export const exportMeetingToPDF = (
  meeting: PDFMeeting,
  template: MinutesTemplate,
  options?: PDFOptions
): void => {
  try {
    generateMinutesPDF(meeting, template, options);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Falha ao gerar PDF. Verifique os dados da reunião.');
  }
};
