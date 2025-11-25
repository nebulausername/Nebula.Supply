/**
 * Utility functions for exporting data to various formats
 */

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData, filename: string = 'export'): void {
  const { headers, rows, title, metadata } = data;
  
  let csvContent = '';
  
  // Add title if provided
  if (title) {
    csvContent += `${title}\n`;
  }
  
  // Add metadata if provided
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      csvContent += `${key}: ${value}\n`;
    });
    csvContent += '\n';
  }
  
  // Add headers
  csvContent += headers.join(',') + '\n';
  
  // Add rows
  rows.forEach(row => {
    // Escape commas and quotes in cell values
    const escapedRow = row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    });
    csvContent += escapedRow.join(',') + '\n';
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any, filename: string = 'export'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF using browser print functionality
 * Note: For more advanced PDF generation, consider using libraries like jsPDF or pdfmake
 */
export function exportToPDF(data: ExportData, filename: string = 'export'): void {
  // Create a temporary HTML element for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Use console.error here as logger might not be available in utility function
    // This is a critical error that needs immediate user feedback
    if (typeof window !== 'undefined' && window.console) {
      console.error('Failed to open print window. Please allow popups.');
    }
    return;
  }
  
  const { headers, rows, title, metadata } = data;
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Export'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #000;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .metadata {
          margin-bottom: 20px;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
  `;
  
  if (title) {
    htmlContent += `<h1>${title}</h1>`;
  }
  
  if (metadata) {
    htmlContent += '<div class="metadata">';
    Object.entries(metadata).forEach(([key, value]) => {
      htmlContent += `<strong>${key}:</strong> ${value}<br>`;
    });
    htmlContent += '</div>';
  }
  
  htmlContent += '<table>';
  htmlContent += '<thead><tr>';
  headers.forEach(header => {
    htmlContent += `<th>${header}</th>`;
  });
  htmlContent += '</tr></thead>';
  htmlContent += '<tbody>';
  
  rows.forEach(row => {
    htmlContent += '<tr>';
    row.forEach(cell => {
      htmlContent += `<td>${cell}</td>`;
    });
    htmlContent += '</tr>';
  });
  
  htmlContent += '</tbody></table>';
  htmlContent += '</body></html>';
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Optionally close the window after printing
      // printWindow.close();
    }, 250);
  };
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

