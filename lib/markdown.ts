/**
 * Tiny markdown → HTML renderer. Just enough features for the CMS:
 *   # / ## / ### headings, **bold**, *italic*, `code`, [links](url),
 *   - bullets, 1. numbered lists, blockquotes, code fences, --- hr, paragraphs.
 *
 * Sanitization: every input HTML char escapes BEFORE we inject markdown
 * structure, so user-typed `<script>` is rendered as text.
 */
function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g,           '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,         '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

export function md(input: string): string {
  if (!input) return ''
  const lines = input.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  let inCode = false
  let codeLang = ''
  let codeBuf: string[] = []
  let listStack: ('ul'|'ol')[] = []

  function closeLists() {
    while (listStack.length) out.push(`</${listStack.pop()}>`)
  }

  while (i < lines.length) {
    const line = lines[i]

    // code fence
    if (line.trim().startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code data-lang="${esc(codeLang)}">${esc(codeBuf.join('\n'))}</code></pre>`)
        codeBuf = []
        codeLang = ''
        inCode = false
      } else {
        closeLists()
        codeLang = line.trim().slice(3).trim()
        inCode = true
      }
      i++; continue
    }
    if (inCode) { codeBuf.push(line); i++; continue }

    // blank → close lists, paragraph break
    if (!line.trim()) { closeLists(); i++; continue }

    // hr
    if (/^---+\s*$/.test(line)) { closeLists(); out.push('<hr>'); i++; continue }

    // headings
    const h = /^(#{1,6})\s+(.*)/.exec(line)
    if (h) { closeLists(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue }

    // blockquote
    if (line.startsWith('> ')) { closeLists(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); i++; continue }

    // unordered list
    if (/^[-*]\s+/.test(line)) {
      if (listStack[listStack.length - 1] !== 'ul') { closeLists(); out.push('<ul>'); listStack.push('ul') }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`); i++; continue
    }

    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (listStack[listStack.length - 1] !== 'ol') { closeLists(); out.push('<ol>'); listStack.push('ol') }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`); i++; continue
    }

    // paragraph (collect consecutive non-special lines)
    closeLists()
    const para: string[] = [line]
    let j = i + 1
    while (j < lines.length && lines[j].trim() && !/^(#{1,6}|\s*[-*]\s+|\d+\.\s+|>\s|```|---)/.test(lines[j])) {
      para.push(lines[j]); j++
    }
    out.push(`<p>${inline(para.join('\n').replace(/\n/g, '<br>'))}</p>`)
    i = j
  }
  closeLists()
  if (inCode) out.push(`<pre><code data-lang="${esc(codeLang)}">${esc(codeBuf.join('\n'))}</code></pre>`)
  return out.join('\n')
}
