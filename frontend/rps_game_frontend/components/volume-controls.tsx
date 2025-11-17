"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Music, MousePointer } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

export function VolumeControls() {
  const [isMuted, setIsMuted] = useState(false)
  const [musicVolume, setMusicVolume] = useState([70])
  const [sfxVolume, setSfxVolume] = useState([80])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="glassmorphism neon-border bg-transparent">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glassmorphism neon-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Audio Controls</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-secondary" />
                <label className="text-sm font-medium">Background Music</label>
              </div>
              <Slider
                value={musicVolume}
                onValueChange={setMusicVolume}
                max={100}
                step={1}
                className="w-full"
                disabled={isMuted}
              />
              <div className="text-xs text-muted-foreground text-right">{musicVolume[0]}%</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-accent" />
                <label className="text-sm font-medium">Touch Sounds</label>
              </div>
              <Slider
                value={sfxVolume}
                onValueChange={setSfxVolume}
                max={100}
                step={1}
                className="w-full"
                disabled={isMuted}
              />
              <div className="text-xs text-muted-foreground text-right">{sfxVolume[0]}%</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">Audio controls for immersive gaming experience</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
