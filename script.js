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
const exampleMarkdown = `# The Totally Tubular Markdown Masterclass

## Greetings, Earthlings!
This is the **most bodacious**, *gnarly* test document that'll show you all the *killer* *Markdown* tricks. Time to **totally shred** some formatting!

## Radical Text Styles
Check out these **bodacious** text stylings, dude:
- Tubular regular text
- **Mega-rad bold text**
- *Gnarly italic text*
- \`Awesomely radical inline code\`

## Mondo Lists
### Tubular Unordered List
- First item, bro
- Second item
  - Bodacious nested item 1
  - Mondo nested item 2
- Third item, for sure

### Radical Ordered List
1. First step, righteous
2. Second step
   1. Sub-step A, for sure
   2. Sub-step B, gnarly
3. Third step, totally

## Mega-Sick Code
\`\`\`python
def shred_it():
    print("Cowabunga, dude!")
\`\`\`
[Click for more gnarly examples...](https://daringfireball.net/projects/markdown/)`;

// Example loader function
function loadExample() {
    const markdownInput = document.getElementById('markdown-input');
    markdownInput.value = exampleMarkdown;
    updatePreview(exampleMarkdown);
    updateWordAndCharCount();
    showNotification('Example text loaded!');
}

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
        updateWordAndCharCount();
    }, 300));

    // Initialize counts
    updateWordAndCharCount();

    // Add input listener for live preview
    markdownInput.addEventListener('input', debounce((e) => {
        updatePreview(e.target.value);
        updateWordAndCharCount();
    }, 300));

    // Initialize preview
    updatePreview(markdownInput.value);

    // Get all the formatting buttons
    const formatButtons = document.querySelectorAll('.formatting-tools button');

    // Map each button to its formatting function based on its text content
    formatButtons.forEach(button => {
        const symbol = button.textContent.trim();
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

    if (start === end) {
        const placeholder = getPlaceholderForMarkdown(prefix);
        const newText = text.substring(0, start) + prefix + placeholder + suffix + text.substring(end);
        textarea.value = newText;
        const cursorPosition = start + prefix.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition + placeholder.length);
    } else {
        const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
        textarea.value = newText;
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }

    updatePreview(textarea.value);
    updateWordAndCharCount();
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
    output.innerHTML = html;
}

// Word and character count functionality
function updateWordAndCharCount() {
    const text = document.getElementById('markdown-input').value;

    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    document.getElementById('word-count').textContent = wordCount;
    document.getElementById('char-count').textContent = charCount;
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

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
