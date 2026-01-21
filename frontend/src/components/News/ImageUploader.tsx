import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent
} from '@dnd-kit/core'
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Image as ImageIcon, Star, Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { type NewsImagePublic } from '@/client'
import { Button } from '@/components/ui/button'
import useCustomToast from '@/hooks/useCustomToast'
import { cn } from '@/lib/utils'
import { getImageFileUrl } from '@/utils/fileUrls'

type NewsImagePublicWithPreview = NewsImagePublic & {
	previewUrl?: string // For new images not yet uploaded
}

interface ImageUploaderProps {
	newsId: string
	images: NewsImagePublicWithPreview[]
	onUpload: (file: File) => void | Promise<void>
	onDelete: (imageId: string) => void | Promise<void>
	onReorder: (imageId: string, newOrder: number) => void | Promise<void>
	maxImages?: number
	maxSize?: number
	acceptedTypes?: string[]
}

function SortableImageItem({
	image,
	newsId,
	onDelete,
	isDeleting
}: {
	image: NewsImagePublicWithPreview
	newsId: string
	onDelete: (e?: React.MouseEvent) => void
	isDeleting: boolean
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: image.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1
	}

	// Use preview URL for new images, otherwise use service URL
	const imageUrl =
		image.previewUrl || getImageFileUrl(newsId, image.id)

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'relative group rounded-lg border overflow-hidden bg-muted',
				isDragging && 'ring-2 ring-primary'
			)}
		>
			<img
				src={imageUrl}
				alt={image.file_name}
				className="w-full h-32 object-cover"
			/>
			{image.is_main && (
				<div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1.5 z-10">
					<Star className="size-3 fill-white" />
				</div>
			)}
			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2">
				<Button
					type="button"
					variant="destructive"
					size="icon"
					className="opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={e => {
						e.preventDefault()
						e.stopPropagation()
						e.nativeEvent.stopImmediatePropagation()
						onDelete(e)
					}}
					disabled={isDeleting}
				>
					<X className="size-4" />
				</Button>
			</div>
			<div
				{...attributes}
				{...listeners}
				className="absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-black/50 text-white rounded px-2 py-1 text-xs"
				onClick={e => {
					e.preventDefault()
					e.stopPropagation()
				}}
			>
				⋮⋮
			</div>
		</div>
	)
}

export function ImageUploader({
	newsId,
	images,
	onUpload,
	onDelete,
	onReorder,
	maxImages = 10,
	maxSize = 10 * 1024 * 1024, // 10MB
	acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploaderProps) {
	const [uploading, setUploading] = useState(false)
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
	const { showErrorToast } = useCustomToast()

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	)

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (images.length + acceptedFiles.length > maxImages) {
				showErrorToast(`Максимум ${maxImages} изображений`)
				return
			}

			setUploading(true)
			try {
				for (const file of acceptedFiles) {
					if (file.size > maxSize) {
						showErrorToast(
							`Файл ${file.name} слишком большой (максимум ${maxSize / 1024 / 1024}MB)`
						)
						continue
					}
					try {
						const result = onUpload(file)
						// Wait for Promise if onUpload returns one
						if (result instanceof Promise) {
							await result
						}
					} catch (error) {
						console.error('Error uploading image:', error)
						showErrorToast(
							`Ошибка загрузки ${file.name}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
						)
					}
				}
			} finally {
				setUploading(false)
			}
		},
		[images.length, maxImages, maxSize, onUpload, showErrorToast]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
		maxSize,
		disabled: uploading || images.length >= maxImages
	})

	const handleDeleteClick = async (imageId: string, e?: React.MouseEvent) => {
		// Prevent form events from bubbling
		if (e) {
			e.preventDefault()
			e.stopPropagation()
			e.nativeEvent.stopImmediatePropagation()
		}

		setDeletingIds(prev => new Set(prev).add(imageId))
		try {
			const result = onDelete(imageId)
			// Wait for Promise if onDelete returns one
			if (result instanceof Promise) {
				await result
			}
		} finally {
			setDeletingIds(prev => {
				const next = new Set(prev)
				next.delete(imageId)
				return next
			})
		}
	}

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event

		if (!over || active.id === over.id) {
			return
		}

		// Sort images by order to correctly determine indices
		const sortedImages = [...images].sort((a, b) => a.order - b.order)

		const oldIndex = sortedImages.findIndex(img => img.id === active.id)
		const newIndex = sortedImages.findIndex(img => img.id === over.id)

		if (oldIndex !== -1 && newIndex !== -1) {
			// Use newIndex as new order to enable cyclic dragging
			const newOrder = newIndex
			const result = onReorder(sortedImages[oldIndex].id, newOrder)
			// Wait for Promise if onReorder returns one
			if (result instanceof Promise) {
				await result
			}
		}
	}

	const sortedImages = [...images].sort((a, b) => a.order - b.order)

	return (
		<div
			className="space-y-4"
			data-image-uploader
			onClick={e => {
				// Prevent form submission on clicks inside ImageUploader
				e.stopPropagation()
			}}
			onKeyDown={e => {
				// Prevent form submission on Enter key inside ImageUploader
				if (e.key === 'Enter') {
					e.stopPropagation()
				}
			}}
		>
			<div
				{...getRootProps()}
				className={cn(
					'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
					isDragActive && 'border-primary bg-primary/5',
					uploading && 'opacity-50 cursor-not-allowed',
					images.length >= maxImages && 'opacity-50 cursor-not-allowed'
				)}
			>
				<input {...getInputProps()} />
				<div className="flex flex-col items-center gap-2">
					<Upload className="size-8 text-muted-foreground" />
					<div>
						<p className="text-sm font-medium">
							{isDragActive
								? 'Отпустите файлы здесь'
								: 'Перетащите изображения сюда или нажмите для выбора'}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{images.length}/{maxImages} изображений
						</p>
					</div>
				</div>
			</div>

			{sortedImages.length > 0 && (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={sortedImages.map(img => img.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{sortedImages.map(image => (
								<SortableImageItem
									key={image.id}
									image={image}
									newsId={newsId}
									onDelete={e => handleDeleteClick(image.id, e)}
									isDeleting={deletingIds.has(image.id)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			)}

			{sortedImages.length === 0 && !uploading && (
				<div className="text-center text-muted-foreground py-8">
					<ImageIcon className="size-12 mx-auto mb-2 opacity-50" />
					<p className="text-sm">Нет загруженных изображений</p>
				</div>
			)}
		</div>
	)
}
