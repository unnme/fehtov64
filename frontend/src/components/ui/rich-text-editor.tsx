import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExtension from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	Heading3,
	Link as LinkIcon,
	Table as TableIcon,
	Undo,
	Redo,
	Image as ImageIcon,
	ArrowUp,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	X,
	Trash2
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
	content: string
	onChange: (content: string) => void
	placeholder?: string
	className?: string
}

export const RichTextEditor = ({
	content = '',
	onChange,
	placeholder = 'Введите текст...',
	className
}: RichTextEditorProps) => {
	const [isInTable, setIsInTable] = useState(false)

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3]
				}
			}),
			UnderlineExtension,
			Table.configure({
				resizable: true
			}),
			TableRow,
			TableCell,
			TableHeader,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-primary underline'
				}
			}),
			Image.configure({
				inline: true,
				HTMLAttributes: {
					class: 'max-w-full h-auto rounded-md'
				}
			}),
			Placeholder.configure({
				placeholder
			})
		],
		content: content || '',
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML())
		},
		onSelectionUpdate: ({ editor }) => {
			setIsInTable(editor.isActive('table'))
		},
		editorProps: {
			attributes: {
				class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-50 max-w-none px-4 py-3'
			}
		}
	})

	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content || '')
		}
		if (editor) {
			setIsInTable(editor.isActive('table'))
		}
	}, [content, editor])

	if (!editor) {
		return (
			<div className={cn('border rounded-md', className)}>
				<div className="min-h-50 flex items-center justify-center text-muted-foreground">
					Загрузка редактора...
				</div>
			</div>
		)
	}

	const ToolbarButton = ({
		onClick,
		isActive = false,
		disabled = false,
		children,
		title
	}: {
		onClick: () => void
		isActive?: boolean
		disabled?: boolean
		children: React.ReactNode
		title?: string
	}) => (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'h-8 w-8',
				isActive && 'bg-muted'
			)}
			title={title}
		>
			{children}
		</Button>
	)

	const addLink = () => {
		const url = window.prompt('Введите URL:')
		if (url) {
			editor.chain().focus().setLink({ href: url }).run()
		}
	}

	const addImage = () => {
		const url = window.prompt('Введите URL изображения:')
		if (url) {
			editor.chain().focus().setImage({ src: url }).run()
		}
	}

	return (
		<div className={cn('border rounded-md', className)}>
			<div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					isActive={editor.isActive('bold')}
					title="Жирный (Ctrl+B)"
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					isActive={editor.isActive('italic')}
					title="Курсив (Ctrl+I)"
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					isActive={editor.isActive('underline')}
					title="Подчеркивание (Ctrl+U)"
				>
					<Underline className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					isActive={editor.isActive('strike')}
					title="Зачеркнутый"
				>
					<Strikethrough className="h-4 w-4" />
				</ToolbarButton>

				<div className="w-px h-6 bg-border mx-1" />

				<ToolbarButton
					onClick={() => {
						if (editor.isActive('heading', { level: 1 })) {
							editor.chain().focus().setParagraph().run()
						} else {
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
					}}
					isActive={editor.isActive('heading', { level: 1 })}
					title="Заголовок 1"
				>
					<Heading1 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => {
						if (editor.isActive('heading', { level: 2 })) {
							editor.chain().focus().setParagraph().run()
						} else {
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
					}}
					isActive={editor.isActive('heading', { level: 2 })}
					title="Заголовок 2"
				>
					<Heading2 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => {
						if (editor.isActive('heading', { level: 3 })) {
							editor.chain().focus().setParagraph().run()
						} else {
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
					}}
					isActive={editor.isActive('heading', { level: 3 })}
					title="Заголовок 3"
				>
					<Heading3 className="h-4 w-4" />
				</ToolbarButton>

				<div className="w-px h-6 bg-border mx-1" />

				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					isActive={editor.isActive('bulletList')}
					title="Маркированный список"
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					isActive={editor.isActive('orderedList')}
					title="Нумерованный список"
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>

				<div className="w-px h-6 bg-border mx-1" />

				<ToolbarButton
					onClick={addLink}
					isActive={editor.isActive('link')}
					title="Добавить ссылку"
				>
					<LinkIcon className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={addImage}
					title="Добавить изображение"
				>
					<ImageIcon className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
					title="Вставить таблицу"
				>
					<TableIcon className="h-4 w-4" />
				</ToolbarButton>

				<div className="w-px h-6 bg-border mx-1" />

				<ToolbarButton
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					title="Отменить (Ctrl+Z)"
				>
					<Undo className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					title="Повторить (Ctrl+Y)"
				>
					<Redo className="h-4 w-4" />
				</ToolbarButton>
			</div>
			{isInTable && (
				<div className="flex items-center gap-1 p-2 border-t border-border bg-muted/30">
					<span className="text-xs text-muted-foreground mr-2">Управление таблицей:</span>
					<ToolbarButton
						onClick={() => editor.chain().focus().addRowBefore().run()}
						title="Добавить строку выше"
					>
						<ArrowUp className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().addRowAfter().run()}
						title="Добавить строку ниже"
					>
						<ArrowDown className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().deleteRow().run()}
						title="Удалить строку"
						disabled={!editor.can().deleteRow()}
					>
						<X className="h-4 w-4" />
					</ToolbarButton>
					<div className="w-px h-6 bg-border mx-1" />
					<ToolbarButton
						onClick={() => editor.chain().focus().addColumnBefore().run()}
						title="Добавить столбец слева"
					>
						<ArrowLeft className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().addColumnAfter().run()}
						title="Добавить столбец справа"
					>
						<ArrowRight className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().deleteColumn().run()}
						title="Удалить столбец"
						disabled={!editor.can().deleteColumn()}
					>
						<X className="h-4 w-4" />
					</ToolbarButton>
					<div className="w-px h-6 bg-border mx-1" />
					<ToolbarButton
						onClick={() => editor.chain().focus().deleteTable().run()}
						title="Удалить таблицу"
						disabled={!editor.can().deleteTable()}
					>
						<Trash2 className="h-4 w-4" />
					</ToolbarButton>
				</div>
			)}
			<div className="min-h-50 max-h-150 overflow-y-auto">
				<EditorContent editor={editor} />
				<style>{`
					.ProseMirror {
						outline: none;
					}
					.ProseMirror h1 {
						font-size: 2em;
						font-weight: 700;
						margin-top: 0.67em;
						margin-bottom: 0.67em;
					}
					.ProseMirror h2 {
						font-size: 1.5em;
						font-weight: 600;
						margin-top: 0.83em;
						margin-bottom: 0.83em;
					}
					.ProseMirror h3 {
						font-size: 1.17em;
						font-weight: 600;
						margin-top: 1em;
						margin-bottom: 1em;
					}
					.ProseMirror ul,
					.ProseMirror ol {
						padding-left: 1.5em;
						margin: 0.5em 0;
					}
					.ProseMirror ul {
						list-style-type: disc;
					}
					.ProseMirror ol {
						list-style-type: decimal;
					}
					.ProseMirror li {
						margin: 0.25em 0;
					}
					.ProseMirror table {
						border-collapse: collapse;
						margin: 1em 0;
						overflow: visible;
						table-layout: fixed;
						width: 100%;
						border: 2px solid #e5e7eb;
						background-color: hsl(var(--background));
					}
					.ProseMirror table td,
					.ProseMirror table th {
						min-width: 1em;
						border: 1px solid #e5e7eb;
						padding: 8px 12px;
						vertical-align: top;
						box-sizing: border-box;
						position: relative;
						background-color: hsl(var(--background));
					}
					.ProseMirror table th {
						font-weight: 600;
						background-color: hsl(var(--muted));
						text-align: left;
						color: hsl(var(--foreground));
						border: 1px solid #e5e7eb;
					}
					.ProseMirror table td {
						color: hsl(var(--foreground));
						border: 1px solid #e5e7eb;
					}
					.ProseMirror table tbody tr {
						border-top: 1px solid #e5e7eb;
					}
					.ProseMirror table thead tr {
						border-bottom: 2px solid #e5e7eb;
					}
					.dark .ProseMirror table {
						border-color: #4b5563;
					}
					.dark .ProseMirror table td,
					.dark .ProseMirror table th {
						border-color: #4b5563;
					}
					.dark .ProseMirror table tbody tr {
						border-color: #4b5563;
					}
					.dark .ProseMirror table thead tr {
						border-color: #4b5563;
					}
					.ProseMirror table .selectedCell:after {
						z-index: 2;
						position: absolute;
						content: "";
						left: 0; right: 0; top: 0; bottom: 0;
						background: rgba(200, 200, 255, 0.4);
						pointer-events: none;
					}
					.ProseMirror table .column-resize-handle {
						position: absolute;
						right: -2px;
						top: 0;
						bottom: -2px;
						width: 4px;
						background-color: hsl(var(--primary));
						pointer-events: none;
					}
				`}</style>
			</div>
		</div>
	)
}
