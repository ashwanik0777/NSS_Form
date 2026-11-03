"use client"

import { useState } from "react"
import {
  MapPin,
  Search,
  Crosshair,
  ExternalLink,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react"

interface EventLocationPickerProps {
  locationAddress: string
  onChangeAddress: (val: string) => void
  latitude: string
  onChangeLatitude: (val: string) => void
  longitude: string
  onChangeLongitude: (val: string) => void
  radius?: string | number
  onChangeRadius?: (val: string) => void
}

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  name?: string
}

export default function EventLocationPicker({
  locationAddress,
  onChangeAddress,
  latitude,
  onChangeLatitude,
  longitude,
  onChangeLongitude,
  radius = "50",
  onChangeRadius,
}: EventLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  const [pastedInput, setPastedInput] = useState("")
  const [pasteSuccessMessage, setPasteSuccessMessage] = useState<string | null>(null)
  const [pasteErrorMessage, setPasteErrorMessage] = useState<string | null>(null)

  const [locatingCurrent, setLocatingCurrent] = useState(false)
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  const hasCoordinates =
    Boolean(latitude && longitude) &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude))

  const latNum = hasCoordinates ? parseFloat(latitude) : 0
  const lngNum = hasCoordinates ? parseFloat(longitude) : 0

  // 1. Search for Place / Address via OpenStreetMap Nominatim
  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch ?? searchQuery ?? locationAddress).trim()
    if (!q) {
      setSearchError("Please type a location or address to search")
      return
    }

    setSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q,
      )}&limit=5&addressdetails=1`
      const res = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
        },
      })
      const data: SearchResult[] = await res.json()

      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data)
      } else {
        setSearchError("No locations found. Try a broader search term (e.g. city or landmark).")
      }
    } catch (err: any) {
      console.error("Geocoding search error:", err)
      setSearchError("Search failed. Please check your connection or enter coordinates directly.")
    } finally {
      setSearching(false)
    }
  }

  // Select place from search
  const handleSelectResult = (result: SearchResult) => {
    onChangeLatitude(result.lat)
    onChangeLongitude(result.lon)
    if (!locationAddress.trim()) {
      onChangeAddress(result.display_name)
    }
    setSearchResults([])
    setSearchQuery("")
    setSearchError(null)
  }

  // 2. Parse Google Maps Link or Coordinates string
  const handleParseGoogleMapsOrCoords = () => {
    setPasteErrorMessage(null)
    setPasteSuccessMessage(null)

    const text = pastedInput.trim()
    if (!text) {
      setPasteErrorMessage("Please paste a Google Maps link or coordinates")
      return
    }

    // Pattern A: standard "lat, lng" e.g. "23.0371, 72.5528" or "23.0371 72.5528"
    const coordPattern = /(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/
    // Pattern B: Google maps URL with @lat,lng e.g. /@23.0371,72.5528,17z/
    const urlPatternAt = /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/
    // Pattern C: Google maps URL with query ?q=lat,lng or query=lat,lng
    const urlPatternQ = /[?&](?:q|query|ll)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/

    let match = text.match(urlPatternAt)
    if (!match) match = text.match(urlPatternQ)
    if (!match) match = text.match(coordPattern)

    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onChangeLatitude(lat.toFixed(6))
        onChangeLongitude(lng.toFixed(6))
        setPasteSuccessMessage(`Coordinates applied: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        setPastedInput("")
        return
      }
    }

    setPasteErrorMessage(
      "Could not find coordinates. Please paste coordinates like '23.0371, 72.5528' or a Google Maps link.",
    )
  }

  // 3. Get Current Device Location via GPS
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationFeedback("Geolocation is not supported by your browser.")
      return
    }

    setLocatingCurrent(true)
    setLocationFeedback(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = Math.round(pos.coords.accuracy || 0)

        onChangeLatitude(lat.toFixed(6))
        onChangeLongitude(lng.toFixed(6))
        setLocationFeedback(`Captured GPS location (accuracy: ±${acc}m)`)

        // Try reverse geocoding if address is empty
        if (!locationAddress.trim()) {
          try {
            const revRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            )
            const revData = await revRes.json()
            if (revData?.display_name) {
              onChangeAddress(revData.display_name)
            }
          } catch {
            // Address remains optional
          }
        }
        setLocatingCurrent(false)
      },
      (err) => {
        setLocatingCurrent(false)
        setLocationFeedback(`Location error: ${err.message}. Please check browser GPS permissions.`)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  }

  // Clear coordinates
  const handleClear = () => {
    onChangeLatitude("")
    onChangeLongitude("")
    setSearchResults([])
    setSearchError(null)
    setPasteSuccessMessage(null)
    setPasteErrorMessage(null)
    setLocationFeedback(null)
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Attendance Location & Geofencing (50m Radius)
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Volunteers must be within 50 meters of these coordinates to submit attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {showGuide ? "Hide Guide" : "How to get Lat/Long?"}
        </button>
      </div>

      {/* Guide accordion */}
      {showGuide && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
          <p className="font-semibold mb-1">How to get Latitude & Longitude easily:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>
              <strong>Search by place name:</strong> Use the search box below to find colleges, halls, or landmarks.
            </li>
            <li>
              <strong>From Google Maps:</strong> Open Google Maps on phone or desktop, find the exact spot,
              right-click (or long press on mobile) &rarr; tap the numbers to copy them (e.g.{" "}
              <code>23.0371, 72.5528</code>) &rarr; paste in the Google Maps box below.
            </li>
            <li>
              <strong>If you are on-site:</strong> Click <em>Use My GPS Location</em> below to grab your live coordinates.
            </li>
          </ol>
        </div>
      )}

      {/* Location Address input */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          Event Venue / Address Text
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationAddress}
            onChange={(e) => onChangeAddress(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g. Auditorium Hall, GTU Campus, Ahmedabad"
          />
          {locationAddress.trim() && (
            <button
              type="button"
              onClick={() => handleSearch(locationAddress)}
              disabled={searching}
              className="px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Search coordinates for this address"
            >
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Find Coordinates
            </button>
          )}
        </div>
      </div>

      {/* Tool 1 & Tool 2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Method 1: Search Place / Address */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <label className="block text-xs font-medium text-foreground">
            Search Place / Landmark
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSearch()
                }
              }}
              className="flex-1 px-2.5 py-1.5 text-xs border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Civil Hospital, Rajkot"
            />
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={searching}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </button>
          </div>

          {searchError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {searchError}
            </p>
          )}

          {/* Search Results list */}
          {searchResults.length > 0 && (
            <div className="border border-border rounded-lg divide-y divide-border bg-background max-h-40 overflow-y-auto">
              {searchResults.map((res) => (
                <button
                  key={res.place_id}
                  type="button"
                  onClick={() => handleSelectResult(res)}
                  className="w-full text-left p-2 hover:bg-muted/50 transition-colors text-xs flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-foreground line-clamp-1">
                    {res.name || res.display_name.split(",")[0]}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {res.display_name}
                  </span>
                  <span className="text-[10px] text-primary">
                    Lat: {parseFloat(res.lat).toFixed(5)}, Lng: {parseFloat(res.lon).toFixed(5)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Method 2: Paste Google Maps Link or Lat,Lng */}
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <label className="block text-xs font-medium text-foreground">
            Paste Google Maps Link / Lat, Long
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={pastedInput}
              onChange={(e) => setPastedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleParseGoogleMapsOrCoords()
                }
              }}
              className="flex-1 px-2.5 py-1.5 text-xs border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="e.g. 23.0371, 72.5528 or Google Maps URL"
            />
            <button
              type="button"
              onClick={handleParseGoogleMapsOrCoords}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-medium transition-colors"
            >
              Apply
            </button>
          </div>

          {pasteSuccessMessage && (
            <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              {pasteSuccessMessage}
            </p>
          )}
          {pasteErrorMessage && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {pasteErrorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Method 3: GPS Button + Direct Lat/Lng Input & Radius */}
      <div className="bg-card rounded-lg border border-border p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground">Coordinates & Geofence Boundary</span>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locatingCurrent}
            className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {locatingCurrent ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            Use My GPS Location
          </button>
        </div>

        {locationFeedback && (
          <p className="text-xs text-muted-foreground italic">{locationFeedback}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => onChangeLatitude(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="e.g. 23.037123"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => onChangeLongitude(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="e.g. 72.552841"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Allowed Radius (meters)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="2000"
                value={radius}
                onChange={(e) => onChangeRadius?.(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                placeholder="50"
              />
              <span className="text-xs text-muted-foreground font-medium">meters</span>
            </div>
          </div>
        </div>

        {/* Radius quick presets */}
        {onChangeRadius && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground mr-1">Quick Radius:</span>
            {[
              { val: "50", label: "50m (Recommended / Default)" },
              { val: "100", label: "100m (Large Building)" },
              { val: "150", label: "150m (Campus Ground)" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onChangeRadius(preset.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  String(radius) === preset.val
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Geofence & Map Preview */}
      {hasCoordinates ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                50m Geofencing Active
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {latNum.toFixed(5)}, {lngNum.toFixed(5)} (&plusmn;{radius || 50}m)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                Verify in Google Maps
              </a>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>

          {/* Embedded OpenStreetMap Preview */}
          <div className="relative w-full h-44 rounded-lg overflow-hidden border border-border bg-muted/40">
            <iframe
              title="Event Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.003}%2C${
                latNum - 0.002
              }%2C${lngNum + 0.003}%2C${latNum + 0.002}&layer=mapnik&marker=${latNum}%2C${lngNum}`}
              className="border-0"
            />
            <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-xs text-[10px] px-1.5 py-0.5 rounded text-muted-foreground border border-border">
              Radius: {radius || 50}m
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            No coordinates set yet. Volunteers will be able to mark attendance from anywhere. Set coordinates above to enforce the 50-meter venue radius.
          </span>
        </div>
      )}
    </div>
  )
}

