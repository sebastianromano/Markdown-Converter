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

// PDF conversion using html2pdf
async function convertToPDF(markdown, filename) {
    const htmlContent = converter.makeHtml(markdown);
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.width = '800px';
    container.style.margin = '0 auto';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.lineHeight = '1.6';
    container.style.color = '#1a1a1a';

    // Apply styles to container
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        h1, h2, h3 { margin-top: 1em; }
        pre { background: #f6f8fa; padding: 1em; border-radius: 4px; }
        code { font-family: Monaco, Menlo, monospace; }
        blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 1em; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
    `;
    container.appendChild(styleSheet);

    const opt = {
        margin: [10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            letterRendering: true,
            useCORS: true
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    try {
        await html2pdf().set(opt).from(container).save();
        showNotification('PDF generated successfully!');
    } catch (error) {
        throw new Error('PDF generation failed: ' + error.message);
    }
}

// DOCX conversion
async function convertToDocx(markdown, filename) {
    const html = converter.makeHtml(markdown);

    // Create a document with proper styling
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: []
        }]
    });

    // Parse HTML and convert to DOCX elements
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, 'text/html');
    const body = htmlDoc.body;

    // Convert HTML elements to DOCX paragraphs
    const children = [];
    body.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const style = getDocxStyle(node.tagName.toLowerCase());
            children.push(new docx.Paragraph({
                text: node.textContent,
                ...style
            }));
        }
    });

    doc.addSection({
        children: children
    });

    // Generate and download
    const buffer = await docx.Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, filename);
}

// Helper function for DOCX styles
function getDocxStyle(tag) {
    const styles = {
        h1: { heading: docx.HeadingLevel.HEADING_1, size: 32 },
        h2: { heading: docx.HeadingLevel.HEADING_2, size: 26 },
        h3: { heading: docx.HeadingLevel.HEADING_3, size: 22 },
        p: { size: 24 },
        pre: { font: 'Courier New', size: 20 },
        blockquote: { indent: { left: 720 }, size: 24 }
    };
    return styles[tag] || { size: 24 };
}

// TXT conversion remains the same
function convertToTxt(markdown) {
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

// Improved RTF conversion
function convertToRTF(markdown) {
    let html = converter.makeHtml(markdown);

    // RTF header
    let rtf = '{\\rtf1\\ansi\\deff0\\nouicompat\n' +
        '{\\fonttbl{\\f0\\fswiss\\fcharset0 Helvetica;}{\\f1\\fmodern\\fcharset0 Courier New;}}\n' +
        '{\\colortbl;\\red0\\green0\\blue0;\\red100\\green100\\blue100;}\n' +
        '\\viewkind4\\uc1\\pard\\sa200\\sl276\\slmult1\\f0\\fs24\n';

    // Convert HTML to RTF
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent
                .replace(/[\\{}]/g, '\\$&')
                .replace(/\n/g, '\\par\n');
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            let content = Array.from(node.childNodes).map(processNode).join('');

            switch (node.tagName.toLowerCase()) {
                case 'h1':
                    return `\\pard\\sa200\\sl276\\slmult1\\f0\\fs48\\b ${content}\\b0\\fs24\\par\n`;
                case 'h2':
                    return `\\pard\\sa200\\sl276\\slmult1\\f0\\fs36\\b ${content}\\b0\\fs24\\par\n`;
                case 'h3':
                    return `\\pard\\sa200\\sl276\\slmult1\\f0\\fs32\\b ${content}\\b0\\fs24\\par\n`;
                case 'p':
                    return `\\pard\\sa200\\sl276\\slmult1 ${content}\\par\n`;
                case 'pre':
                    return `\\pard\\sa200\\sl276\\slmult1\\f1\\fs20 ${content}\\f0\\fs24\\par\n`;
                case 'code':
                    return `\\f1 ${content}\\f0 `;
                case 'strong':
                case 'b':
                    return `\\b ${content}\\b0 `;
                case 'em':
                case 'i':
                    return `\\i ${content}\\i0 `;
                case 'blockquote':
                    return `\\pard\\sa200\\sl276\\slmult1\\li720 ${content}\\par\n`;
                default:
                    return content;
            }
        }
        return '';
    }

    rtf += processNode(doc.body);
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
