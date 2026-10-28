import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonsProps {
  elementId: string;
  fileName?: string;
  disabled?: boolean;
}

export function PrintButtons({ elementId, fileName = "meeting", disabled }: PrintButtonsProps) {
  const handleScreenshot = async () => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        alert("Elemento não encontrado");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Download as PNG
      const link = document.createElement("a");
      link.download = `${fileName}-screenshot.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Erro ao gerar screenshot:", error);
      alert("Erro ao gerar screenshot");
    }
  };

  const handlePrintPDF = async () => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        alert("Elemento não encontrado");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "mm",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF");
    }
  };

  const handlePrint = () => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert("Elemento não encontrado");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup bloqueado. Permita popups para imprimir.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Reunião</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              padding: 20px;
              max-width: 210mm;
              margin: 0 auto;
            }
            @media print {
              body { padding: 0; }
            }
            img { max-width: 100%; height: auto; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleScreenshot}
        disabled={disabled}
        title="Baixar como imagem PNG"
      >
        <Download className="h-4 w-4 mr-2" />
        Screenshot
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrintPDF}
        disabled={disabled}
        title="Exportar como PDF"
      >
        <Download className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled}
        title="Imprimir documento"
      >
        <Printer className="h-4 w-4 mr-2" />
        Imprimir
      </Button>
    </div>
  );
}
