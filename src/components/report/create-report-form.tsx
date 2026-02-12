"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin, Loader2, WifiOff, AlertTriangle } from "lucide-react"
import { CATEGORIES } from "@/lib/types"
import { useOfflineDraft } from "@/hooks/use-offline-draft"
import { DuplicateGuard } from "./duplicate-guard"
import { createReport } from "@/lib/actions/reports"
import { uploadPhoto } from "@/lib/actions/upload"
import { toast } from "sonner"

export function CreateReportForm() {
  const [isPending, startTransition] = useTransition()
  const { draft, hasDraft, isOffline, saveDraft, clearDraft } = useOfflineDraft()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [isExactLocation, setIsExactLocation] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  // Restore draft on mount
  useEffect(() => {
    if (hasDraft && draft) {
      setTitle(draft.title || "")
      setDescription(draft.description || "")
      setCategory(draft.category || "")
      setLocationLabel(draft.location_label || "")
      if (draft.location_lat) setLocationLat(draft.location_lat)
      if (draft.location_lng) setLocationLng(draft.location_lng)
      if (draft.location_is_exact) setIsExactLocation(draft.location_is_exact)
      toast.info("Draft restored! You can continue where you left off.")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft when offline or periodically
  useEffect(() => {
    if (!title && !description) return
    const timer = setTimeout(() => {
      saveDraft({
        title,
        description,
        category,
        location_lat: locationLat,
        location_lng: locationLng,
        location_is_exact: isExactLocation,
        location_label: locationLabel,
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, description, category, locationLat, locationLng, isExactLocation, locationLabel, saveDraft])

  // Check duplicates when title changes
  useEffect(() => {
    if (title.length >= 5) {
      setShowDuplicates(true)
    } else {
      setShowDuplicates(false)
    }
  }, [title])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLat(position.coords.latitude)
        setLocationLng(position.coords.longitude)
        setGettingLocation(false)
        toast.success("Location captured!")
      },
      () => {
        setGettingLocation(false)
        toast.error("Unable to get your location.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.")
      return
    }

    // Client-side compression
    try {
      const imageCompression = (await import("browser-image-compression")).default
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      setPhoto(compressed as unknown as File)
      setPhotoPreview(URL.createObjectURL(compressed))
    } catch {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isOffline) {
      saveDraft({ title, description, category, location_lat: locationLat, location_lng: locationLng, location_is_exact: isExactLocation, location_label: locationLabel })
      toast.warning("You're offline. Draft saved! Submit when you're back online.")
      return
    }

    if (title.length < 3 || title.length > 200) {
      toast.error("Title must be between 3 and 200 characters.")
      return
    }
    if (!description.trim()) {
      toast.error("Description is required.")
      return
    }
    if (!category) {
      toast.error("Please select a category.")
      return
    }

    startTransition(async () => {
      let photoPath: string | undefined

      if (photo) {
        const formData = new FormData()
        formData.append("file", photo)
        const uploadResult = await uploadPhoto(formData)
        if ("error" in uploadResult) {
          toast.error(uploadResult.error)
          return
        }
        photoPath = uploadResult.path
      }

      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("category", category)
      if (locationLat != null) formData.append("location_lat", String(locationLat))
      if (locationLng != null) formData.append("location_lng", String(locationLng))
      formData.append("location_is_exact", String(isExactLocation))
      if (locationLabel) formData.append("location_label", locationLabel)
      if (photoPath) formData.append("photo_path", photoPath)

      const result = await createReport(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        clearDraft()
        toast.success("Report created successfully!")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-3 text-sm">
          <WifiOff className="h-4 w-4 text-warning shrink-0" />
          <span>You&apos;re offline. Your draft will be saved and you can submit when back online.</span>
        </div>
      )}

      {/* Draft restored banner */}
      {hasDraft && !isOffline && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-info bg-info/10 p-3 text-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-info shrink-0" />
            Draft ready to submit
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={clearDraft}>
            Discard draft
          </Button>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Brief description of the issue..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
        <p className="text-xs text-muted-foreground">{title.length}/200</p>
      </div>

      {/* Duplicate guard */}
      {showDuplicates && (
        <DuplicateGuard title={title} lat={locationLat} lng={locationLng} />
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Provide details about the issue, its location, and any relevant context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <Label>Photo (optional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          aria-label="Upload photo"
        >
          {photoPreview ? (
            <div className="relative w-full max-w-sm mx-auto h-48">
              <Image
                src={photoPreview}
                alt="Preview of selected photo"
                fill
                className="rounded-lg object-contain"
                unoptimized
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setPhoto(null)
                  setPhotoPreview(null)
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="h-8 w-8" />
              <span className="text-sm">Click to upload a photo</span>
              <span className="text-xs">JPEG, PNG, WebP &middot; Max 5MB</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location (optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <MapPin className="h-4 w-4 mr-1" />
              )}
              Get My Location
            </Button>
            {locationLat && (
              <Badge variant="secondary" className="text-xs">
                {locationLat.toFixed(4)}, {locationLng?.toFixed(4)}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-label">Location Label</Label>
            <Input
              id="location-label"
              placeholder="e.g., Main Street near the park"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
            />
          </div>

          {locationLat && (
            <div className="flex items-center gap-3">
              <Switch
                id="exact-location"
                checked={isExactLocation}
                onCheckedChange={setIsExactLocation}
              />
              <Label htmlFor="exact-location" className="text-sm cursor-pointer">
                Share exact pin location
              </Label>
              {!isExactLocation && (
                <Badge variant="outline" className="text-xs">
                  Approximate area (~100m)
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || isOffline}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : isOffline ? (
          "Offline - Draft Saved"
        ) : (
          "Submit Report"
        )}
      </Button>
    </form>
  )
}
