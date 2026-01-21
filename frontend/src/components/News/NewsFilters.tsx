import { format, isValid, parse } from "date-fns"
import { Calendar, Plus, Search, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { type NewsPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NewsFiltersProps {
  news: NewsPublic[]
  onFilterChange: (filtered: NewsPublic[]) => void
}

export function NewsFilters({ news, onFilterChange }: NewsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [publishedStatus, setPublishedStatus] = useState<string>("all")
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedDateTo, setSelectedDateTo] = useState<string>("")
  const [showDateTo, setShowDateTo] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const dateToInputRef = useRef<HTMLInputElement>(null)
  
  // Get unique authors from news (exclude Guardian system user)
  const authors = useMemo(() => {
    const authorMap = new Map<string, { id: string; name: string }>()
    news.forEach((item) => {
      if (item.owner && item.owner_id) {
        // Exclude Guardian system user
        if (item.owner.email === "guardian@system.example.com") {
          return
        }
        const authorName = item.owner.full_name || item.owner.email
        if (!authorMap.has(item.owner_id)) {
          authorMap.set(item.owner_id, {
            id: item.owner_id,
            name: authorName,
          })
        }
      }
    })
    return Array.from(authorMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [news])

  // Filter news based on search query, published status, and date
  const filteredNews = useMemo(() => {
    let filtered = news

    // Filter by search query (title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      )
    }

    // Filter by published status
    if (publishedStatus !== "all") {
      const isPublished = publishedStatus === "published"
      filtered = filtered.filter((item) => item.is_published === isPublished)
    }

    // Filter by author
    if (selectedAuthor !== "all") {
      filtered = filtered.filter((item) => item.owner_id === selectedAuthor)
    }

    // Filter by date range or exact date (using created_at)
    if (selectedDate.trim()) {
      const parsedDateFrom = parse(selectedDate.trim(), "dd.MM.yyyy", new Date())
      
      if (isValid(parsedDateFrom)) {
        // If second date is set, filter by date range
        if (showDateTo && selectedDateTo.trim()) {
          const parsedDateTo = parse(selectedDateTo.trim(), "dd.MM.yyyy", new Date())
          
          if (isValid(parsedDateTo)) {
            parsedDateFrom.setHours(0, 0, 0, 0)
            parsedDateTo.setHours(23, 59, 59, 999)
            
            filtered = filtered.filter((item) => {
              const createdAt = item.created_at
              if (!createdAt) {
                return false
              }

              const createdDate = new Date(createdAt)
              createdDate.setHours(0, 0, 0, 0)

              return createdDate >= parsedDateFrom && createdDate <= parsedDateTo
            })
          }
        } else {
          // Filter by exact date
          filtered = filtered.filter((item) => {
            const createdAt = item.created_at
            if (!createdAt) {
              return false
            }

            const createdDate = new Date(createdAt)
            createdDate.setHours(0, 0, 0, 0)
            parsedDateFrom.setHours(0, 0, 0, 0)

            return createdDate.getTime() === parsedDateFrom.getTime()
          })
        }
      }
    }

    return filtered
  }, [news, searchQuery, publishedStatus, selectedAuthor, selectedDate, selectedDateTo, showDateTo])

  // Notify parent component about filtered results
  useEffect(() => {
    onFilterChange(filteredNews)
  }, [filteredNews, onFilterChange])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    publishedStatus !== "all" ||
    selectedAuthor !== "all" ||
    selectedDate !== "" ||
    selectedDateTo !== ""

  const clearFilters = () => {
    setSearchQuery("")
    setPublishedStatus("all")
    setSelectedAuthor("all")
    setSelectedDate("")
    setSelectedDateTo("")
    setShowDateTo(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-muted/20">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или тексту новости..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={publishedStatus} onValueChange={setPublishedStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Статус публикации" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все новости</SelectItem>
            <SelectItem value="published">Опубликованные</SelectItem>
            <SelectItem value="unpublished">Неопубликованные</SelectItem>
          </SelectContent>
        </Select>

        {authors.length > 0 && (
          <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Автор" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все авторы</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-[120px]">
            <Input
              type="text"
              placeholder="дд.мм.гггг"
              value={selectedDate}
              onChange={(e) => {
                const value = e.target.value
                const cleaned = value.replace(/[^\d.]/g, "").slice(0, 10)
                let formatted = cleaned
                if (cleaned.length > 2 && cleaned[2] !== ".") {
                  formatted = cleaned.slice(0, 2) + "." + cleaned.slice(2)
                }
                if (formatted.length > 5 && formatted[5] !== ".") {
                  formatted = formatted.slice(0, 5) + "." + formatted.slice(5)
                }
                setSelectedDate(formatted)
              }}
              className="pr-8"
            />
            <input
              type="date"
              ref={dateInputRef}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  const date = new Date(value)
                  setSelectedDate(format(date, "dd.MM.yyyy"))
                } else {
                  setSelectedDate("")
                }
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (dateInputRef.current) {
                  if (selectedDate) {
                    const parsed = parse(selectedDate, "dd.MM.yyyy", new Date())
                    if (isValid(parsed)) {
                      dateInputRef.current.value = format(parsed, "yyyy-MM-dd")
                    }
                  }
                  if (dateInputRef.current.showPicker) {
                    dateInputRef.current.showPicker()
                  } else {
                    dateInputRef.current.click()
                  }
                }
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {!showDateTo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDateTo(true)
                // Set default value to today's date
                setSelectedDateTo(format(new Date(), "dd.MM.yyyy"))
              }}
              className="h-9 px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {showDateTo && (
            <>
              <span className="text-muted-foreground">-</span>
              <div className="relative w-[120px]">
                <Input
                  type="text"
                  placeholder="дд.мм.гггг"
                  value={selectedDateTo}
                  onChange={(e) => {
                    const value = e.target.value
                    const cleaned = value.replace(/[^\d.]/g, "").slice(0, 10)
                    let formatted = cleaned
                    if (cleaned.length > 2 && cleaned[2] !== ".") {
                      formatted = cleaned.slice(0, 2) + "." + cleaned.slice(2)
                    }
                    if (formatted.length > 5 && formatted[5] !== ".") {
                      formatted = formatted.slice(0, 5) + "." + formatted.slice(5)
                    }
                    setSelectedDateTo(formatted)
                  }}
                  className="pr-8"
                />
                <input
                  type="date"
                  ref={dateToInputRef}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value) {
                      const date = new Date(value)
                      setSelectedDateTo(format(date, "dd.MM.yyyy"))
                    } else {
                      setSelectedDateTo("")
                    }
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (dateToInputRef.current) {
                      if (selectedDateTo) {
                        const parsed = parse(selectedDateTo, "dd.MM.yyyy", new Date())
                        if (isValid(parsed)) {
                          dateToInputRef.current.value = format(parsed, "yyyy-MM-dd")
                        }
                      }
                      if (dateToInputRef.current.showPicker) {
                        dateToInputRef.current.showPicker()
                      } else {
                        dateToInputRef.current.click()
                      }
                    }
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </>
          )}
        </div>

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
    </div>
  )
}
