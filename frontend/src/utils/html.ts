/**
 * Extracts plain text from HTML content for preview.
 * Returns text before table, or after table if no text before, or "..." if no text at all.
 */
export function extractTextFromHTML(html: string): string {
	if (!html) return ''
	
	// Find first table position
	const tableMatch = html.match(/<table[^>]*>/i)
	
	if (tableMatch && tableMatch.index !== undefined) {
		const tableStartIndex = tableMatch.index
		
		// Extract text before table
		const textBefore = html.substring(0, tableStartIndex)
		
		// Find table end
		let tableEndIndex = tableStartIndex
		let depth = 0
		let inTable = false
		
		for (let i = tableStartIndex; i < html.length; i++) {
			if (html.substring(i).startsWith('<table')) {
				inTable = true
				depth++
				i += 6 // skip '<table'
			} else if (html.substring(i).startsWith('</table>')) {
				depth--
				if (depth === 0 && inTable) {
					tableEndIndex = i + 8 // '</table>'
					break
				}
				i += 7 // skip '</table'
			}
		}
		
		// Extract text after table
		const textAfter = html.substring(tableEndIndex)
		
		// Use text before table if it has content, otherwise use text after
		const textBeforeCleaned = textBefore
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ')
			.trim()
		
		const textAfterCleaned = textAfter
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ')
			.trim()
		
		// Return text before table if available, otherwise text after
		return textBeforeCleaned || textAfterCleaned
	}
	
	// No table found, extract all text
	const cleaned = html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim()
	
	return cleaned
}
