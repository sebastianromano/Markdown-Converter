// Initialize markdown converter
const converter = new showdown.Converter({
    tables: true,
    tasklists: true,
    strikethrough: true,
    ghCodeBlocks: true,
    emoji: true,
    noHeaderId: true,
    literalMidWordUnderscores: true,
    simplifiedAutoLink: true
});

// UI State Management
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
    const toolBar = document.querySelector('.formatting-tools');

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

    markdownInput.addEventListener('input', debounce(() => {
        updatePreview(markdownInput.value);
        updateWordAndCharCount(); // Add this line
    }, 300));

    // Initialize counts
    updateWordAndCharCount();

    // Add button to copy example text
    const exampleBtn = document.createElement('div');
    exampleBtn.className = 'toolbar-divider';
    toolBar.appendChild(exampleBtn);

    const copyExampleBtn = document.createElement('button');
    copyExampleBtn.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24">
        <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
    </svg>
`;
    copyExampleBtn.className = 'tool-btn';
    copyExampleBtn.title = 'Load Example';
    copyExampleBtn.onclick = () => {
        markdownInput.value = exampleMarkdown;
        updatePreview(exampleMarkdown);
        updateWordAndCharCount();
        showNotification('Example text loaded!');
    };
    toolBar.appendChild(copyExampleBtn);

    // Add input listener for live preview
    markdownInput.addEventListener('input', debounce((e) => {
        updatePreview(e.target.value);
    }, 300));

    // Initialize preview
    updatePreview(markdownInput.value);

    // Get all the formatting buttons by their SVG paths
    const formatButtons = document.querySelectorAll('.formatting-tools button');

    // Map each button to its formatting function based on the SVG path
    formatButtons.forEach(button => {
        const path = button.querySelector('path');
        if (!path) return;

        const d = path.getAttribute('d');

        // Match the SVG path to determine which formatting to apply
        switch (d) {
            // Bold
            case 'M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z':
                button.addEventListener('click', () => insertMarkdown('**', '**'));
                break;

            // Italic
            case 'M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z':
                button.addEventListener('click', () => insertMarkdown('*', '*'));
                break;

            // Heading
            case 'M3,4H5V10H9V4H11V18H9V12H5V18H3V4M13,8H15.31L15.63,6H17.63L17.31,8H19V10H17.1L16.9,11H19V13H16.71L16.39,15H14.39L14.71,13H13V11H14.9L15.1,10H13V8M15.71,10L15.5,11H16.5L16.71,10H15.71Z':
                button.addEventListener('click', () => insertMarkdown('# ', ''));
                break;

            // Unordered list
            case 'M3,4H21V6H3V4M3,11H21V13H3V11M3,18H21V20H3V18Z':
                button.addEventListener('click', () => insertMarkdown('- ', ''));
                break;

            // Quote
            case 'M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z':
                button.addEventListener('click', () => insertMarkdown('> ', ''));
                break;

            // Link
            case 'M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z':
                button.addEventListener('click', () => insertMarkdown('[', '](url)'));
                break;

            // Code
            case 'M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z':
                button.addEventListener('click', () => insertMarkdown('```\n', '\n```'));
                break;
        }
    });
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
    output.innerHTML = sanitizedHtml;
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
    const firstLine = text.split('\n')[0]
        .replace(/^#*\s*/, '')
        .substring(0, 30);

    return firstLine
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase() || 'document';
}

// Get file extension
function getExtension(format) {
    return '.' + (format || 'rtf');
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
            case 'odt':
                await convertToOdt(markdown, filename);
                setLoading(false);
                return;
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
    const html = converter.makeHtml(markdown)
        .replace(/\\'/g, "'");  // Remove unnecessary escaping of apostrophes

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
        ul ul, ol ol, ul ol, ol ul {
            margin-left: 20px;
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

// TXT conversion
function convertToTxt(markdown) {
    const html = converter.makeHtml(markdown);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function processNode(node, level = 0, listIndex = 0) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const indent = '  '.repeat(level);
            let result = '';

            switch (node.tagName.toLowerCase()) {
                case 'h1':
                    return `\n${node.textContent}\n${'='.repeat(node.textContent.length)}\n`;
                case 'h2':
                    return `\n${node.textContent}\n${'-'.repeat(node.textContent.length)}\n`;
                case 'h3':
                    return `\n${node.textContent}\n`;
                case 'p':
                    return `\n${processChildren(node)}\n`;
                case 'ul':
                    return '\n' + Array.from(node.children)
                        .map(li => `${indent}• ${processNode(li, level + 1)}`)
                        .join('\n');
                case 'ol':
                    return '\n' + Array.from(node.children)
                        .map((li, idx) => {
                            const number = (idx + 1).toString().padStart(2) + '.';
                            return `${indent}${number} ${processNode(li, level + 1)}`;
                        })
                        .join('\n');
                case 'li':
                    return processChildren(node);
                case 'code':
                    return `\`${node.textContent}\``;
                case 'pre':
                    const codeIndent = indent + '    ';
                    return `\n${codeIndent}${node.textContent.split('\n').join(`\n${codeIndent}`)}\n`;
                default:
                    return processChildren(node);
            }
        }
        return '';
    }

    function processChildren(node) {
        return Array.from(node.childNodes)
            .map(child => processNode(child))
            .join('');
    }

    let text = processNode(doc.body)
        .trim()
        .replace(/\n{3,}/g, '\n\n');  // Remove excess newlines

    return text;
}

// RTF conversion
function convertToRTF(markdown) {
    let html = converter.makeHtml(markdown);

    // RTF header with font definitions
    let rtf = '{\\rtf1\\ansi\\deff0\\nouicompat\n' +
        '{\\fonttbl{\\f0\\fswiss\\fcharset0 Helvetica;}{\\f1\\fmodern\\fcharset0 Courier New;}}\n' +
        '{\\colortbl;\\red0\\green0\\blue0;\\red100\\green100\\blue100;}\n' +
        '\\viewkind4\\uc1\\pard\\sa200\\sl276\\slmult1\\f0\\fs24\n';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function processNode(node, level = 0) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent
                .replace(/[\\{}]/g, '\\$&')
                .replace(/\n/g, '\\par\n');
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            let content = Array.from(node.childNodes)
                .map(n => processNode(n, level + 1))
                .join('');

            switch (node.tagName.toLowerCase()) {
                case 'h1':
                    return `\\pard\\sa200\\sl276\\slmult1\\f0\\fs40\\b ${content}\\b0\\fs24\\par\n`;
                case 'h2':
                    return `\\pard\\sa200\\sl276\\slmult1\\f0\\fs32\\b ${content}\\b0\\fs24\\par\n`;
                case 'h3':
                    return `\\pard\\sa200\\sl276\\slmult1\\f0\\fs28\\b ${content}\\b0\\fs24\\par\n`;
                case 'p':
                    return `\\pard\\sa200\\sl276\\slmult1 ${content}\\par\n`;
                case 'ul':
                    return Array.from(node.children)
                        .map((li, index) => `\\pard\\li${(level + 1) * 360}\\fi-360{\\*\\pn\\pnlvlblt\\pnf1\\pnindent0{\\pntxtb\\bullet}}${processNode(li, level + 1)}\\par\n`)
                        .join('');
                case 'ol':
                    return Array.from(node.children)
                        .map((li, index) => `\\pard\\li${(level + 1) * 360}\\fi-360{\\*\\pn\\pnlvlnumber\\pnf1\\pnindent0{\\pntxta.}}${index + 1}. ${processNode(li, level + 1)}\\par\n`)
                        .join('');
                case 'li':
                    return content;
                case 'code':
                    return `\\f1 ${content}\\f0 `;
                case 'pre':
                    return `\\pard\\sa200\\sl276\\slmult1\\f1\\fs20 ${content}\\f0\\fs24\\par\n`;
                case 'strong':
                case 'b':
                    return `\\b ${content}\\b0 `;
                case 'em':
                case 'i':
                    return `\\i ${content}\\i0 `;
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

// ODT conversion
async function convertToOdt(markdown, filename) {
    const html = converter.makeHtml(markdown);
    const zip = new JSZip();

    // Add mimetype file (must be first and uncompressed)
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: "STORE" });

    // Add manifest
    const manifest = `<?xml version="1.0" encoding="UTF-8"?>
        <manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
            <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
            <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
            <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
            <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
        </manifest:manifest>`;

    zip.folder('META-INF').file('manifest.xml', manifest);

    // Add styles
    const styles = `<?xml version="1.0" encoding="UTF-8"?>
    <office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                           xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                           xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                           xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0">
        <office:styles>
            <style:style style:name="Standard" style:family="paragraph" style:class="text">
                <style:paragraph-properties fo:margin-top="0.247cm" fo:margin-bottom="0.247cm"/>
            </style:style>
            <style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard">
                <style:paragraph-properties fo:margin-top="0.423cm" fo:margin-bottom="0.212cm"/>
                <style:text-properties fo:font-weight="bold"/>
            </style:style>
            <style:style style:name="Heading_1" style:family="paragraph" style:parent-style-name="Heading">
                <style:paragraph-properties fo:margin-top="0.847cm" fo:margin-bottom="0.423cm"/>
                <style:text-properties fo:font-size="18pt"/>
            </style:style>
            <style:style style:name="Heading_2" style:family="paragraph" style:parent-style-name="Heading">
                <style:paragraph-properties fo:margin-top="0.635cm" fo:margin-bottom="0.318cm"/>
                <style:text-properties fo:font-size="16pt"/>
            </style:style>
            <style:style style:name="Heading_3" style:family="paragraph" style:parent-style-name="Heading">
                <style:paragraph-properties fo:margin-top="0.423cm" fo:margin-bottom="0.212cm"/>
                <style:text-properties fo:font-size="14pt"/>
            </style:style>

            <text:list-style style:name="BulletList">
                <text:list-level-style-bullet text:level="1" text:style-name="Bullet_20_Symbols" style:num-suffix="." text:bullet-char="•">
                    <style:list-level-properties text:space-before="0.25in" text:min-label-width="0.25in"/>
                    <style:text-properties style:font-name="OpenSymbol"/>
                </text:list-level-style-bullet>
            </text:list-style>

            <text:list-style style:name="NumberedList">
                <text:list-level-style-number text:level="1" text:style-name="Numbering_20_Symbols" style:num-suffix="." style:num-format="1">
                    <style:list-level-properties text:space-before="0.25in" text:min-label-width="0.25in"/>
                </text:list-level-style-number>
            </text:list-style>

            <style:style style:name="Source_Text" style:family="text">
                <style:text-properties style:font-name="Courier New" fo:background-color="#F8F9FA"/>
            </style:style>
            <style:style style:name="Preformatted_Text" style:family="paragraph">
                <style:paragraph-properties fo:margin-left="1cm" fo:margin-right="1cm"/>
                <style:text-properties style:font-name="Courier New" fo:background-color="#F8F9FA"/>
            </style:style>
            <style:style style:name="Bold" style:family="text">
                <style:text-properties fo:font-weight="bold"/>
            </style:style>
            <style:style style:name="Italic" style:family="text">
                <style:text-properties fo:font-style="italic"/>
            </style:style>
        </office:styles>
    </office:document-styles>`;

    zip.file('styles.xml', styles);

    // Convert HTML to ODT content
    const content = `<?xml version="1.0" encoding="UTF-8"?>
        <office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                               xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                               xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0">
            <office:body>
                <office:text>
                    ${convertHtmlToOdt(html)}
                </office:text>
            </office:body>
        </office:document-content>`;

    zip.file('content.xml', content);

    // Generate ODT file
    const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.oasis.opendocument.text",
        compression: "DEFLATE"
    });

    // Download the file
    saveAs(blob, filename);
}

// Helper function to convert HTML to ODT
function convertHtmlToOdt(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let odtContent = '';

    function processNode(node, level = 0) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim() ?
                `<text:span>${escapeXml(node.textContent)}</text:span>` :
                escapeXml(node.textContent);
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const content = Array.from(node.childNodes)
                .map(n => processNode(n, level))
                .join('');

            switch (node.tagName.toLowerCase()) {
                case 'h1':
                    return `<text:h text:style-name="Heading_1" text:outline-level="1">${content}</text:h>\n`;
                case 'h2':
                    return `<text:h text:style-name="Heading_2" text:outline-level="2">${content}</text:h>\n`;
                case 'h3':
                    return `<text:h text:style-name="Heading_3" text:outline-level="3">${content}</text:h>\n`;
                case 'p':
                    return `<text:p text:style-name="Standard">${content}</text:p>\n`;
                case 'strong':
                case 'b':
                    return `<text:span text:style-name="Bold">${content}</text:span>`;
                case 'em':
                case 'i':
                    return `<text:span text:style-name="Italic">${content}</text:span>`;
                case 'ul':
                    return `<text:list text:style-name="BulletList">
                        ${Array.from(node.children).map(li => processNode(li)).join('')}
                    </text:list>\n`;
                case 'ol':
                    return `<text:list text:style-name="NumberedList">
                        ${Array.from(node.children).map(li => processNode(li)).join('')}
                    </text:list>\n`;
                case 'li':
                    return `<text:list-item><text:p>${content}</text:p></text:list-item>`;
                case 'code':
                    return `<text:span text:style-name="Source_Text">${escapeXml(node.textContent)}</text:span>`;
                case 'pre':
                    return `<text:p text:style-name="Preformatted_Text">${escapeXml(node.textContent)}</text:p>\n`;
                default:
                    return content;
            }
        }
        return '';
    }

    // Process each child node of the body
    Array.from(doc.body.childNodes).forEach(node => {
        odtContent += processNode(node);
    });

    return odtContent;
}

// Helper function to escape XML special characters
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Get MIME type for file download
function getMimeType(format) {
    const mimeTypes = {
        'html': 'text/html',
        'txt': 'text/plain',
        'rtf': 'application/rtf',
        'pdf': 'application/pdf',
        'odt': 'application/vnd.oasis.opendocument.text'
    };
    return mimeTypes[format] || 'text/plain';
}

// Error handler for async operations
function handleError(error) {
    console.error('Error:', error);
    showNotification(error.message || 'An error occurred', 'error');
    setLoading(false);
}

function updateWordAndCharCount() {
    const text = document.getElementById('markdown-input').value;

    // Calculate character count (including spaces)
    const charCount = text.length;

    // Calculate word count
    // This regex splits on whitespace and handles various edge cases
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // Update the display
    document.getElementById('word-count').textContent = wordCount;
    document.getElementById('char-count').textContent = charCount;
}
