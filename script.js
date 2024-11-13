// Initialize markdown converter
const converter = new showdown.Converter({
    tables: true,
    tasklists: true,
    strikethrough: true,
    ghCodeBlocks: true,
    emoji: true
});

// UI State Management
let currentPreviewMode = 'rendered';
let lastProcessedMarkdown = '';
let isProcessing = false;

// Example markdown content
const exampleMarkdown = `# The Complete Markdown Testing Guide

## Introduction
This is a **comprehensive** test document that showcases various *Markdown* features. Feel free to ***combine bold and italic*** formatting.

## Text Formatting
Here's a demonstration of different text styles:
- Regular text
- **Bold text**
- *Italic text*
- \`inline code\`

## Lists
### Unordered List
- First item
- Second item
  - Nested item 1
  - Nested item 2
- Third item

### Ordered List
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

[Click for more examples...]`;

// Initialize the editor
document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');

    // Enable clipboard operations
    markdownInput.addEventListener('paste', (e) => {
        e.stopPropagation();
    });

    // Add copy/paste keyboard shortcut handling
    markdownInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.stopPropagation();
        }
    });

    // Add button to copy example text
    const buttonGroup = document.querySelector('.button-group');
    const copyExampleBtn = document.createElement('button');
    copyExampleBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
        </svg>
        Load Example
    `;
    copyExampleBtn.className = 'tool-btn example-btn';
    copyExampleBtn.onclick = () => {
        markdownInput.value = exampleMarkdown;
        updatePreview(exampleMarkdown);
        showNotification('Example text loaded!');
    };
    buttonGroup.insertBefore(copyExampleBtn, buttonGroup.firstChild);

    // Add input listener for live preview
    markdownInput.addEventListener('input', debounce((e) => {
        updatePreview(e.target.value);
    }, 300));

    // Initialize preview
    updatePreview(markdownInput.value);
});

// Debounce function to limit preview updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Toolbar functionality
function insertMarkdown(prefix, suffix = '') {
    const textarea = document.getElementById('markdown-input');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    // Handle different cases (selection vs. no selection)
    if (start === end) {
        // No selection - insert placeholder
        const placeholder = getPlaceholderForMarkdown(prefix);
        const newText = text.substring(0, start) + prefix + placeholder + suffix + text.substring(end);
        textarea.value = newText;
        const cursorPosition = start + prefix.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition + placeholder.length);
    } else {
        // Text is selected - wrap it
        const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
        textarea.value = newText;
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }

    // Update preview
    updatePreview(textarea.value);
    textarea.focus();
}

// Get appropriate placeholder text for markdown syntax
function getPlaceholderForMarkdown(prefix) {
    switch (prefix) {
        case '**': return 'bold text';
        case '*': return 'italic text';
        case '# ': return 'heading';
        case '- ': return 'list item';
        case '> ': return 'quotation';
        case '[': return 'link text';
        case '```\n': return 'code';
        default: return 'text';
    }
}

// Preview functionality
function updatePreview(markdown) {
    if (markdown === lastProcessedMarkdown) return;
    lastProcessedMarkdown = markdown;

    const output = document.getElementById('output');
    const html = converter.makeHtml(markdown);

    if (currentPreviewMode === 'rendered') {
        output.innerHTML = html;
        output.className = 'preview-content rendered';
    } else {
        output.textContent = html;
        output.className = 'preview-content source';
    }
}

// Toggle preview mode
function togglePreview(mode) {
    currentPreviewMode = mode;
    const renderedBtn = document.getElementById('rendered-btn');
    const sourceBtn = document.getElementById('source-btn');

    if (mode === 'rendered') {
        renderedBtn.classList.add('active');
        sourceBtn.classList.remove('active');
    } else {
        sourceBtn.classList.add('active');
        renderedBtn.classList.remove('active');
    }

    updatePreview(document.getElementById('markdown-input').value);
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after delay
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Loading state management
function setLoading(isLoading) {
    isProcessing = isLoading;
    const buttons = document.querySelectorAll('.button-group button');
    buttons.forEach(button => {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    });
}

// Sanitize filename
function sanitizeFilename(text) {
    // Get first line of markdown as filename
    const firstLine = text.split('\n')[0]
        .replace(/^#*\s*/, '') // Remove heading markers
        .substring(0, 30); // Limit length

    return firstLine
        .replace(/[^a-zA-Z0-9-_\s]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase() || 'document'; // Default if empty
}

// Get file extension
function getExtension(format) {
    return format === 'html' ? '.html' :
        format === 'pdf' ? '.pdf' :
            format === 'docx' ? '.docx' :
                format === 'txt' ? '.txt' : '.rtf';
}

// Main conversion handler
async function convertAndDownload(format) {
    if (isProcessing) return;

    const markdown = document.getElementById('markdown-input').value;
    if (!markdown.trim()) {
        showNotification('Please enter some markdown text first', 'error');
        return;
    }

    setLoading(true);
    try {
        const filename = sanitizeFilename(markdown) + getExtension(format);
        let content;

        switch (format) {
            case 'html':
                content = await convertToHTML(markdown);
                break;
            case 'pdf':
                await convertToPDF(markdown, filename);
                setLoading(false);
                return; // PDF has its own download handling
            case 'docx':
                await convertToDocx(markdown, filename);
                setLoading(false);
                return; // DOCX has its own download handling
            case 'txt':
                content = convertToTxt(markdown);
                break;
            case 'rtf':
                content = convertToRTF(markdown);
                break;
            default:
                throw new Error('Unsupported format');
        }

        // Download the file
        const blob = new Blob([content], { type: getMimeType(format) });
        saveAs(blob, filename);
        showNotification(`Successfully converted to ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Conversion error:', error);
        showNotification(`Error converting to ${format.toUpperCase()}: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// HTML conversion
async function convertToHTML(markdown) {
    const html = converter.makeHtml(markdown);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sanitizeFilename(markdown)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #1a1a1a;
        }
        pre {
            background: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
        }
        code {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f6f8fa;
            padding: 2px 4px;
            border-radius: 3px;
        }
        blockquote {
            margin: 0;
            padding-left: 1em;
            border-left: 4px solid #ddd;
            color: #666;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f6f8fa;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
}

// PDF conversion
async function convertToPDF(markdown, filename) {
    const html = converter.makeHtml(markdown);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Split content into pages
    const lines = html.split('\n');
    let y = 10;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFont('helvetica');
    doc.setFontSize(12);

    for (const line of lines) {
        // Strip HTML tags for PDF
        const text = line.replace(/<[^>]*>/g, '').trim();
        if (!text) continue;

        // Handle page breaks
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 10;
        }

        // Add text with word wrap
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 10, y);
        y += (splitText.length * 7);
    }

    doc.save(filename);
}

// DOCX conversion
async function convertToDocx(markdown, filename) {
    const { Document, Paragraph, TextRun } = docx;
    const html = converter.makeHtml(markdown);

    // Convert HTML to paragraphs
    const lines = html.split('\n').filter(line => line.trim());
    const paragraphs = lines.map(line => {
        // Strip HTML tags and convert entities
        const text = line
            .replace(/<[^>]*>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();

        return new Paragraph({
            children: [
                new TextRun({
                    text,
                    size: 24 // 12pt
                })
            ]
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
}

// TXT conversion
function convertToTxt(markdown) {
    // Remove Markdown syntax
    return markdown
        .replace(/#{1,6}\s/g, '') // headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1') // italic
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // links
        .replace(/`([^`]+)`/g, '$1') // inline code
        .replace(/```[\s\S]*?```/g, '') // code blocks
        .replace(/^\s*[-*+]\s/gm, '• ') // bullet points
        .replace(/^\s*\d+\.\s/gm, '  ') // numbered lists
        .replace(/^\s*>/gm, '  ') // blockquotes
        .trim();
}

// RTF conversion
function convertToRTF(markdown) {
    const html = converter.makeHtml(markdown);
    let rtf = '{\\rtf1\\ansi\\deff0\n' +
        '{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}}\n' +
        '\\viewkind4\\uc1\\pard\\f0\\fs24\n';

    // Convert HTML to RTF
    rtf += html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n/g, '\\par\n') // Convert newlines
        .replace(/[\\{}]/g, '\\$&') // Escape RTF characters
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

    rtf += '}';
    return rtf;
}

// Get MIME type for file download
function getMimeType(format) {
    const mimeTypes = {
        'html': 'text/html',
        'txt': 'text/plain',
        'rtf': 'application/rtf',
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[format] || 'text/plain';
}

// Error handler for async operations
function handleError(error) {
    console.error('Error:', error);
    showNotification(error.message || 'An error occurred', 'error');
    setLoading(false);
}
