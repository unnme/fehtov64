import { useEffect, useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { type DocumentCategoryPublic, type DocumentPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DocumentsFiltersProps {
  documents: DocumentPublic[]
  categories: DocumentCategoryPublic[]
  onFilterChange: (filtered: DocumentPublic[]) => void
}

export function DocumentsFilters({
  documents,
  categories,
  onFilterChange,
}: DocumentsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedExtension, setSelectedExtension] = useState<string>("all")

  // Get unique file extensions from documents
  const extensions = useMemo(() => {
    const extSet = new Set<string>()
    documents.forEach((doc) => {
      const ext = doc.file_name.split(".").pop()?.toUpperCase() || ""
      if (ext) extSet.add(ext)
    })
    return Array.from(extSet).sort()
  }, [documents])

  // Filter documents based on search query, category, and extension
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Filter by search query (name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.file_name.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => {
        if (selectedCategory === "__none__") {
          return !doc.category_id
        }
        return doc.category_id === selectedCategory
      })
    }

    // Filter by extension
    if (selectedExtension !== "all") {
      filtered = filtered.filter((doc) => {
        const ext = doc.file_name.split(".").pop()?.toUpperCase() || ""
        return ext === selectedExtension
      })
    }

    return filtered
  }, [documents, searchQuery, selectedCategory, selectedExtension])

  // Notify parent component about filtered results
  useEffect(() => {
    onFilterChange(filteredDocuments)
  }, [filteredDocuments, onFilterChange])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedExtension !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedExtension("all")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border-b bg-muted/20">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени документа..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-full sm:w-50">
          <SelectValue placeholder="Все категории" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все категории</SelectItem>
          <SelectItem value="__none__">Без категории</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedExtension} onValueChange={setSelectedExtension}>
        <SelectTrigger className="w-full sm:w-45">
          <SelectValue placeholder="Все расширения" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все расширения</SelectItem>
          {extensions.map((ext) => (
            <SelectItem key={ext} value={ext}>
              .{ext}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Сбросить
        </Button>
      )}
    </div>
  )
}
